# Architecture

The library separates pure destination handling, router integration, and
platform rendering so each concern remains small and testable.

## Layers

1. `src/core` is React-free. It owns `Href`, path-pattern conversion and
   matching, active matching, query patches, and normalized press events.
2. `src/adapter` defines the narrow router contract. A destination crosses
   this boundary as both a normalized structure and a resolved URL.
3. `src/adapters` translates that contract to Next, Expo, TanStack, React
   Router, or deterministic memory history.
4. `src/react` and `src/components` bind an adapter into stable hooks and
   platform-appropriate Link/Redirect components.

Structured hrefs prevent a lowest-common-denominator string API. Expo retains
its pattern and merged parameter bag, TanStack retains structured params and
search, React Router receives distinct pathname/search/hash fields, and Next
receives the resolved URL its API expects.

## Adapter resolution

Every hook resolves the nearest provider adapter first and its statically
bound adapter second. With neither, it throws a descriptive error. This makes
framework entry points zero-setup while allowing tests and stories to override
them with memory routing.

An adapter determines hook topology and must be referentially stable at a
mounted tree position. Remount the provider, commonly by changing its `key`,
to switch implementations. The public `Router` object remains stable across
rerenders while dispatching to the latest adapter core returned by its hook.

## Defaults and unsupported behavior

`defineAdapter` fills in only safe higher-level defaults:

- `Redirect` performs replace navigation in an effect.
- `useUpdateSearchParams` copies and patches current query values, composes
  back-to-back patches against an optimistic query snapshot, skips ordered
  no-ops, then reconciles that snapshot when the real location changes.
- `usePlatform` returns `undefined` if omitted.

It does not invent core operations. Missing `forward`, `refresh`, and
`canGoBack` pass through the configured unsupported policy. The default warns
once per adapter/operation outside production and does nothing in production;
`canGoBack` then returns `false`. Missing prefetch is silent.

Capabilities are frozen declarations rather than runtime probes. They also
tell callers whether navigation options such as scroll, hash, and state have
end-to-end support.

## Platform split

Default files implement DOM behavior. Sibling `.native` files implement
React Native Link fallback, link props, and external opening. The build runs
esbuild twice: normal resolution creates the web entry graph, while
native-first resolution creates a separate native graph. Package export
conditions select the latter in modern Metro; top-level `.native.js` shims do
the same for the legacy resolver in React Native 0.74–0.78. This avoids a React
Native import in web bundles while keeping consumers on compiled JavaScript.

Internal enabled links use a framework Link when the adapter provides one.
Fallback links handle external URLs, disabled state, and adapters such as
memory that do not own a Link. Keeping those render paths in distinct
components preserves React hook order. All Link variants use `forwardRef` for
React 18 and 19 compatibility.

## Build and verification

The package publishes `dist`, small legacy Metro entry shims, documentation,
the changelog, license, and package metadata. Web and native public entries use
separate shared-chunk graphs so every subpath in one platform sees the same
routing context. TypeScript emits declarations only; a checked post-process
adds Node16/NodeNext-valid `.js` specifiers. JavaScript source maps are emitted,
while unusable declaration maps and source/test fixtures are not published.

Jest has three projects: pure `.test.ts` files run in Node, `.web.test.tsx`
files run in jsdom, and `.native.test.tsx` files run with the React Native
preset and native-first module extensions. Adapter conversion functions are
tested directly; runtime adapters use real framework routers where practical
and narrow recording fakes where a framework runtime is unavailable.

`npm run pack:check` rebuilds and inspects an actual temporary npm tarball. It
checks every export and legacy shim, proves cross-subpath context sharing,
checks native selection, and compiles strict consumer fixtures under Bundler,
Node16, and NodeNext resolution.

The lower-level rationale and invariants are recorded in [DESIGN.md](DESIGN.md).
