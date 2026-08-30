# react-native-inter-router

A small, typed interoperability layer for routing in React and React Native.
Use one `Href`, hook, and component vocabulary with Next.js App Router, Expo
Router, TanStack Router/Start, React Router, or an inspectable memory router.

```tsx
import {
  Link,
  useRouter,
  useUpdateSearchParams,
} from 'react-native-inter-router/next'

function UserActions({ id }: { id: string }) {
  const router = useRouter()
  const updateSearch = useUpdateSearchParams()

  return (
    <>
      <Link href={{ pathname: '/users/[id]', params: { id } }}>Profile</Link>
      <button onClick={() => updateSearch({ tab: 'activity' })}>
        Activity
      </button>
      <button onClick={() => router.back()}>Back</button>
    </>
  )
}
```

The package preserves structured destinations until the adapter boundary,
uses each framework's Link when possible, and declares unsupported behavior
instead of silently pretending every router has the same features.

## Installation

```sh
npm install react-native-inter-router
```

React is the only universal runtime peer. Install the router used by each app:

| Entry point                              | Peer dependency                             |
| ---------------------------------------- | ------------------------------------------- |
| `react-native-inter-router/next`         | `next >=14`                                 |
| `react-native-inter-router/expo`         | `expo-router >=4` and `react-native >=0.74` |
| `react-native-inter-router/tanstack`     | `@tanstack/react-router >=1`                |
| `react-native-inter-router/react-router` | `react-router >=7`                          |
| `react-native-inter-router/memory`       | none beyond React                           |

The package supports React 18 and 19, declares Node 18.18 or newer for
consumers, and ships compiled ESM plus declarations. Working on this repository
requires Node 20.19.4 or newer because the current Next and React Native test
toolchain requires it. Consumers do not need to transpile this package in
Next.js.

## Choose an entry point

Framework entry points export a complete, statically bound surface with no
provider setup:

```tsx
import {
  Link,
  Redirect,
  RoutingProvider,
  useActiveRoute,
  useAdapter,
  useCapabilities,
  useHash,
  useLinkProps,
  useLocation,
  useParams,
  usePathname,
  usePlatformRouter,
  useRouter,
  useSearchParams,
  useSearchParamsObject,
  useUpdateSearchParams,
} from 'react-native-inter-router/next'
```

Replace `/next` with `/expo`, `/tanstack`, or `/react-router`. The package root
exports the same React surface without a bound adapter; wrap it in the root
`RoutingProvider` when supplying a custom adapter. The `/memory` entry instead
exports factories that create an isolated bound surface.

## Destinations

Every navigation API accepts either a string or a structured `Href`:

```ts
type Href =
  | string
  | {
      pathname: string
      params?: Record<
        string,
        | string
        | number
        | boolean
        | readonly (string | number | boolean)[]
        | undefined
      >
      query?: Record<
        string,
        | string
        | number
        | boolean
        | readonly (string | number | boolean)[]
        | undefined
      >
      hash?: string
    }
```

Bracket syntax is canonical: `[id]` is one segment and `[...slug]` is a
one-or-more-segment catch-all.

```ts
router.push({
  pathname: '/docs/[...slug]',
  params: { slug: ['guides', 'routing'] },
  query: { mode: 'compact', tag: ['react', 'native'] },
  hash: 'examples',
})
// /docs/guides/routing?mode=compact&tag=react&tag=native#examples
```

Each parameter value is encoded as one segment. Catch-all array elements keep
their separators between elements; a slash inside an element becomes `%2F`.
Missing params remain visible in the resolved path, which makes mistakes
inspectable instead of guessing a value.

## Hooks and navigation

```tsx
const location = useLocation()
// { pathname, params, searchParams: URLSearchParams, hash: string }

usePathname()
useParams()
useSearchParams()
useSearchParamsObject() // repeated keys become string[]
useHash() // no leading '#'; '' if absent or unsupported
useActiveRoute('/users')
useActiveRoute('/users', { exact: true })
useCapabilities()
usePlatformRouter() // framework-native escape hatch
useAdapter()

const router = useRouter()
router.push('/users/1', { scroll: false, state: { source: 'list' } })
router.replace('/login')
router.navigate('/next', { replace: true, scroll: false })
router.back()
router.forward()
router.refresh()
router.prefetch('/dashboard')
router.canGoBack()
router.adapterName
router.capabilities
```

`scroll` and `state` are honored only when the adapter declares those
capabilities. Calling unsupported `forward`, `refresh`, or `canGoBack` warns
once per operation in development and is a no-op in production; configure
`onUnsupported="error"`, `"warn"`, `"noop"`, or a callback on a provider.
Missing prefetch is always a silent no-op because prefetch is only a hint.

Search updates are patches. `undefined` deletes a key, arrays replace all
values for a key, and a function receives a mutable copy for full control:

```tsx
const updateSearch = useUpdateSearchParams()

updateSearch({ page: 2, filter: undefined })
updateSearch(
  (current) => {
    current.append('tag', 'new')
    return current
  },
  { method: 'push', scroll: false },
)
```

No navigation occurs if the ordered serialized query is unchanged. Inputs are
copied; caller-owned `URLSearchParams` objects are not mutated. The generic
implementation replaces without scrolling unless `{ scroll: true }` is
requested; adapters may use a more native operation (Expo's replace upserts
use `setParams`).

## Link and Redirect

```tsx
<Link
  href={{ pathname: '/users/[id]', params: { id } }}
  replace
  prefetch="hover"
  scroll={false}
  state={{ source: 'list' }}
  onPress={(event) => {
    if (busy) event.preventDefault()
  }}
  disabled={!ready}
>
  Open user
</Link>

<Redirect href="/login" />
```

`prefetch` accepts `boolean | 'hover' | 'viewport' | 'render'` and is mapped to
the framework's closest Link behavior. `Redirect` replaces the current entry.
Refs are forwarded to the concrete framework/platform element.

On web, external destinations, modified or non-primary clicks, non-self
targets, and downloads remain browser-owned. Disabled links have no `href` and
are inert. On native, fallback links use `Pressable`, and external schemes are
sent to `Linking.openURL`. In either environment, `preventDefault()` cancels
fallback navigation and propagates to a framework Link's underlying event.

`useLinkProps(href, options)` is available for custom controls. It returns
anchor props (`href`, `onClick`, accessibility fields) on web and press props
(`onPress`, accessibility fields) on native. It performs navigation but does
not provide framework Link prefetching. Its portable public result type is the
union `WebLinkOutputProps | NativeLinkOutputProps`; narrow by `onClick` or
`onPress` before reading platform-specific fields.

## Capabilities

These flags describe the unified imperative API. A framework Link may have a
separate optimization; notably React Router Link prefetch mapping exists while
`router.prefetch()` is unsupported.

| Capability  | Next | Expo  | TanStack | React Router | Memory |
| ----------- | :--: | :---: | :------: | :----------: | :----: |
| `forward`   | yes  |  no   |   yes    |     yes      |  yes   |
| `refresh`   | yes  | yes\* |   yes    |      no      |  yes   |
| `prefetch`  | yes  |  yes  |   yes    |     no\*     |  yes   |
| `scroll`    | yes  |  no   |   yes    |     yes      |   no   |
| `hash`      |  no  |  no   |   yes    |     yes      |  yes   |
| `state`     |  no  |  no   |   yes    |     yes      |  yes   |
| `canGoBack` |  no  |  yes  |   yes    |      no      |  yes   |

\* Expo refresh replaces the current Expo route; it is not a data cache
invalidation primitive. React Router's `Link` supports prefetch values, but the
library-mode adapter has no imperative `router.prefetch()` implementation.

For framework-specific conversion and escape-hatch details, see
[the API reference](docs/API.md).

## Cross-platform apps

Put the router choice behind platform files and import that module everywhere:

```ts
// lib/routing.ts — web
export * from 'react-native-inter-router/next'
```

```ts
// lib/routing.native.ts — React Native
export * from 'react-native-inter-router/expo'
```

Metro selects the `.native` implementation of Link, `useLinkProps`, and
external URL opening from the package's compiled output. Default files are the
web implementation. Keep normal `.native.ts` resolution enabled; no package
source transpilation or alias is required. Modern Metro uses the package export
conditions; top-level web/native shims preserve the same subpaths under the
legacy resolver used by React Native 0.74–0.78.

## Example workspace

[`example/`](example) holds one set of screens rendered identically by five
apps — Next.js, Expo Router, TanStack Router, React Router, and a
framework-free memory-routing app. The screens are written once against the
provider-driven package root; each app contributes only route wiring and a
`<RoutingProvider adapter={...}>`. See [example/README.md](example/README.md).

## Testing with memory routing

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouting } from 'react-native-inter-router/memory'

const routing = createMemoryRouting({
  initialEntries: ['/users/42?tab=posts'],
  routes: ['/users/[id]'],
})

render(
  <routing.Provider>
    <App />
  </routing.Provider>,
)

fireEvent.click(screen.getByRole('link', { name: 'Next' }))
expect(routing.history.current.url).toBe('/users/43')
expect(routing.history.log.at(-1)).toEqual({
  type: 'push',
  url: '/users/43',
})
```

Provider context takes precedence over a statically bound adapter, so the
memory provider also overrides hooks that `App` imported from a framework
entry point. No module mock is needed. `routes` are bracket patterns used only
to derive `useParams()` from the current URL.

The history exposes immutable `entries`, `current`, and `log` snapshots plus
`index`, `push`, `replace`, `back`, `forward`, `refresh`, `prefetch`,
`canGoBack`, `canGoForward`, and `subscribe`. A push after going back truncates
the forward stack. Empty histories become `['/']`, and `initialIndex` is
truncated and clamped to a valid entry.

## Package and development

The package is ESM-only. Public exports resolve to compiled ES2020 bundles and
Node16/NodeNext-compatible declarations in `dist`. Web entry points share one
chunk graph and native entry points share another, so provider context remains
singleton across package subpaths. Native export conditions and legacy Metro
shims select the native graph. Optional router packages remain optional peers,
so import only the adapter installed in that app.

```sh
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
npm run pack:check
```

`pack:check` rebuilds and extracts a temporary tarball, verifies every export
and legacy shim, rejects source/tests, proves context sharing in modern and
legacy resolution, and compiles strict Bundler, Node16, and NodeNext consumer
fixtures.

See [architecture](docs/ARCHITECTURE.md), [adapter authoring](docs/ADAPTERS.md),
and the [complete API reference](docs/API.md).

## License

MIT
