import { act, fireEvent, render, screen } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import {
  Link,
  useCapabilities,
  useLocation,
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

function Controls() {
  const router = useRouter()
  return (
    <>
      <Probe />
      <CapabilitiesProbe />
      <Link href={{ pathname: '/users/[id]', params: { id: 7 } }}>to user</Link>
      <Link
        href={{
          pathname: '/docs/[...slug]',
          params: { slug: ['a/b', 'c'] },
        }}
      >
        bounded docs
      </Link>
      <button
        onClick={() =>
          router.push({
            pathname: '/users/[id]',
            params: { id: 9 },
            query: { tab: ['x', 'y'] },
          })
        }
      >
        go
      </button>
      <button onClick={() => router.back()}>back</button>
      <button onClick={() => router.forward()}>forward</button>
      <button onClick={() => router.refresh()}>refresh</button>
      <button onClick={() => router.prefetch('/users/8')}>prefetch</button>
      <button
        onClick={() =>
          router.push('/users/10', {
            state: { source: 'adapter-test' },
            scroll: false,
          })
        }
      >
        state go
      </button>
      <output data-testid="can-go-back">{String(router.canGoBack())}</output>
      <button
        onClick={() =>
          router.push({
            pathname: '/docs/[...slug]',
            params: { slug: ['x/y', 'z'] },
          })
        }
      >
        bounded go
      </button>
    </>
  )
}

function makeRouter(initialEntries: string[]) {
  const rootRoute = createRootRoute({ component: Outlet })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Controls,
  })
  const userRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/users/$id',
    component: Controls,
  })
  const docsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/docs/$',
    component: Controls,
  })
  const safeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/safe/$__proto__/$constructor',
    component: Controls,
  })
  return createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      userRoute,
      docsRoute,
      safeRoute,
    ]),
    history: createMemoryHistory({ initialEntries }),
  })
}

function readProbe(): {
  pathname: string
  params: Record<string, string | string[]>
  query: Record<string, string | string[]>
  hash: string
} {
  return JSON.parse(screen.getByTestId('probe').textContent ?? '{}')
}

describe('TanStack adapter with a real router', () => {
  it('declares the exact supported capability matrix', async () => {
    render(<RouterProvider router={makeRouter(['/'])} />)
    const output = await screen.findByTestId('capabilities')
    expect(JSON.parse(output.textContent ?? '{}')).toEqual({
      forward: true,
      refresh: true,
      prefetch: true,
      scroll: true,
      hash: true,
      state: true,
      canGoBack: true,
    })
  })

  it('reads concrete location, path params, query, and hash', async () => {
    render(<RouterProvider router={makeRouter(['/users/42?tab=a#bio'])} />)
    await screen.findByTestId('probe')
    expect(readProbe()).toEqual({
      pathname: '/users/42',
      params: { id: '42' },
      query: { tab: 'a' },
      hash: 'bio',
    })
  })

  it('keeps TanStack splat params inspectable', async () => {
    render(<RouterProvider router={makeRouter(['/docs/a/b'])} />)
    await screen.findByTestId('probe')
    expect(readProbe().params).toEqual({ splat: ['a', 'b'] })
  })

  it('normalizes prototype-named params into safe own properties', async () => {
    render(<RouterProvider router={makeRouter(['/safe/proto/ctor'])} />)
    await screen.findByTestId('probe')
    const params = readProbe().params
    expect(params.__proto__).toBe('proto')
    expect(Object.hasOwn(params, '__proto__')).toBe(true)
    expect(params['constructor']).toBe('ctor')
  })

  it('navigates through TanStack Link using converted route patterns', async () => {
    render(<RouterProvider router={makeRouter(['/'])} />)
    fireEvent.click(await screen.findByRole('link', { name: 'to user' }))
    expect((await screen.findByTestId('probe')) && readProbe().pathname).toBe(
      '/users/7',
    )
  })

  it('uses structured imperative search and native history', async () => {
    render(<RouterProvider router={makeRouter(['/'])} />)
    fireEvent.click(await screen.findByText('go'))
    await screen.findByTestId('probe')
    expect(readProbe()).toMatchObject({
      pathname: '/users/9',
      query: { tab: ['x', 'y'] },
    })
    fireEvent.click(screen.getByText('back'))
    await screen.findByTestId('probe')
    expect(readProbe().pathname).toBe('/')
  })

  it('preserves catch-all element boundaries through Link and push', async () => {
    render(<RouterProvider router={makeRouter(['/'])} />)
    fireEvent.click(await screen.findByRole('link', { name: 'bounded docs' }))
    await screen.findByTestId('probe')
    expect(readProbe()).toMatchObject({
      pathname: '/docs/a%2Fb/c',
      params: { splat: ['a/b', 'c'] },
    })

    fireEvent.click(screen.getByText('bounded go'))
    await screen.findByTestId('probe')
    expect(readProbe()).toMatchObject({
      pathname: '/docs/x%2Fy/z',
      params: { splat: ['x/y', 'z'] },
    })
  })

  it('maps forward and reports real back availability', async () => {
    render(<RouterProvider router={makeRouter(['/', '/users/1'])} />)
    await screen.findByTestId('probe')
    expect(screen.getByTestId('can-go-back').textContent).toBe('true')
    fireEvent.click(screen.getByText('back'))
    await screen.findByTestId('probe')
    expect(readProbe().pathname).toBe('/')
    fireEvent.click(screen.getByText('forward'))
    await screen.findByTestId('probe')
    expect(readProbe().pathname).toBe('/users/1')
  })

  it('maps refresh and prefetch to real router methods', async () => {
    const router = makeRouter(['/'])
    const invalidate = jest.spyOn(router, 'invalidate')
    const preloadRoute = jest.spyOn(router, 'preloadRoute')
    render(<RouterProvider router={router} />)
    await screen.findByTestId('probe')
    await act(async () => {
      fireEvent.click(screen.getByText('refresh'))
      await Promise.resolve(invalidate.mock.results[0]?.value)
    })
    await act(async () => {
      fireEvent.click(screen.getByText('prefetch'))
      await Promise.resolve(preloadRoute.mock.results[0]?.value)
    })
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(preloadRoute).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/users/8' }),
    )
  })

  it('forwards state and scroll control to real navigation', async () => {
    const router = makeRouter(['/'])
    const navigate = jest.spyOn(router, 'navigate')
    render(<RouterProvider router={router} />)
    fireEvent.click(await screen.findByText('state go'))
    await screen.findByTestId('probe')
    expect(readProbe().pathname).toBe('/users/10')
    expect(router.state.location.state).toMatchObject({
      source: 'adapter-test',
    })
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/users/10',
        resetScroll: false,
        state: { source: 'adapter-test' },
      }),
    )
  })
})
