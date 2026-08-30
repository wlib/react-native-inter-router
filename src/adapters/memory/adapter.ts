import { useMemo, useSyncExternalStore } from 'react'
import { normalizeHash, parseHref } from '../../core/href'
import { matchPathPattern } from '../../core/path-pattern'
import { toSearchParams } from '../../core/search-params'
import { defineAdapter } from '../../adapter/define-adapter'
import type {
  NavigateOptions,
  ResolvedHref,
  RouteLocation,
  RouterAdapter,
} from '../../adapter/types'
import {
  createMemoryHistory,
  type MemoryEntry,
  type MemoryHistory,
  type MemoryHistoryOptions,
} from './history'

export interface MemoryAdapterOptions extends MemoryHistoryOptions {
  history?: MemoryHistory
  /** Bracket patterns used to derive path-only params for the current URL. */
  routes?: readonly string[]
}

export interface MemoryAdapter extends RouterAdapter<MemoryHistory> {
  readonly history: MemoryHistory
}

export function createMemoryAdapter(
  options: MemoryAdapterOptions = {},
): MemoryAdapter {
  const history = options.history ?? createMemoryHistory(options)
  if (options.routes !== undefined && !Array.isArray(options.routes)) {
    throw new TypeError(
      '[react-native-inter-router] routes must be an array of strings.',
    )
  }
  const routes = Object.freeze([...(options.routes ?? [])])

  for (const [index, route] of routes.entries()) {
    if (typeof route !== 'string') {
      throw new TypeError(
        `[react-native-inter-router] routes[${index}] must be a string.`,
      )
    }
  }

  function deriveLocation(current: MemoryEntry): RouteLocation {
    const parsed = parseHref(current.url)
    let params: RouteLocation['params'] = {}

    for (const pattern of routes) {
      const match = matchPathPattern(pattern, parsed.pathname)
      if (match) {
        params = match
        break
      }
    }

    return {
      pathname: parsed.pathname,
      params,
      searchParams: toSearchParams(parsed.query ?? {}),
      hash: normalizeHash(parsed.hash),
    }
  }

  const adapter = defineAdapter<MemoryHistory>({
    name: 'memory',
    capabilities: {
      forward: true,
      refresh: true,
      prefetch: true,
      scroll: false,
      hash: true,
      state: true,
      canGoBack: true,
    },
    useLocation() {
      const current = useSyncExternalStore(
        history.subscribe,
        () => history.current,
        () => history.current,
      )
      return useMemo(() => deriveLocation(current), [current])
    },
    useRouterCore() {
      return useMemo(
        () => ({
          navigate(to: ResolvedHref, navigateOptions: NavigateOptions) {
            if (navigateOptions.replace) {
              history.replace(to.url, navigateOptions.state)
            } else {
              history.push(to.url, navigateOptions.state)
            }
          },
          back: history.back,
          forward: history.forward,
          refresh: history.refresh,
          prefetch(to: ResolvedHref) {
            history.prefetch(to.url)
          },
          canGoBack: history.canGoBack,
        }),
        [],
      )
    },
    usePlatform: () => history,
  })

  return { ...adapter, history }
}
