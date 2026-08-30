import { createRef } from 'react'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}
const mockNextParams = Object.create(null) as Record<
  string,
  string | string[] | undefined
>
mockNextParams.id = '42'
mockNextParams.absent = undefined
mockNextParams.__proto__ = 'safe'
Object.defineProperty(mockNextParams, 'constructor', {
  value: 'also-safe',
  enumerable: true,
})

jest.mock('next/navigation.js', () => ({
  usePathname: () => '/users/42',
  useParams: () => mockNextParams,
  useSearchParams: () => new URLSearchParams('tab=a&tab=b'),
  useRouter: () => mockRouter,
}))

jest.mock('next/link.js', () => ({
  __esModule: true,
  default: jest.requireActual<typeof import('react')>('react').forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string
      prefetch?: boolean
    }
  >(function MockNextLink({ prefetch, ...props }, ref) {
    return (
      <a ref={ref} data-next-link data-prefetch={String(prefetch)} {...props} />
    )
  }),
}))

import {
  Link,
  Redirect,
  useCapabilities,
  useLocation,
  useRouter,
  useUpdateSearchParams,
} from '../index'

beforeEach(() => jest.clearAllMocks())

describe('Next adapter', () => {
  it('declares the exact supported capability matrix', () => {
    const { result } = renderHook(() => useCapabilities())
    expect(result.current).toEqual({
      forward: true,
      refresh: true,
      prefetch: true,
      scroll: true,
      hash: false,
      state: false,
      canGoBack: false,
    })
  })

  it('reads Next location parts into independent public values', () => {
    const { result } = renderHook(() => useLocation())
    expect(result.current).toMatchObject({
      pathname: '/users/42',
      hash: '',
    })
    expect(result.current.params.id).toBe('42')
    expect(result.current.params.__proto__).toBe('safe')
    expect(Object.hasOwn(result.current.params, '__proto__')).toBe(true)
    expect(result.current.params['constructor']).toBe('also-safe')
    expect(result.current.searchParams.getAll('tab')).toEqual(['a', 'b'])
  })

  it('maps imperative navigation and operations', () => {
    const { result } = renderHook(() => useRouter())
    result.current.push(
      { pathname: '/users/[id]', params: { id: 7 }, query: { tab: 'c' } },
      { scroll: false },
    )
    result.current.replace('/login')
    result.current.back()
    result.current.forward()
    result.current.refresh()
    result.current.prefetch('/warm')

    expect(mockRouter.push).toHaveBeenCalledWith('/users/7?tab=c', {
      scroll: false,
    })
    expect(mockRouter.replace).toHaveBeenCalledWith('/login', {
      scroll: undefined,
    })
    expect(mockRouter.back).toHaveBeenCalledTimes(1)
    expect(mockRouter.forward).toHaveBeenCalledTimes(1)
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1)
    expect(mockRouter.prefetch).toHaveBeenCalledWith('/warm')
  })

  it('patches current search without losing repeated values', () => {
    const { result } = renderHook(() => useUpdateSearchParams())
    result.current({ open: '1' })
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/users/42?tab=a&tab=b&open=1',
      { scroll: false },
    )
  })

  it('renders next/link, forwards refs, and propagates cancellation', () => {
    const ref = createRef<HTMLAnchorElement>()
    const onPress = jest.fn((event) => event.preventDefault())
    render(
      <Link
        ref={ref}
        href={{ pathname: '/users/[id]', params: { id: 3 } }}
        prefetch={false}
        onPress={onPress}
        testID="next-link"
      >
        user
      </Link>,
    )
    const anchor = screen.getByTestId('next-link')
    expect(anchor).toBe(ref.current)
    expect(anchor.getAttribute('href')).toBe('/users/3')
    expect(anchor.getAttribute('data-prefetch')).toBe('false')
    expect(fireEvent.click(anchor)).toBe(false)
  })

  it('uses the generic replace redirect', () => {
    render(<Redirect href="/login" />)
    expect(mockRouter.replace).toHaveBeenCalledWith('/login', {
      scroll: undefined,
    })
  })
})
