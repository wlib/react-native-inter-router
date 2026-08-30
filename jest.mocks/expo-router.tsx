import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'

interface MockState {
  pathname: string
  segments: string[]
  localParams: Record<string, string | string[] | undefined>
  canGoBack: boolean
}

const initialState: MockState = {
  pathname: '/',
  segments: [],
  localParams: {},
  canGoBack: true,
}
let state: MockState = { ...initialState }

function freshCalls() {
  return {
    push: [] as unknown[],
    replace: [] as unknown[],
    setParams: [] as unknown[],
    prefetch: [] as unknown[],
    back: 0,
  }
}

export const __expoRouterMock = {
  calls: freshCalls(),
  set(next: Partial<MockState>) {
    state = { ...state, ...next }
  },
  reset() {
    state = { ...initialState }
    this.calls = freshCalls()
  },
}

export function useRouter() {
  return {
    push: (href: unknown) => __expoRouterMock.calls.push.push(href),
    replace: (href: unknown) => __expoRouterMock.calls.replace.push(href),
    navigate: (href: unknown) => __expoRouterMock.calls.push.push(href),
    back: () => {
      __expoRouterMock.calls.back += 1
    },
    canGoBack: () => state.canGoBack,
    setParams: (params: unknown) =>
      __expoRouterMock.calls.setParams.push(params),
    prefetch: (href: unknown) => __expoRouterMock.calls.prefetch.push(href),
  }
}

export function usePathname() {
  return state.pathname
}

export function useSegments() {
  return state.segments
}

export function useLocalSearchParams() {
  return state.localParams
}

export const Link = forwardRef<
  unknown,
  {
    href: unknown
    onPress?: (event: unknown) => void
    testID?: string
    children?: ReactNode
  }
>(function Link({ href, children, onPress, testID }, ref) {
  const press = (event?: { defaultPrevented?: boolean }) => {
    onPress?.(event)
    if (!event?.defaultPrevented) __expoRouterMock.calls.push.push(href)
  }
  if (!isValidElement(children)) return <>{children}</>
  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    ref,
    onPress: press,
    accessibilityRole: 'link',
    testID,
  })
})

export function Redirect({ href }: { href: unknown }) {
  __expoRouterMock.calls.replace.push(href)
  return null
}
