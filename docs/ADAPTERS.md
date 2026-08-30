# Authoring an adapter

An adapter needs a stable name, a location hook, a navigation-core hook, and
an honest capability declaration. `defineAdapter` supplies safe defaults for
the remaining higher-level behavior.

```tsx
import {
  createRouting,
  defineAdapter,
  type AdapterRouterCore,
  type RouteLocation,
} from 'react-native-inter-router'

export const exampleAdapter = defineAdapter({
  name: 'example',
  capabilities: {
    forward: true,
    hash: true,
    state: true,
  },

  useLocation(): RouteLocation {
    const location = useExampleLocation()
    return {
      pathname: location.pathname,
      params: location.params,
      searchParams: new URLSearchParams(location.search),
      hash: location.hash.replace(/^#/, ''),
    }
  },

  useRouterCore(): AdapterRouterCore {
    const router = useExampleRouter()
    return {
      navigate(to, options) {
        router.navigate(to.url, options)
      },
      back: router.back,
      forward: router.forward,
    }
  },

  usePlatform: useExampleRouter,
})

export const routing = createRouting(exampleAdapter)
```

All fields are hooks where named as hooks and must obey React's rules. Keep the
adapter object itself referentially stable—normally export one module-level
value. Hook return values may change; the bindings route the stable public
router through the latest core.

## Location contract

Return four independent values:

- `pathname`: the current concrete pathname, without query or hash;
- `params`: decoded path parameters only, using arrays for catch-alls;
- `searchParams`: a `URLSearchParams` view of query values;
- `hash`: no leading `#`, or `''` when absent or unobservable.

Do not mix query keys into `params`. If the framework exposes one merged bag,
split it using route metadata as the Expo adapter does. Return values should
change when the observable location changes so React consumers rerender.
Routers whose native catch-all key has no canonical name should expose it as
`params.splat: string[]` and reconstruct elements from the encoded pathname
when the native router collapses them into one decoded string.

## Navigation contract

`navigate` receives a `ResolvedHref`:

```ts
interface ResolvedHref {
  href: HrefObject // normalized structure
  url: string // resolved and encoded URL
  external: boolean
}
```

Choose the richest representation the framework accepts. Translate canonical
bracket paths only at this boundary. `back` is required; `forward`, `refresh`,
`prefetch`, and `canGoBack` are optional. Add an operation only when it has the
publicly described semantics.

The navigation options are `replace`, `scroll`, and `state`. Declare `scroll`
or `state` only if those values are preserved through both imperative and Link
navigation. Prefetch implementations should be best-effort and must not cause
unhandled rejection for an invalid/unmatched hint.

## Capabilities

Unspecified flags default to false, and the completed record is frozen. Keep
it consistent with the actual core and component mappings:

```ts
interface RouterCapabilities {
  forward: boolean
  refresh: boolean
  prefetch: boolean
  scroll: boolean
  hash: boolean
  state: boolean
  canGoBack: boolean
}
```

`prefetch` describes `router.prefetch()`, not necessarily a framework Link's
own discovery/preload option. Document any deliberate distinction.

## Optional overrides

`Link` receives an `AdapterLinkProps` destination plus navigation, visual,
accessibility, and web pass-through props. It must be an
`AdapterLinkComponent` created with `forwardRef`; the ref is supplied through
React's ref channel rather than as an ordinary `AdapterLinkProps` field.
Invoke `onNativePress` with the real framework event so a caller's
`preventDefault()` can cancel framework navigation. Only enabled internal
destinations use this component; the shared platform fallback handles external
and disabled links.

Override `Redirect` when the framework provides a declarative redirect that is
better than generic replace-on-effect. Override `useUpdateSearchParams` when a
framework has a higher-fidelity in-place primitive. Preserve patch semantics:
copy inputs, delete on `undefined`, skip ordered no-ops, and honor push versus
replace. Advance an optimistic query snapshot synchronously so multiple calls
in one React batch compose, then reconcile it when the observed route changes.
Expo uses `setParams` for replace upserts but keeps full navigation after a
same-batch delete or push because `setParams` cannot safely refine those
operations.

## Entry point and tests

Export the adapter, pure conversion helpers, and the complete bound surface:

```ts
import { createRouting } from 'react-native-inter-router'

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
} = createRouting(exampleAdapter)
```

Adding a published adapter also requires an export-map entry and optional peer
dependency. Those package changes are deliberately manual so missing emitted
targets fail `pack:check` rather than being hidden by a wildcard.

Test pure conversion separately from React integration. Cover destination
structure, repeated query keys, catch-alls, prefetch mapping, all declared
capabilities, cancellation, ref forwarding, and any framework-specific query
update path. Run the full format, lint, typecheck, Jest, build, and pack gates.
