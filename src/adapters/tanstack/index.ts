import { createRouting } from '../../react/create-routing'
import { tanstackAdapter, type TanstackRouterInstance } from './adapter'

export { tanstackAdapter, type TanstackRouterInstance }
export {
  tanstackSearchToParams,
  toTanstackOptions,
  toTanstackPreload,
  type TanstackToOptions,
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
} = createRouting<TanstackRouterInstance>(tanstackAdapter)
