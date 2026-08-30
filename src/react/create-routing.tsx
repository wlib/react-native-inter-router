'use client'

import { useMemo, useRef, type ComponentType, type ReactNode } from 'react'
import type { Href } from '../core/href'
import { isActivePath, type ActiveMatchOptions } from '../core/active'
import { searchParamsToObject } from '../core/search-params'
import type {
  RouteLocation,
  RouterAdapter,
  RouterCapabilities,
  UpdateSearchParams,
} from '../adapter/types'
import {
  RoutingProvider,
  useResolvedAdapter,
  useRoutingConfig,
  type RoutingConfig,
} from './context'
import { wrapRouterCore, type Router } from './router'
import {
  createUseLinkProps,
  type LinkOutputProps,
  type UseLinkPropsOptions,
} from './create-use-link-props'
import { createLink } from '../components/create-link'
import {
  createRedirect,
  type RedirectProps,
} from '../components/create-redirect'
import type { LinkComponent } from '../components/link-types'

type Params = Record<string, string | string[]>

export interface Routing<TPlatform = unknown> {
  Provider: ComponentType<{
    adapter?: RouterAdapter<any>
    onUnsupported?: RoutingConfig['onUnsupported']
    children?: ReactNode
  }>
  useAdapter(): RouterAdapter<any>
  useLocation(): RouteLocation
  usePathname(): string
  useParams<T extends Params = Params>(): T
  useSearchParams(): URLSearchParams
  useSearchParamsObject<
    T extends Record<string, string | string[] | undefined> = Params,
  >(): T
  useHash(): string
  useUpdateSearchParams(): UpdateSearchParams
  useActiveRoute(href: Href, options?: ActiveMatchOptions): boolean
  useRouter(): Router
  useCapabilities(): RouterCapabilities
  usePlatformRouter(): TPlatform
  useLinkProps(href: Href, options?: UseLinkPropsOptions): LinkOutputProps
  Link: LinkComponent
  Redirect: ComponentType<RedirectProps>
}

/** Build a complete public surface around an optional statically bound adapter. */
export function createRouting<TPlatform = unknown>(
  adapter?: RouterAdapter<TPlatform> | null,
  config: RoutingConfig = {},
): Routing<TPlatform> {
  const bound = adapter ?? null
  const useAdapter = () => useResolvedAdapter(bound)
  const useLocation = () => useAdapter().useLocation()
  const usePathname = () => useLocation().pathname
  const useHash = () => useLocation().hash
  const useParams = <T extends Params = Params>() => useLocation().params as T
  const useSearchParams = () => useLocation().searchParams

  function useSearchParamsObject<
    T extends Record<string, string | string[] | undefined> = Params,
  >(): T {
    const searchParams = useSearchParams()
    const serialized = searchParams.toString()
    return useMemo(
      () => searchParamsToObject<T>(searchParams),
      // `serialized` deliberately detects adapters that retain and mutate one
      // URLSearchParams instance.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [serialized],
    )
  }

  const useUpdateSearchParams = () => useAdapter().useUpdateSearchParams()
  const useActiveRoute = (href: Href, options?: ActiveMatchOptions) =>
    isActivePath(usePathname(), href, options)

  function useRouter(): Router {
    const resolved = useAdapter()
    const core = resolved.useRouterCore()
    const { onUnsupported } = useRoutingConfig(config)
    const coreRef = useRef(core)
    coreRef.current = core

    return useMemo(
      () => wrapRouterCore(resolved, () => coreRef.current, onUnsupported),
      [resolved, onUnsupported],
    )
  }

  const useCapabilities = () => useAdapter().capabilities
  const usePlatformRouter = () => useAdapter().usePlatform() as TPlatform
  const useLinkProps = createUseLinkProps(useAdapter)
  const Link = createLink({ useAdapter, useLinkProps })
  const Redirect = createRedirect(useAdapter)

  function Provider({
    adapter: override,
    onUnsupported,
    children,
  }: {
    adapter?: RouterAdapter<any>
    onUnsupported?: RoutingConfig['onUnsupported']
    children?: ReactNode
  }) {
    const active = override ?? bound
    if (!active) {
      throw new Error(
        '[react-native-inter-router] <RoutingProvider> requires an adapter ' +
          'when this routing surface has no statically bound adapter.',
      )
    }

    return (
      <RoutingProvider
        adapter={active}
        onUnsupported={onUnsupported ?? config.onUnsupported}
      >
        {children}
      </RoutingProvider>
    )
  }

  return {
    Provider,
    useAdapter,
    useLocation,
    usePathname,
    useParams,
    useSearchParams,
    useSearchParamsObject,
    useHash,
    useUpdateSearchParams,
    useActiveRoute,
    useRouter,
    useCapabilities,
    usePlatformRouter,
    useLinkProps,
    Link,
    Redirect,
  }
}
