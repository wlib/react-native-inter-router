import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { forwardRef, useState } from 'react'
import {
  RoutingProvider,
  usePathname as useContextPathname,
  useRouter as useContextRouter,
  type LinkOutputProps,
  type WebLinkOutputProps,
} from '../../index'
import { defineAdapter } from '../../adapter/define-adapter'
import type { AdapterLinkProps } from '../../adapter/types'
import { createMemoryRouting } from '../../adapters/memory'
import { createRouting } from '../create-routing'

describe('memory-bound routing', () => {
  it('exposes a split, decoded location and platform history', () => {
    const routing = createMemoryRouting({
      initialEntries: ['/users/a%20b?tag=one&tag=two###profile'],
      routes: ['/users/[id]'],
    })
    const { result } = renderHook(() => ({
      location: routing.useLocation(),
      query: routing.useSearchParamsObject(),
      platform: routing.usePlatformRouter(),
    }))

    expect(result.current.location.pathname).toBe('/users/a%20b')
    expect(result.current.location.params).toEqual({ id: 'a b' })
    expect(result.current.query).toEqual({ tag: ['one', 'two'] })
    expect(result.current.location.hash).toBe('profile')
    expect(result.current.platform).toBe(routing.history)
  })

  it('navigates, tracks state, and reports all capabilities', () => {
    const routing = createMemoryRouting()
    const { result } = renderHook(() => ({
      router: routing.useRouter(),
      pathname: routing.usePathname(),
    }))

    act(() =>
      result.current.router.push(
        { pathname: '/users/[id]', params: { id: 7 } },
        { state: { from: '/' } },
      ),
    )
    expect(result.current.pathname).toBe('/users/7')
    expect(routing.history.current.state).toEqual({ from: '/' })
    act(() => result.current.router.replace('/account'))
    act(() => result.current.router.back())
    act(() => result.current.router.forward())
    act(() => result.current.router.refresh())
    result.current.router.prefetch('/future')

    expect(result.current.router.adapterName).toBe('memory')
    expect(result.current.router.capabilities).toEqual({
      forward: true,
      refresh: true,
      prefetch: true,
      scroll: false,
      state: true,
      hash: true,
      canGoBack: true,
    })
    expect(routing.history.log.at(-1)).toEqual({
      type: 'prefetch',
      url: '/future',
    })
  })

  it('patches search params without needless navigations', () => {
    const routing = createMemoryRouting({ initialEntries: ['/list?a=1&b=2'] })
    const { result } = renderHook(() => ({
      update: routing.useUpdateSearchParams(),
      search: routing.useSearchParams(),
      object: routing.useSearchParamsObject(),
    }))
    const original = result.current.search

    act(() => result.current.update({ a: '3', b: undefined }))
    expect(result.current.object).toEqual({ a: '3' })
    expect(original.toString()).toBe('a=1&b=2')
    const actionCount = routing.history.log.length
    act(() => result.current.update({ a: '3' }))
    expect(routing.history.log).toHaveLength(actionCount)
    act(() => result.current.update({ a: '4' }, { method: 'push' }))
    expect(routing.history.entries).toHaveLength(2)
  })

  it('composes back-to-back search patches and reconciles real locations', () => {
    const routing = createMemoryRouting({ initialEntries: ['/list?a=1'] })
    const { result } = renderHook(() => ({
      update: routing.useUpdateSearchParams(),
      object: routing.useSearchParamsObject(),
    }))

    act(() => {
      result.current.update({ a: '2', first: 'yes' })
      result.current.update((current) => {
        expect(current.toString()).toBe('a=2&first=yes')
        current.set('second', 'yes')
        return current
      })
    })
    expect(result.current.object).toEqual({
      a: '2',
      first: 'yes',
      second: 'yes',
    })

    act(() => routing.history.push('/other?external=1'))
    act(() => result.current.update({ added: 'after-navigation' }))
    expect(result.current.object).toEqual({
      external: '1',
      added: 'after-navigation',
    })
  })

  it('matches active routes and replaces through Redirect', () => {
    const routing = createMemoryRouting({ initialEntries: ['/users/42'] })
    const { result } = renderHook(() => ({
      prefix: routing.useActiveRoute('/users'),
      exact: routing.useActiveRoute('/users', { exact: true }),
    }))
    expect(result.current).toEqual({ prefix: true, exact: false })

    render(<routing.Redirect href="/new" />)
    expect(routing.history.entries).toHaveLength(1)
    expect(routing.history.current.url).toBe('/new')
  })
})

describe('adapter resolution and stable wrappers', () => {
  it('requires either a provider or a bound adapter', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useContextPathname())).toThrow(
      /No routing adapter/,
    )
    error.mockRestore()
  })

  it('lets a provider override a statically bound adapter', () => {
    const bound = createMemoryRouting({ initialEntries: ['/bound'] })
    const override = createMemoryRouting({ initialEntries: ['/override'] })
    const { result } = renderHook(() => bound.usePathname(), {
      wrapper: ({ children }) => (
        <RoutingProvider adapter={override.adapter}>{children}</RoutingProvider>
      ),
    })
    expect(result.current).toBe('/override')
  })

  it('keeps the router identity stable and calls the latest hook result', () => {
    const seen: number[] = []
    const adapter = defineAdapter({
      name: 'changing-core',
      useLocation: () => ({
        pathname: '/',
        params: {},
        searchParams: new URLSearchParams(),
        hash: '',
      }),
      useRouterCore() {
        const [version, setVersion] = useState(0)
        return {
          navigate: () => seen.push(version),
          back: () => setVersion((current) => current + 1),
        }
      },
    })
    const routing = createRouting(adapter)
    const { result } = renderHook(() => routing.useRouter())
    const first = result.current
    act(() => result.current.push('/first'))
    act(() => result.current.back())
    expect(result.current).toBe(first)
    act(() => result.current.push('/second'))
    expect(seen).toEqual([0, 1])
  })

  it('preserves receivers for optional adapter core methods', () => {
    const core = {
      value: 0,
      navigate: () => {},
      back: () => {},
      forward() {
        this.value += 1
      },
      refresh() {
        this.value += 2
      },
      canGoBack() {
        return this.value === 3
      },
    }
    const adapter = defineAdapter({
      name: 'receiver-dependent',
      capabilities: { forward: true, refresh: true, canGoBack: true },
      useLocation: () => ({
        pathname: '/',
        params: {},
        searchParams: new URLSearchParams(),
        hash: '',
      }),
      useRouterCore: () => core,
    })
    const routing = createRouting(adapter)
    const { result } = renderHook(() => routing.useRouter())

    act(() => {
      result.current.forward()
      result.current.refresh()
    })
    expect(result.current.canGoBack()).toBe(true)
    expect(core.value).toBe(3)
  })

  it('rejects changing adapters without a remount', () => {
    const first = createMemoryRouting().adapter
    const second = createMemoryRouting().adapter
    function Consumer() {
      useContextPathname()
      return null
    }
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(
      <RoutingProvider adapter={first}>
        <Consumer />
      </RoutingProvider>,
    )
    expect(() =>
      rerender(
        <RoutingProvider adapter={second}>
          <Consumer />
        </RoutingProvider>,
      ),
    ).toThrow(/changed without a remount/)
    error.mockRestore()
  })

  it('honors unsupported-operation policy while prefetch remains silent', () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const adapter = defineAdapter({
      name: 'limited',
      useLocation: () => ({
        pathname: '/',
        params: {},
        searchParams: new URLSearchParams(),
        hash: '',
      }),
      useRouterCore: () => ({ navigate: () => {}, back: () => {} }),
    })
    const { result } = renderHook(() => useContextRouter(), {
      wrapper: ({ children }) => (
        <RoutingProvider adapter={adapter}>{children}</RoutingProvider>
      ),
    })
    result.current.forward()
    result.current.forward()
    result.current.prefetch('/silent')
    expect(result.current.canGoBack()).toBe(false)
    expect(warning).toHaveBeenCalledTimes(2)
    warning.mockRestore()
  })

  it('applies the provider error policy to unsupported operations', () => {
    const adapter = defineAdapter({
      name: 'strict-provider',
      useLocation: () => ({
        pathname: '/',
        params: {},
        searchParams: new URLSearchParams(),
        hash: '',
      }),
      useRouterCore: () => ({ navigate: () => {}, back: () => {} }),
    })
    const { result } = renderHook(() => useContextRouter(), {
      wrapper: ({ children }) => (
        <RoutingProvider adapter={adapter} onUnsupported="error">
          {children}
        </RoutingProvider>
      ),
    })

    expect(() => result.current.refresh()).toThrow(/not supported/)

    const bound = createRouting(adapter)
    const { result: boundResult } = renderHook(() => bound.useRouter(), {
      wrapper: ({ children }) => (
        <bound.Provider onUnsupported="error">{children}</bound.Provider>
      ),
    })
    expect(() => boundResult.current.refresh()).toThrow(/not supported/)
  })
})

describe('web Link', () => {
  it('exposes the exact web hook result through the portable public union', () => {
    const routing = createMemoryRouting()
    const { result } = renderHook(() => routing.useLinkProps('/next'))
    const portable: LinkOutputProps = result.current
    // @ts-expect-error Portable consumers must narrow the platform branch.
    void portable.href
    expect('onClick' in portable).toBe(true)
    if (!('onClick' in portable)) throw new Error('Expected web link props')
    const web: WebLinkOutputProps = portable
    expect(web.href).toBe('/next')
  })

  it('renders a ref-safe anchor and navigates on an ordinary click', () => {
    const routing = createMemoryRouting()
    const ref = { current: null as HTMLAnchorElement | null }
    render(
      <routing.Link ref={ref} href="/next">
        next
      </routing.Link>,
    )
    const link = screen.getByRole('link')
    expect(ref.current).toBe(link)
    expect(link.getAttribute('href')).toBe('/next')
    fireEvent.click(link)
    expect(routing.history.current.url).toBe('/next')
  })

  it.each([
    ['meta', { metaKey: true }],
    ['control', { ctrlKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['middle button', { button: 1 }],
  ])('leaves %s clicks to the browser', (_name, event) => {
    const routing = createMemoryRouting()
    render(<routing.Link href="/next">next</routing.Link>)
    fireEvent.click(screen.getByRole('link'), event)
    expect(routing.history.log).toHaveLength(0)
  })

  it.each([
    ['external URLs', { href: 'https://example.com' }],
    ['new targets', { href: '/next', target: '_blank' as const }],
    ['downloads', { href: '/asset', download: true }],
  ])('leaves %s to the browser', (_name, props) => {
    const routing = createMemoryRouting()
    render(<routing.Link {...props}>next</routing.Link>)
    fireEvent.click(screen.getByRole('link'))
    expect(routing.history.log).toHaveLength(0)
  })

  it.each([
    ['self targets', { target: '_self' as const }],
    ['empty targets', { target: '' }],
    ['disabled downloads', { download: false }],
  ])('intercepts internal links with %s', (_name, props) => {
    const routing = createMemoryRouting()
    render(
      <routing.Link href="/next" {...props}>
        next
      </routing.Link>,
    )
    fireEvent.click(screen.getByRole('link'))
    expect(routing.history.current.url).toBe('/next')
  })

  it('makes disabled links inert and lets onPress cancel', () => {
    const routing = createMemoryRouting()
    const { rerender } = render(
      <routing.Link href="/next" disabled>
        next
      </routing.Link>,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBeNull()
    expect(link.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(link)
    expect(routing.history.log).toHaveLength(0)

    rerender(
      <routing.Link href="/next" onPress={(event) => event.preventDefault()}>
        next
      </routing.Link>,
    )
    fireEvent.click(screen.getByRole('link'))
    expect(routing.history.log).toHaveLength(0)
  })

  it('forwards refs and cancellation through an adapter Link', () => {
    const clicked = jest.fn()
    const FrameworkLink = forwardRef<unknown, AdapterLinkProps>(
      function FrameworkLink({ to, onNativePress, children }, ref) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={to.url}
            onClick={(event) => {
              onNativePress?.(event)
              if (!event.defaultPrevented) clicked()
            }}
          >
            {children}
          </a>
        )
      },
    )
    const memory = createMemoryRouting()
    const adapter = { ...memory.adapter, Link: FrameworkLink }
    const routing = createRouting(adapter)
    const ref = { current: null as HTMLAnchorElement | null }
    render(
      <routing.Link
        ref={ref}
        href="/next"
        onPress={(event) => event.preventDefault()}
      >
        next
      </routing.Link>,
    )
    const link = screen.getByRole('link')
    expect(ref.current).toBe(link)
    fireEvent.click(link)
    expect(clicked).not.toHaveBeenCalled()
  })
})
