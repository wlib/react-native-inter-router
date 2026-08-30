import { createRouting } from '../../react/create-routing'
import { expoAdapter, type ExpoRouterInstance } from './adapter'

export { expoAdapter, type ExpoRouterInstance }
export { splitExpoParams, toExpoHref, type ExpoHrefObject } from './href'

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
} = createRouting<ExpoRouterInstance>(expoAdapter)
