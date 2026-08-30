import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type MouseEventHandler,
  type Ref,
} from 'react'
import {
  Link as ReactRouterLink,
  useLocation as useReactRouterLocation,
  useNavigate,
  useParams as useReactRouterParams,
} from 'react-router'
import { defineAdapter } from '../../adapter/define-adapter'
import { normalizeHash } from '../../core/href'
import { convertPathPattern } from '../../core/path-pattern'
import type {
  AdapterLinkProps,
  AdapterRouterCore,
  NavigateOptions,
  ResolvedHref,
} from '../../adapter/types'
import { toReactRouterPrefetch, toReactRouterTo } from './href'

export interface ReactRouterPlatform {
  navigate: ReturnType<typeof useNavigate>
  location: ReturnType<typeof useReactRouterLocation>
}

const ReactRouterAdapterLink = forwardRef<unknown, AdapterLinkProps>(
  function ReactRouterAdapterLink(
    {
      to,
      replace,
      prefetch,
      scroll,
      state,
      children,
      className,
      style,
      onNativePress,
      accessibilityLabel,
      testID,
      target,
      rel,
      download,
    },
    ref,
  ) {
    return (
      <ReactRouterLink
        ref={ref as Ref<HTMLAnchorElement>}
        to={toReactRouterTo(to)}
        replace={replace}
        prefetch={toReactRouterPrefetch(prefetch)}
        state={state}
        preventScrollReset={scroll === false ? true : undefined}
        className={className}
        style={style as CSSProperties | undefined}
        aria-label={accessibilityLabel}
        data-testid={testID}
        target={target}
        rel={rel}
        download={download}
        onClick={
          onNativePress as MouseEventHandler<HTMLAnchorElement> | undefined
        }
      >
        {children}
      </ReactRouterLink>
    )
  },
)

export const reactRouterAdapter = defineAdapter<ReactRouterPlatform>({
  name: 'react-router',
  capabilities: {
    forward: true,
    refresh: false,
    prefetch: false,
    scroll: true,
    hash: true,
    state: true,
    canGoBack: false,
  },

  useLocation() {
    const location = useReactRouterLocation()
    const reactRouterParams = useReactRouterParams()
    return useMemo(() => {
      const params: Record<string, string | string[]> = {}
      for (const [key, value] of Object.entries(reactRouterParams)) {
        if (value === undefined) continue
        defineLocationParam(
          params,
          key === '*' ? 'splat' : key,
          key === '*'
            ? splitSplatFromPathname(value, location.pathname)
            : value,
        )
      }
      return {
        pathname: location.pathname,
        params,
        searchParams: new URLSearchParams(location.search),
        hash: normalizeHash(location.hash),
      }
    }, [location, reactRouterParams])
  },

  useRouterCore() {
    const navigate = useNavigate()
    return useMemo<AdapterRouterCore>(
      () => ({
        navigate(to: ResolvedHref, options: NavigateOptions) {
          void navigate(toReactRouterTo(to), {
            replace: options.replace,
            state: options.state,
            preventScrollReset: options.scroll === false ? true : undefined,
          })
        },
        back: () => void navigate(-1),
        forward: () => void navigate(1),
      }),
      [navigate],
    )
  },

  usePlatform(): ReactRouterPlatform {
    const navigate = useNavigate()
    const location = useReactRouterLocation()
    return useMemo(() => ({ navigate, location }), [navigate, location])
  },

  Link: ReactRouterAdapterLink,
})

export { convertPathPattern }

function defineLocationParam(
  target: Record<string, string | string[]>,
  key: string,
  value: string | string[],
): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}

/** React Router decodes `*` into one string; the URL retains encoded slashes. */
function splitSplatFromPathname(raw: string, pathname: string): string[] {
  const pathSegments = pathname.split('/')
  for (let index = 0; index < pathSegments.length; index += 1) {
    try {
      const decoded = pathSegments.slice(index).map(decodeURIComponent)
      if (decoded.join('/') === raw) return decoded
    } catch {
      // Keep looking; malformed escapes should not break location reads.
    }
  }
  return raw.split('/')
}
