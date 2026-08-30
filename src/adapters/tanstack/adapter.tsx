import {
  Link as TanstackLink,
  useLocation as useTanstackLocation,
  useParams as useTanstackParams,
  useRouter as useTanstackRouter,
} from '@tanstack/react-router'
import { forwardRef, useMemo, type ComponentType } from 'react'
import { defineAdapter } from '../../adapter/define-adapter'
import { normalizeHash } from '../../core/href'
import type {
  AdapterLinkProps,
  AdapterRouterCore,
  NavigateOptions,
  ResolvedHref,
} from '../../adapter/types'
import {
  tanstackSearchToParams,
  toTanstackOptions,
  toTanstackPreload,
} from './href'

export type TanstackRouterInstance = ReturnType<typeof useTanstackRouter>

// TanStack's component/navigation generics depend on the consuming app's
// registered route tree. This is the single intentionally erased boundary.
const UntypedTanstackLink = TanstackLink as ComponentType<
  Record<string, unknown>
>

const TanstackAdapterLink = forwardRef<unknown, AdapterLinkProps>(
  function TanstackAdapterLink(
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
      <UntypedTanstackLink
        ref={ref}
        {...toTanstackOptions(to)}
        replace={replace}
        preload={toTanstackPreload(prefetch)}
        resetScroll={scroll}
        state={state}
        className={className}
        style={style}
        aria-label={accessibilityLabel}
        data-testid={testID}
        target={target}
        rel={rel}
        download={download}
        onClick={onNativePress}
      >
        {children}
      </UntypedTanstackLink>
    )
  },
)

export const tanstackAdapter = defineAdapter<TanstackRouterInstance>({
  name: 'tanstack',
  capabilities: {
    forward: true,
    refresh: true,
    prefetch: true,
    scroll: true,
    hash: true,
    state: true,
    canGoBack: true,
  },

  useLocation() {
    const location = useTanstackLocation()
    const tanstackParams = useTanstackParams({ strict: false })
    return useMemo(() => {
      const params: Record<string, string | string[]> = {}
      for (const [key, value] of Object.entries(tanstackParams)) {
        if (key === '_splat' || key === '*') continue
        if (typeof value === 'string' || Array.isArray(value)) {
          defineLocationParam(params, key, value)
        }
      }
      const rawSplat =
        readOwnString(tanstackParams, '_splat') ??
        readOwnString(tanstackParams, '*')
      if (rawSplat !== undefined) {
        defineLocationParam(
          params,
          'splat',
          splitSplatFromPathname(rawSplat, location.pathname),
        )
      }
      return {
        pathname: location.pathname,
        params,
        searchParams: tanstackSearchToParams(
          location.search as Record<string, unknown>,
        ),
        hash: normalizeHash(location.hash),
      }
    }, [location, tanstackParams])
  },

  useRouterCore() {
    const router = useTanstackRouter()
    return useMemo<AdapterRouterCore>(
      () => ({
        navigate(to: ResolvedHref, options: NavigateOptions) {
          void router.navigate({
            ...toTanstackOptions(to),
            replace: options.replace,
            resetScroll: options.scroll,
            state: options.state,
          } as never)
        },
        back: () => router.history.back(),
        forward: () => router.history.forward(),
        refresh: () => {
          void router.invalidate()
        },
        prefetch: (to) => {
          try {
            void router
              .preloadRoute(toTanstackOptions(to) as never)
              .catch(() => {})
          } catch {
            // Prefetch is a best-effort hint, including for unmatched routes.
          }
        },
        canGoBack: () => router.history.canGoBack(),
      }),
      [router],
    )
  },

  usePlatform: useTanstackRouter,
  Link: TanstackAdapterLink,
})

function readOwnString(value: object, key: string): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(value, key)) return undefined
  const candidate = (value as Record<string, unknown>)[key]
  return typeof candidate === 'string' ? candidate : undefined
}

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

/** TanStack decodes `_splat` into one string; the URL retains encoded slashes. */
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
