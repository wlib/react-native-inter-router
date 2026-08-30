'use client'

import { createRouting } from '../../react/create-routing'
import { nextAdapter, type NextRouterInstance } from './adapter'

export { nextAdapter, type NextRouterInstance }
export { toNextHref, toNextPrefetch } from './href'

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
} = createRouting<NextRouterInstance>(nextAdapter)
