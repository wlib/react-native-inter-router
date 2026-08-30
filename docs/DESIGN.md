# Design decisions

## Public vocabulary

The canonical destination is either a URL string or a structured object:

```ts
type Href =
  | string
  | {
      pathname: string
      params?: Record<string, ParamInput | undefined>
      query?: Record<string, ParamInput | undefined>
      hash?: string
    }
```

Bracket patterns (`[id]`, `[...slug]`) are the public spelling. Concrete
adapters translate only at their boundary. Every adapter receives both this
normalized structure and its resolved URL string.

## Adapter boundary

An adapter supplies three hooks: location, navigation core, and platform escape
hatch. It may additionally supply a framework Link, Redirect, or a higher
fidelity query-update hook. A definition factory fills safe generic defaults.

Capabilities are immutable declarations. Optional core operations remain
optional so a false capability cannot accidentally be implemented as a fake.
Unified methods route missing operations through the configured unsupported
policy. Prefetch alone is silent because it is an optimization hint.

## Binding precedence

Every public hook resolves its adapter in this order:

1. nearest `RoutingProvider`;
2. adapter statically bound by a package subpath;
3. a descriptive error.

This lets application code import a zero-setup framework entry point while a
test or story supplies a memory adapter without module mocks. An adapter must
remain stable at a mounted tree position; changing router implementations
requires a remount.

## Platform boundary

Default files implement web behavior; sibling `.native` files implement native
behavior. Native-first and default builds produce separate shared ESM graphs;
export conditions select the native graph in modern Metro, and small legacy
shims preserve the same behavior on React Native 0.74–0.78. Custom Link
components use `forwardRef` so the React 18 peer range is real rather than
aspirational.

## Packaging

Consumers load compiled ESM and declarations from `dist`; they are not required
to transpile dependency TypeScript. Export maps expose the root bindings, a
React-free `core` entry, and each concrete adapter. Optional router packages are
optional peers; React is the only universal runtime peer.

Declarations use explicit ESM specifiers and are checked under Bundler,
Node16, and NodeNext resolution. Web and native `useLinkProps` results share an
honest portable union rather than relying on TypeScript to infer the runtime
platform condition.

The publish check builds, creates an npm tarball in a temporary directory, and
verifies every declared export and legacy shim, context sharing, strict type
consumers, and the absence of source-only test fixtures.

## Correctness invariants

- Path interpolation percent-encodes individual values, never separators
  introduced by a catch-all array.
- Parsing preserves repeated query keys and separates hash before query.
- Hash input is normalized without producing `##fragment`.
- Path matching rejects malformed escapes without crashing consumers.
- Memory history always has at least one entry and clamps its initial index to a
  valid integer range.
- Search updates never mutate the caller's current `URLSearchParams`.
- Web Links leave external destinations and modified/non-primary clicks to the
  browser; native Links send external destinations through the OS.
- A user `preventDefault()` reaches an underlying framework event and cancels
  fallback navigation.
