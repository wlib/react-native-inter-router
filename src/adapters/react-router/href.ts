import type { LinkPrefetch, ResolvedHref } from '../../adapter/types'

export interface ReactRouterTo {
  pathname?: string
  search?: string
  hash?: string
}

/** Keep React Router's pathname/search/hash fields distinct at its boundary. */
export function toReactRouterTo(destination: ResolvedHref): ReactRouterTo {
  const url = destination.url
  const hashIndex = url.indexOf('#')
  const beforeHash = hashIndex < 0 ? url : url.slice(0, hashIndex)
  const hash = hashIndex < 0 ? undefined : url.slice(hashIndex)
  const searchIndex = beforeHash.indexOf('?')
  const pathname =
    searchIndex < 0 ? beforeHash : beforeHash.slice(0, searchIndex)
  const search = searchIndex < 0 ? undefined : beforeHash.slice(searchIndex)

  const result: ReactRouterTo = {}
  if (pathname) result.pathname = pathname
  if (search) result.search = search
  if (hash) result.hash = hash
  return result
}

/** React Router supports Link discovery/preload even in library mode. */
export function toReactRouterPrefetch(
  prefetch: LinkPrefetch | undefined,
): 'none' | 'intent' | 'viewport' | 'render' | undefined {
  if (prefetch === undefined) return undefined
  if (prefetch === false) return 'none'
  if (prefetch === true || prefetch === 'hover') return 'intent'
  return prefetch
}
