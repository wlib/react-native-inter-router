# react-native-inter-router implementation plan

## Goal

Build a small, production-quality routing interoperability library for React and
React Native. The working prototype at `/Users/daniel/Downloads/rn-routing` is
the behavioral baseline, not a source tree to copy blindly.

The result must preserve at least this surface:

- A structured `Href` model with bracket-style path parameters.
- Pure URL, path-pattern, active-route, press-event, and search-param helpers.
- An honest adapter contract with declared capabilities and configurable
  unsupported-operation handling.
- React bindings whose provider adapter overrides a statically bound adapter.
- Unified `Link`, `Redirect`, router, location, params, query, active-route,
  capabilities, platform-router, and link-props APIs.
- Next App Router, Expo Router, TanStack Router/Start, React Router, and memory
  adapters.
- Web and native link behavior, including external links, modified clicks,
  disabled links, cancellation, prefetch, scroll, and state where supported.
- A deterministic, inspectable in-memory router suitable for tests and stories.

## Direction

1. Keep the layering explicit: pure core -> adapter contract -> concrete
   adapters -> React bindings/components.
2. Keep structured navigation intact until the concrete adapter boundary.
3. Make unsupported behavior observable and consistent; prefetch remains a
   silent best-effort hint.
4. Ship compiled JavaScript and declarations from `dist`, while preserving
   `.native` files so Metro can select native implementations.
5. Support React 18 and 19 correctly, including forwarded refs.
6. Prefer narrow types and small reusable factories over repeated adapter
   entry-point boilerplate or broad casts.
7. Test public behavior and edge cases, not implementation details.

## Work packages

### A. Foundation and package surface

- Create package metadata, TypeScript build configuration, Jest projects, and
  publish-file verification.
- Implement the pure core and adapter contract.
- Add root, `core`, and concrete-adapter export maps with type declarations.
- Cover URL parsing/resolution, path matching/conversion, query patching,
  active matching, press cancellation, and unsupported policies.

### B. React surface and memory router

- Implement provider/static adapter resolution and the bound-surface factory.
- Implement stable router wrappers and web/native `useLinkProps`.
- Implement ref-safe web/native `Link` and declarative `Redirect`.
- Implement a validated memory history/adapter and integration coverage.

### C. Framework adapters

- Implement Next, Expo, TanStack, and React Router adapters.
- Preserve each router's native Link and richest navigation input.
- Keep framework-specific conversion functions pure and directly tested.
- Use real-router integrations where practical and narrow recording fakes where
  the framework cannot run meaningfully in Jest.

### D. Documentation and consumer quality

- Write a concise README, architecture guide, adapter-authoring guide, and
  changelog.
- Document capability differences and setup for Metro, Next, tests, and
  cross-platform file splitting.
- Add license, repository hygiene, and release checks.

## Acceptance gates

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run build`
- `npm run pack:check`
- Tests exercise every prototype feature plus newly hardened edge cases.
- The packed tarball contains only intended runtime/docs/license artifacts and
  all declared exports resolve to emitted files.
- Two independent review rounds find no unresolved correctness, API, packaging,
  or documentation issues.

## Orchestration

Implementation is delegated in bounded waves. The orchestrator owns this plan,
reviews every change, integrates across work packages, runs all gates, and sends
review findings back for correction. Final review agents inspect the integrated
tree rather than their own isolated slices.
