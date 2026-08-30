# API reference

The package root contains the provider-driven React API, adapter authoring
types, and all core utilities. `react-native-inter-router/core` contains only
the React-free core utilities. Framework subpaths add a statically bound React
surface and adapter-specific conversion helpers.

## React surface

The root and each framework entry point export these values. Root hooks require
`RoutingProvider`; framework hooks are already bound. `createMemoryRouting()`
returns the same surface as object properties.

| Export                              | Contract                                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `RoutingProvider`                   | Supplies an adapter and optional `onUnsupported` policy. Context overrides static binding. Changing adapter identity requires a remount. |
| `createRouting(adapter?, config?)`  | Creates a complete optionally bound `Routing` surface. Its provider is named `Provider` on the returned object.                          |
| `useAdapter()`                      | Returns the resolved `RouterAdapter`.                                                                                                    |
| `useLocation()`                     | Returns `{ pathname, params, searchParams, hash }`.                                                                                      |
| `usePathname()`                     | Returns the current pathname.                                                                                                            |
| `useParams<T>()`                    | Returns decoded path parameters. Catch-alls are `string[]`.                                                                              |
| `useSearchParams()`                 | Returns the query as `URLSearchParams`.                                                                                                  |
| `useSearchParamsObject<T>()`        | Returns an object view; repeated keys are arrays.                                                                                        |
| `useHash()`                         | Returns the hash without `#`, or `''` if absent/unobservable.                                                                            |
| `useUpdateSearchParams()`           | Returns `(patch, { method?, scroll? }?) => void`; method defaults to `replace`, and generic updates default to no scroll.                |
| `useActiveRoute(href, { exact? }?)` | Segment-boundary prefix match by default; `/` and `exact` use equality. Search/hash are ignored and external hrefs never match.          |
| `useRouter()`                       | Returns the stable unified imperative `Router`.                                                                                          |
| `useCapabilities()`                 | Returns the immutable adapter capability declaration.                                                                                    |
| `usePlatformRouter()`               | Returns the adapter's native router escape hatch.                                                                                        |
| `useLinkProps(href, options?)`      | Returns web anchor or native press props for a custom control.                                                                           |
| `Link`                              | Universal, ref-forwarding navigation component.                                                                                          |
| `Redirect`                          | Declarative replace navigation.                                                                                                          |

`Router` has `navigate`, `push`, `replace`, `back`, `forward`, `refresh`,
`prefetch`, and `canGoBack`, plus readonly `capabilities` and `adapterName`.
`push` and `replace` accept `{ scroll?, state? }`; `navigate` additionally
accepts `replace`.

`Link` accepts `href`, `replace`, `prefetch`, `scroll`, `state`, `onPress`,
`disabled`, `children`, `className`, `style`, `accessibilityLabel`, `testID`,
and the web-oriented `target`, `rel`, and `download` props. `prefetch` is
`boolean | 'hover' | 'viewport' | 'render'`.

## Core values

These functions are exported from both the root and `/core` unless noted.

| Export                   | Purpose                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `normalizeHref`          | Parses a string href or returns an object href unchanged.                           |
| `parseHref`              | Splits the first query/hash delimiters and preserves repeated query keys.           |
| `resolveHref`            | Interpolates params, serializes query values, and normalizes hash input.            |
| `normalizeHash`          | Removes every leading `#`; absent becomes `''`.                                     |
| `isExternalHref`         | Detects scheme-prefixed and protocol-relative destinations.                         |
| `parsePathPattern`       | Parses canonical bracket segments.                                                  |
| `formatPathPattern`      | Formats parsed segments as `brackets`, `colon`, or `dollar`.                        |
| `convertPathPattern`     | Converts a bracket pattern to a selected syntax.                                    |
| `interpolatePathPattern` | Inserts percent-encoded path parameters.                                            |
| `matchPathPattern`       | Matches a concrete pathname and returns decoded params or `null`.                   |
| `pathPatternParamNames`  | Returns dynamic names in pattern order.                                             |
| `toSearchParams`         | Copies/serializes query input to `URLSearchParams`.                                 |
| `searchParamsToObject`   | Converts params to scalar/array object form.                                        |
| `applySearchParamsPatch` | Applies an object or functional patch to a copy.                                    |
| `searchParamsEqual`      | Compares ordered serialized values.                                                 |
| `isActivePath`           | Performs exact or segment-boundary active matching.                                 |
| `createPressEvent`       | Normalizes cancellation while forwarding it to an original event.                   |
| `openExternalUrl`        | Root-only platform operation: browser navigation or React Native `Linking.openURL`. |

Malformed and empty bracket segments are static. Catch-alls match one or more
segments, including when followed by a static suffix. Malformed percent escapes
return `null` from matching instead of throwing.

Public core types are `Href`, `HrefObject`, `HrefParams`, `ParamInput`,
`ParamValue`, `PathSyntax`, `PathSegment`, `QueryInput`, `SearchParamsInput`,
`SearchParamsPatch`, `ActiveMatchOptions`, `PressEvent`, and
`PreventableEvent`.

## Adapter contract

The root exports `defineAdapter` and `describeHref`. It also exports the public
types `AdapterDefinition`, `RouterAdapter`, `AdapterRouterCore`,
`AdapterLinkComponent`, `AdapterLinkProps`, `RouteLocation`,
`RouterCapabilities`, `ResolvedHref`, `NavigateOptions`, `LinkPrefetch`, `UpdateSearchParams`,
`UpdateSearchParamsOptions`, and `OnUnsupported`.

React-facing types are `Routing`, `RoutingProviderProps`, `RoutingConfig`,
`Router`, `RouterNavigateOptions`, `UseLinkPropsOptions`, `LinkOutputProps`,
`WebLinkOutputProps`, `NativeLinkOutputProps`, `LinkProps`, `LinkStyle`,
`LinkComponent`, and `RedirectProps`. `LinkOutputProps` is the portable union
of the web and native output-prop shapes; narrow it before using
platform-specific fields.

## Framework subpaths

Every framework subpath exports its adapter and full React surface. The
additional exports are:

| Subpath         | Additional exports                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/next`         | `nextAdapter`, `NextRouterInstance`, `toNextHref`, `toNextPrefetch`                                                                  |
| `/expo`         | `expoAdapter`, `ExpoRouterInstance`, `ExpoHrefObject`, `toExpoHref`, `splitExpoParams`                                               |
| `/tanstack`     | `tanstackAdapter`, `TanstackRouterInstance`, `TanstackToOptions`, `toTanstackOptions`, `toTanstackPreload`, `tanstackSearchToParams` |
| `/react-router` | `reactRouterAdapter`, `ReactRouterPlatform`, `ReactRouterTo`, `toReactRouterTo`, `toReactRouterPrefetch`, `convertPathPattern`       |

`usePlatformRouter()` returns Next's router, Expo's router, TanStack's router,
or `{ navigate, location }` for React Router.

Adapter conversion details:

- Next receives the fully resolved URL. Only `prefetch={false}` is a distinct
  Next Link setting; other hints leave Next's policy in control.
- Expo receives its structured `{ pathname, params }` shape. Query and path
  params share Expo's bag, with path params winning collisions. Search replace
  upserts use `setParams`; deletion or push uses full navigation. Query patches
  for a current dynamic path-param name are ignored because Expo cannot
  represent both values in its merged parameter bag.
- TanStack receives dollar-pattern navigation, structured search, and
  `_splat` for outbound catch-alls. The public location normalizes its native
  splat fields to `params.splat: string[]`, preserving encoded slashes within
  an element. Object search values exposed through `useSearchParams()` are JSON
  strings.
- React Router receives separate pathname/search/hash fields. Unified
  `scroll={false}` maps to `preventScrollReset`; Link prefetch values map to
  React Router's vocabulary. Its native `*` value is likewise exposed as
  `params.splat: string[]`.

## Memory subpath

`react-native-inter-router/memory` exports:

- `createMemoryHistory(options?)`
- `createMemoryAdapter(options?)`
- `createMemoryRouting(options?, config?)`
- `MemoryHistory`, `MemoryHistoryOptions`, `MemoryEntry`, `MemoryAction`,
  `MemoryAdapter`, `MemoryAdapterOptions`, and `MemoryRouting` types

`MemoryAdapterOptions` accepts `initialEntries`, `initialIndex`, an existing
`history`, and `routes`. When `history` is supplied, initial entry options do
not replace it. The first matching route pattern supplies location params.
