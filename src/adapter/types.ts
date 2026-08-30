import type {
  ComponentType,
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
} from 'react'
import type { HrefObject } from '../core/href'
import type { SearchParamsPatch } from '../core/search-params'

export interface RouteLocation {
  pathname: string
  params: Record<string, string | string[]>
  searchParams: URLSearchParams
  /** Hash without `#`, or `''` when absent/unobservable. */
  hash: string
}

export interface NavigateOptions {
  replace?: boolean
  scroll?: boolean
  state?: unknown
}

export interface ResolvedHref {
  href: HrefObject
  url: string
  external: boolean
}

export interface AdapterRouterCore {
  navigate(to: ResolvedHref, options: NavigateOptions): void
  back(): void
  forward?(): void
  refresh?(): void
  prefetch?(to: ResolvedHref): void
  canGoBack?(): boolean
}

export interface RouterCapabilities {
  readonly forward: boolean
  readonly refresh: boolean
  readonly prefetch: boolean
  readonly scroll: boolean
  readonly hash: boolean
  readonly state: boolean
  readonly canGoBack: boolean
}

export type LinkPrefetch = boolean | 'hover' | 'viewport' | 'render'

export interface AdapterLinkProps {
  to: ResolvedHref
  replace?: boolean
  prefetch?: LinkPrefetch
  scroll?: boolean
  state?: unknown
  children?: ReactNode
  className?: string
  style?: unknown
  /** The framework's native event; normalized by the component layer. */
  onNativePress?: (event: unknown) => void
  accessibilityLabel?: string
  testID?: string
  target?: string
  rel?: string
  download?: string | boolean
}

/** Adapter Links must forward the universal Link's ref under React 18. */
export type AdapterLinkComponent = ForwardRefExoticComponent<
  AdapterLinkProps & RefAttributes<unknown>
>

export interface UpdateSearchParamsOptions {
  method?: 'replace' | 'push'
  scroll?: boolean
}

export type UpdateSearchParams = (
  patch: SearchParamsPatch,
  options?: UpdateSearchParamsOptions,
) => void

export interface RouterAdapter<TPlatform = unknown> {
  readonly name: string
  readonly capabilities: RouterCapabilities
  useLocation(): RouteLocation
  useRouterCore(): AdapterRouterCore
  usePlatform(): TPlatform
  readonly Link?: AdapterLinkComponent
  readonly Redirect: ComponentType<{ to: ResolvedHref }>
  readonly useUpdateSearchParams: () => UpdateSearchParams
}
