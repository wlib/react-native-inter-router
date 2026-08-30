import { createRef } from 'react'
import {
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native'
import { Text, type View } from 'react-native'
import * as expoRouter from 'expo-router'
import {
  Link,
  Redirect,
  useCapabilities,
  useLocation,
  useRouter,
  useUpdateSearchParams,
} from '../index'

const mock = (
  expoRouter as typeof expoRouter & {
    __expoRouterMock: {
      calls: {
        push: unknown[]
        replace: unknown[]
        setParams: unknown[]
        prefetch: unknown[]
        back: number
      }
      set(next: {
        pathname?: string
        segments?: string[]
        localParams?: Record<string, string | string[] | undefined>
        canGoBack?: boolean
      }): void
      reset(): void
    }
  }
).__expoRouterMock

beforeEach(() => mock.reset())

describe('Expo adapter', () => {
  it('declares the exact supported capability matrix', () => {
    const { result } = renderHook(() => useCapabilities())
    expect(result.current).toEqual({
      forward: false,
      refresh: true,
      prefetch: true,
      scroll: false,
      hash: false,
      state: false,
      canGoBack: true,
    })
  })

  it('splits Expo local params into path and query values', () => {
    mock.set({
      pathname: '/users/42',
      segments: ['users', '[id]'],
      localParams: { id: '42', tab: ['posts', 'likes'] },
    })
    const { result } = renderHook(() => useLocation())
    expect(result.current.params).toEqual({ id: '42' })
    expect(result.current.searchParams.getAll('tab')).toEqual([
      'posts',
      'likes',
    ])
  })

  it('returns prototype-named location values as own properties', () => {
    const localParams = Object.create(null) as Record<string, string>
    localParams.__proto__ = 'path'
    Object.defineProperty(localParams, 'constructor', {
      value: 'query',
      enumerable: true,
    })
    mock.set({
      pathname: '/safe/path',
      segments: ['safe', '[__proto__]'],
      localParams,
    })
    const { result } = renderHook(() => useLocation())
    expect(result.current.params.__proto__).toBe('path')
    expect(Object.hasOwn(result.current.params, '__proto__')).toBe(true)
    expect(result.current.searchParams.get('constructor')).toBe('query')
  })

  it('navigates and prefetches with structured Expo hrefs', () => {
    const { result } = renderHook(() => useRouter())
    const destination = {
      pathname: '/users/[id]',
      params: { id: 7 },
      query: { tab: 'a' },
    } as const
    result.current.push(destination)
    result.current.prefetch(destination)
    result.current.back()

    const expected = {
      pathname: '/users/[id]',
      params: { tab: 'a', id: '7' },
    }
    expect(mock.calls.push).toEqual([expected])
    expect(mock.calls.prefetch).toEqual([expected])
    expect(mock.calls.back).toBe(1)
  })

  it('refreshes the current route without dropping path or query params', () => {
    mock.set({
      pathname: '/users/42',
      segments: ['users', '[id]'],
      localParams: { id: '42', tab: 'posts' },
    })
    const { result } = renderHook(() => useRouter())
    result.current.refresh()
    expect(mock.calls.replace).toEqual([
      {
        pathname: '/users/42',
        params: { tab: 'posts' },
      },
    ])
  })

  it('uses setParams for replace upserts and full navigation for deletes', () => {
    mock.set({
      pathname: '/users/42',
      segments: ['users', '[id]'],
      localParams: { id: '42', tab: 'posts', q: 'x' },
    })
    const { result } = renderHook(() => useUpdateSearchParams())
    result.current({ tab: 'about', open: '1' })
    expect(mock.calls.setParams).toEqual([{ tab: 'about', q: 'x', open: '1' }])

    result.current({ q: undefined })
    expect(mock.calls.replace).toEqual([
      {
        pathname: '/users/42',
        params: { tab: 'about', open: '1' },
      },
    ])
  })

  it('composes same-batch patches and ignores dynamic-path collisions', () => {
    mock.set({
      pathname: '/users/42',
      segments: ['users', '[id]'],
      localParams: { id: '42', tab: 'posts' },
    })
    const { result } = renderHook(() => useUpdateSearchParams())
    result.current({ page: '2', id: 'not-a-path-update' })
    result.current({ sort: 'new' })
    expect(mock.calls.setParams).toEqual([
      { tab: 'posts', page: '2' },
      { tab: 'posts', page: '2', sort: 'new' },
    ])
  })

  it('keeps using full replacement after a same-batch delete', () => {
    mock.set({
      pathname: '/list',
      segments: ['list'],
      localParams: { tab: 'all', q: 'term' },
    })
    const { result } = renderHook(() => useUpdateSearchParams())
    result.current({ q: undefined })
    result.current({ page: '2' })
    expect(mock.calls.setParams).toHaveLength(0)
    expect(mock.calls.replace).toEqual([
      { pathname: '/list', params: { tab: 'all' } },
      { pathname: '/list', params: { tab: 'all', page: '2' } },
    ])
  })

  it('uses full replacement when refining a pending push', () => {
    mock.set({ pathname: '/list', segments: ['list'], localParams: {} })
    const { result } = renderHook(() => useUpdateSearchParams())
    result.current({ page: '2' }, { method: 'push' })
    result.current({ sort: 'new' })
    expect(mock.calls.setParams).toHaveLength(0)
    expect(mock.calls.push).toEqual([
      { pathname: '/list', params: { page: '2' } },
    ])
    expect(mock.calls.replace).toEqual([
      { pathname: '/list', params: { page: '2', sort: 'new' } },
    ])
  })

  it('resets optimistic navigation when the observed route changes', () => {
    mock.set({
      pathname: '/list',
      segments: ['list'],
      localParams: { q: 'term' },
    })
    const { result, rerender } = renderHook(() => useUpdateSearchParams())
    result.current({ q: undefined })

    mock.set({
      pathname: '/other',
      segments: ['other'],
      localParams: { tab: 'new' },
    })
    rerender({})
    result.current({ open: '1' })

    expect(mock.calls.replace).toEqual([{ pathname: '/list' }])
    expect(mock.calls.setParams).toEqual([{ tab: 'new', open: '1' }])
  })

  it('pushes query updates and exposes canGoBack', () => {
    mock.set({
      pathname: '/list',
      segments: ['list'],
      localParams: {},
      canGoBack: false,
    })
    const update = renderHook(() => useUpdateSearchParams())
    update.result.current({ page: '2' }, { method: 'push' })
    expect(mock.calls.push).toEqual([
      { pathname: '/list', params: { page: '2' } },
    ])

    const router = renderHook(() => useRouter())
    expect(router.result.current.canGoBack()).toBe(false)
  })

  it('reports forward as unsupported', () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useRouter())
    expect(result.current.capabilities.forward).toBe(false)
    result.current.forward()
    expect(warning).toHaveBeenCalledTimes(1)
    warning.mockRestore()
  })

  it('delegates Link and Redirect to Expo primitives and forwards refs', () => {
    const ref = createRef<View>()
    render(
      <>
        <Link
          ref={ref}
          href={{ pathname: '/users/[id]', params: { id: 3 } }}
          testID="expo-link"
        >
          <Text>user</Text>
        </Link>
        <Redirect href={{ pathname: '/login', query: { from: 'app' } }} />
      </>,
    )
    fireEvent.press(screen.getByTestId('expo-link'))
    expect(ref.current).not.toBeNull()
    expect(mock.calls.push).toEqual([
      { pathname: '/users/[id]', params: { id: '3' } },
    ])
    expect(mock.calls.replace).toEqual([
      { pathname: '/login', params: { from: 'app' } },
    ])
  })
})
