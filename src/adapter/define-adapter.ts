import { useCallback, useEffect, useRef, type ComponentType } from 'react'
import {
  applySearchParamsPatch,
  searchParamsEqual,
  searchParamsToObject,
} from '../core/search-params'
import { describeHref } from './resolved-href'
import type {
  AdapterLinkComponent,
  AdapterRouterCore,
  ResolvedHref,
  RouteLocation,
  RouterAdapter,
  RouterCapabilities,
  UpdateSearchParams,
} from './types'

export interface AdapterDefinition<TPlatform = unknown> {
  name: string
  capabilities?: Partial<RouterCapabilities>
  useLocation(): RouteLocation
  useRouterCore(): AdapterRouterCore
  usePlatform?(): TPlatform
  Link?: AdapterLinkComponent
  Redirect?: ComponentType<{ to: ResolvedHref }>
  useUpdateSearchParams?(): UpdateSearchParams
}

const NO_CAPABILITIES: RouterCapabilities = Object.freeze({
  forward: false,
  refresh: false,
  prefetch: false,
  scroll: false,
  hash: false,
  state: false,
  canGoBack: false,
})

/** Fill safe higher-level defaults while leaving core operations honest. */
export function defineAdapter<TPlatform = unknown>(
  definition: AdapterDefinition<TPlatform>,
): RouterAdapter<TPlatform> {
  const name = definition.name.trim()
  if (!name) throw new TypeError('An adapter must have a non-empty name.')

  const capabilities = Object.freeze({
    ...NO_CAPABILITIES,
    ...definition.capabilities,
  })

  return Object.freeze({
    name,
    capabilities,
    useLocation: definition.useLocation,
    useRouterCore: definition.useRouterCore,
    usePlatform: definition.usePlatform ?? (() => undefined as TPlatform),
    Link: definition.Link,
    Redirect: definition.Redirect ?? createGenericRedirect(definition),
    useUpdateSearchParams:
      definition.useUpdateSearchParams ??
      createGenericUpdateSearchParams(definition),
  })
}

function createGenericRedirect<TPlatform>(
  definition: AdapterDefinition<TPlatform>,
): ComponentType<{ to: ResolvedHref }> {
  function Redirect({ to }: { to: ResolvedHref }) {
    const core = definition.useRouterCore()
    const currentCore = useRef(core)
    const currentTarget = useRef(to)
    currentCore.current = core
    currentTarget.current = to

    useEffect(() => {
      currentCore.current.navigate(currentTarget.current, { replace: true })
    }, [to.url])

    return null
  }
  Redirect.displayName = `Redirect(${definition.name})`
  return Redirect
}

function createGenericUpdateSearchParams<TPlatform>(
  definition: AdapterDefinition<TPlatform>,
): () => UpdateSearchParams {
  return function useUpdateSearchParams(): UpdateSearchParams {
    const location = definition.useLocation()
    const core = definition.useRouterCore()
    const serializedQuery = location.searchParams.toString()
    const observedLocation = useRef({
      pathname: location.pathname,
      hash: location.hash,
      serializedQuery,
    })
    const latestQuery = useRef(new URLSearchParams(serializedQuery))

    const observed = observedLocation.current
    if (
      observed.pathname !== location.pathname ||
      observed.hash !== location.hash ||
      observed.serializedQuery !== serializedQuery
    ) {
      observedLocation.current = {
        pathname: location.pathname,
        hash: location.hash,
        serializedQuery,
      }
      latestQuery.current = new URLSearchParams(serializedQuery)
    }

    return useCallback<UpdateSearchParams>(
      (patch, options) => {
        const previous = latestQuery.current
        const next = applySearchParamsPatch(previous, patch)
        if (searchParamsEqual(next, previous)) return

        // Advance before navigating: multiple calls in one React batch compose
        // even though the adapter's location hook has not rerendered yet.
        latestQuery.current = next

        try {
          core.navigate(
            describeHref({
              pathname: location.pathname,
              query: searchParamsToObject(next),
              hash: location.hash || undefined,
            }),
            {
              replace: (options?.method ?? 'replace') === 'replace',
              scroll: options?.scroll ?? false,
            },
          )
        } catch (error) {
          latestQuery.current = previous
          throw error
        }
      },
      [location.pathname, location.hash, core],
    )
  }
}
