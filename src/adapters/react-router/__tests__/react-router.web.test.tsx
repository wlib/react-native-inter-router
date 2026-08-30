import { createRef, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import {
  Link,
  useCapabilities,
  useLocation,
  usePathname,
  usePlatformRouter,
  useRouter,
  useSearchParamsObject,
} from '../index'

function Probe() {
  const location = useLocation()
  const query = useSearchParamsObject()
  return (
    <output data-testid="probe">
      {JSON.stringify({
        pathname: location.pathname,
        params: location.params,
        query,
        hash: location.hash,
      })}
    </output>
  )
}

function CapabilitiesProbe() {
  return (
    <output data-testid="capabilities">
      {JSON.stringify(useCapabilities())}
    </output>
  )
}

function App({ children }: { children?: ReactNode }) {
  return (
    <Routes>
      <Route path="/" element={<>{children}</>} />
      <Route path="/users/:id" element={<Probe />} />
      <Route path="/docs/*" element={<Probe />} />
      <Route path="/safe/:constructor/:toString" element={<Probe />} />
    </Routes>
  )
}

function readProbe(): {
  pathname: string
  params: Record<string, string | string[]>
  query: Record<string, string | string[]>
  hash: string
} {
  return JSON.parse(screen.getByTestId('probe').textContent ?? '{}')
}

describe('React Router adapter with a real MemoryRouter', () => {
  it('declares the exact supported capability matrix', () => {
    render(
      <MemoryRouter>
        <CapabilitiesProbe />
      </MemoryRouter>,
    )
    expect(
      JSON.parse(screen.getByTestId('capabilities').textContent ?? '{}'),
    ).toEqual({
      forward: true,
      refresh: false,
      prefetch: false,
      scroll: true,
      hash: true,
      state: true,
      canGoBack: false,
    })
  })

  it('reads path params, repeated query values, and hash', () => {
    render(
      <MemoryRouter initialEntries={['/users/42?tab=a&tab=b#bio']}>
        <App />
      </MemoryRouter>,
    )
    expect(readProbe()).toEqual({
      pathname: '/users/42',
      params: { id: '42' },
      query: { tab: ['a', 'b'] },
      hash: 'bio',
    })
  })

  it('exposes the React Router splat as the public splat array', () => {
    render(
      <MemoryRouter initialEntries={['/docs/a/b']}>
        <App />
      </MemoryRouter>,
    )
    expect(readProbe().params).toEqual({ splat: ['a', 'b'] })
  })

  it('recovers catch-all element boundaries containing encoded slashes', () => {
    render(
      <MemoryRouter initialEntries={['/docs/a%2Fb/c']}>
        <App />
      </MemoryRouter>,
    )
    expect(readProbe()).toMatchObject({
      pathname: '/docs/a%2Fb/c',
      params: { splat: ['a/b', 'c'] },
    })
  })

  it('normalizes every leading hash marker', () => {
    render(
      <MemoryRouter initialEntries={['/users/42###bio']}>
        <App />
      </MemoryRouter>,
    )
    expect(readProbe().hash).toBe('bio')
  })

  it('exposes prototype-named params as safe own properties', () => {
    render(
      <MemoryRouter initialEntries={['/safe/ctor/string']}>
        <App />
      </MemoryRouter>,
    )
    const params = readProbe().params
    expect(params['constructor']).toBe('ctor')
    expect(Object.hasOwn(params, 'constructor')).toBe(true)
    expect(params.toString).toBe('string')
    expect(Object.hasOwn(params, 'toString')).toBe(true)
  })

  it('uses React Router Link for structured navigation and forwards refs', () => {
    const ref = createRef<HTMLAnchorElement>()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App>
          <Link ref={ref} href={{ pathname: '/users/[id]', params: { id: 7 } }}>
            to user
          </Link>
        </App>
      </MemoryRouter>,
    )
    const anchor = screen.getByRole('link', { name: 'to user' })
    expect(anchor).toBe(ref.current)
    fireEvent.click(anchor)
    expect(readProbe().pathname).toBe('/users/7')
  })

  it('maps imperative push, state, scroll behavior, and back', () => {
    function Controls() {
      const router = useRouter()
      const pathname = usePathname()
      const platform = usePlatformRouter()
      return (
        <>
          <output data-testid="pathname">{pathname}</output>
          <output data-testid="state">
            {JSON.stringify(platform.location.state)}
          </output>
          <button
            onClick={() =>
              router.push('/users/9?tab=x', {
                state: { source: 'test' },
                scroll: false,
              })
            }
          >
            go
          </button>
          <button onClick={() => router.back()}>back</button>
        </>
      )
    }
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*" element={<Controls />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('go'))
    expect(screen.getByTestId('pathname').textContent).toBe('/users/9')
    expect(screen.getByTestId('state').textContent).toBe('{"source":"test"}')
    fireEvent.click(screen.getByText('back'))
    expect(screen.getByTestId('pathname').textContent).toBe('/')
  })

  it('moves forward through the real memory history', () => {
    function Controls() {
      const router = useRouter()
      return (
        <>
          <output data-testid="pathname">{usePathname()}</output>
          <button onClick={() => router.forward()}>forward</button>
        </>
      )
    }
    render(
      <MemoryRouter initialEntries={['/', '/users/4']} initialIndex={0}>
        <Routes>
          <Route path="*" element={<Controls />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('pathname').textContent).toBe('/')
    fireEvent.click(screen.getByText('forward'))
    expect(screen.getByTestId('pathname').textContent).toBe('/users/4')
  })
})
