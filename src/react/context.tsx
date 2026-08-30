'use client'

import { createContext, useContext, useRef, type ReactNode } from 'react'
import type { RouterAdapter } from '../adapter/types'
import type { OnUnsupported } from '../adapter/unsupported'

export interface RoutingConfig {
  onUnsupported?: OnUnsupported
}

const AdapterContext = createContext<RouterAdapter<unknown> | null>(null)
const ConfigContext = createContext<RoutingConfig | null>(null)

export interface RoutingProviderProps extends RoutingConfig {
  adapter: RouterAdapter<any>
  children?: ReactNode
}

/**
 * Supplies the router implementation for the provider-driven API and overrides
 * any adapter statically bound by a framework entry point.
 *
 * An adapter is part of a mounted tree's hook topology. Remount the provider
 * (normally with a `key`) when changing router implementations.
 */
export function RoutingProvider({
  adapter,
  onUnsupported,
  children,
}: RoutingProviderProps) {
  return (
    <AdapterContext.Provider value={adapter}>
      <ConfigContext.Provider value={{ onUnsupported }}>
        {children}
      </ConfigContext.Provider>
    </AdapterContext.Provider>
  )
}

export function useAdapterContext(): RouterAdapter<any> | null {
  return useContext(AdapterContext)
}

export function useRoutingConfig(bound?: RoutingConfig): RoutingConfig {
  const provided = useContext(ConfigContext)
  return provided ?? bound ?? {}
}

/** Resolve context first, then a statically bound adapter. */
export function useResolvedAdapter(
  bound?: RouterAdapter<any> | null,
): RouterAdapter<any> {
  const fromContext = useAdapterContext()
  const adapter = fromContext ?? bound
  const mountedAdapter = useRef(adapter)

  if (!adapter) {
    throw new Error(
      '[react-native-inter-router] No routing adapter is available. Import ' +
        'from a concrete adapter entry point or wrap this tree in ' +
        '<RoutingProvider adapter={...}>.',
    )
  }

  if (mountedAdapter.current !== adapter) {
    throw new Error(
      '[react-native-inter-router] The adapter changed without a remount. ' +
        'Remount <RoutingProvider> (for example with a key) when changing ' +
        'router implementations.',
    )
  }

  return adapter
}
