import {
  Link as ExpoLink,
  Redirect as ExpoRedirect,
  useLocalSearchParams,
  usePathname as useExpoPathname,
  useRouter as useExpoRouter,
  useSegments,
} from 'expo-router'
import { forwardRef, useCallback, useMemo, useRef } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { defineAdapter } from '../../adapter/define-adapter'
import type {
  AdapterLinkProps,
  AdapterRouterCore,
  NavigateOptions,
  ResolvedHref,
  UpdateSearchParams,
} from '../../adapter/types'
import {
  applySearchParamsPatch,
  searchParamsEqual,
  searchParamsToObject,
  toSearchParams,
} from '../../core/search-params'
import {
  expoDynamicParamNames,
  splitExpoParams,
  toExpoHref,
  type ExpoHrefObject,
} from './href'

export type ExpoRouterInstance = ReturnType<typeof useExpoRouter>

const ExpoAdapterLink = forwardRef<unknown, AdapterLinkProps>(
  function ExpoAdapterLink(
    {
      to,
      replace,
      prefetch,
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
      <ExpoLink
        ref={ref}
        href={toExpoHref(to)}
        replace={replace}
        prefetch={prefetch === undefined ? undefined : prefetch !== false}
        className={className}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        target={target}
        rel={rel}
        download={download}
        onPress={onNativePress}
        asChild
      >
        <Pressable style={style as StyleProp<ViewStyle>}>{children}</Pressable>
      </ExpoLink>
    )
  },
)

function ExpoAdapterRedirect({ to }: { to: ResolvedHref }) {
  return <ExpoRedirect href={toExpoHref(to)} />
}

export const expoAdapter = defineAdapter<ExpoRouterInstance>({
  name: 'expo',
  capabilities: {
    forward: false,
    refresh: true,
    prefetch: true,
    scroll: false,
    hash: false,
    state: false,
    canGoBack: true,
  },

  useLocation() {
    const pathname = useExpoPathname()
    const localParams = useLocalSearchParams()
    const segments = useSegments()
    return useMemo(() => {
      const split = splitExpoParams(localParams, segments)
      return {
        pathname,
        params: split.params,
        searchParams: toSearchParams(split.query),
        hash: '',
      }
    }, [pathname, localParams, segments])
  },

  useRouterCore() {
    const router = useExpoRouter()
    const pathname = useExpoPathname()
    const localParams = useLocalSearchParams()
    const segments = useSegments()
    return useMemo<AdapterRouterCore>(() => {
      const { query: currentQuery } = splitExpoParams(localParams, segments)
      const currentHref: ExpoHrefObject =
        Object.keys(currentQuery).length === 0
          ? { pathname }
          : { pathname, params: currentQuery }
      const core: AdapterRouterCore = {
        navigate(to: ResolvedHref, options: NavigateOptions) {
          const href = toExpoHref(to)
          if (options.replace) router.replace(href)
          else router.push(href)
        },
        back: () => router.back(),
        canGoBack: () => router.canGoBack(),
        refresh: () => router.replace(currentHref),
      }
      core.prefetch = (to) => router.prefetch(toExpoHref(to))
      return core
    }, [router, pathname, localParams, segments])
  },

  usePlatform: useExpoRouter,
  Link: ExpoAdapterLink,
  Redirect: ExpoAdapterRedirect,

  useUpdateSearchParams(): UpdateSearchParams {
    const router = useExpoRouter()
    const pathname = useExpoPathname()
    const localParams = useLocalSearchParams()
    const segments = useSegments()
    const { query: observedQuery } = splitExpoParams(localParams, segments)
    const observedSearch = toSearchParams(observedQuery)
    const observedIdentity = JSON.stringify([
      pathname,
      segments,
      observedSearch.toString(),
    ])
    const latestSearchRef = useRef(observedSearch)
    const observedIdentityRef = useRef(observedIdentity)
    const pendingNavigationRef = useRef(false)
    if (observedIdentityRef.current !== observedIdentity) {
      observedIdentityRef.current = observedIdentity
      latestSearchRef.current = observedSearch
      pendingNavigationRef.current = false
    }
    const dynamicNames = expoDynamicParamNames(segments)

    return useCallback<UpdateSearchParams>(
      (patch, options) => {
        const current = latestSearchRef.current
        const next = applySearchParamsPatch(current, patch)
        for (const name of dynamicNames) next.delete(name)
        if (searchParamsEqual(next, current)) return

        const nextQuery = searchParamsToObject(next)
        const deleted = Array.from(current.keys()).some((key) => !next.has(key))
        const method = options?.method ?? 'replace'
        const needsFullNavigation =
          pendingNavigationRef.current || deleted || method === 'push'
        const wasPending = pendingNavigationRef.current
        latestSearchRef.current = next

        try {
          if (!needsFullNavigation) {
            router.setParams(nextQuery)
            return
          }

          pendingNavigationRef.current = true
          const href: ExpoHrefObject = {
            pathname,
            ...(Object.keys(nextQuery).length > 0 ? { params: nextQuery } : {}),
          }
          if (method === 'push') router.push(href)
          else router.replace(href)
        } catch (error) {
          latestSearchRef.current = current
          pendingNavigationRef.current = wasPending
          throw error
        }
      },
      [router, pathname, dynamicNames],
    )
  },
})
