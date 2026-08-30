export type {
  Href,
  HrefObject,
  HrefParams,
  ParamInput,
  ParamValue,
} from './core/href'
export {
  normalizeHash,
  normalizeHref,
  parseHref,
  resolveHref,
  isExternalHref,
} from './core/href'
export type { PathSyntax, PathSegment } from './core/path-pattern'
export {
  parsePathPattern,
  formatPathPattern,
  convertPathPattern,
  interpolatePathPattern,
  matchPathPattern,
  pathPatternParamNames,
} from './core/path-pattern'
export type {
  QueryInput,
  SearchParamsInput,
  SearchParamsPatch,
} from './core/search-params'
export {
  toSearchParams,
  searchParamsToObject,
  applySearchParamsPatch,
  searchParamsEqual,
} from './core/search-params'
export { isActivePath, type ActiveMatchOptions } from './core/active'
export {
  createPressEvent,
  type PressEvent,
  type PreventableEvent,
} from './core/press-event'
export { openExternalUrl } from './core/open-external'

export type {
  RouterAdapter,
  AdapterRouterCore,
  AdapterLinkComponent,
  AdapterLinkProps,
  RouteLocation,
  RouterCapabilities,
  ResolvedHref,
  NavigateOptions,
  LinkPrefetch,
  UpdateSearchParams,
  UpdateSearchParamsOptions,
} from './adapter/types'
export { defineAdapter, type AdapterDefinition } from './adapter/define-adapter'
export { describeHref } from './adapter/resolved-href'
export type { OnUnsupported } from './adapter/unsupported'

export { createRouting, type Routing } from './react/create-routing'
export {
  RoutingProvider,
  type RoutingProviderProps,
  type RoutingConfig,
} from './react/context'
export type { Router, RouterNavigateOptions } from './react/router'
export type {
  UseLinkPropsOptions,
  LinkOutputProps,
  NativeLinkOutputProps,
  WebLinkOutputProps,
} from './react/create-use-link-props'
export type {
  LinkProps,
  LinkStyle,
  LinkComponent,
} from './components/link-types'
export type { RedirectProps } from './components/create-redirect'

import { createRouting } from './react/create-routing'

const contextRouting = createRouting()

export const {
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
} = contextRouting
