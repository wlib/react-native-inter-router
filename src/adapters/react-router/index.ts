import { createRouting } from '../../react/create-routing'
import { reactRouterAdapter, type ReactRouterPlatform } from './adapter'

export { reactRouterAdapter, type ReactRouterPlatform }
export { convertPathPattern } from './adapter'
export {
  toReactRouterPrefetch,
  toReactRouterTo,
  type ReactRouterTo,
} from './href'

export const {
  Provider: RoutingProvider,
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
} = createRouting<ReactRouterPlatform>(reactRouterAdapter)
