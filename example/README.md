# Example workspace

One set of screens, five apps, five routers. The screens live in
[`packages/app`](packages/app) and are written once against the
provider-driven root entry of `react-native-inter-router` (plus overlays from
`react-native-overlaid`). Each app under [`apps/`](apps) renders those same
screens through a different adapter:

| App                 | Router               | Adapter wiring                                         |
| ------------------- | -------------------- | ------------------------------------------------------ |
| `apps/next`         | Next.js App Router   | `<RoutingProvider adapter={nextAdapter}>` in a layout  |
| `apps/expo`         | Expo Router          | `<RoutingProvider adapter={expoAdapter}>` in `_layout` |
| `apps/tanstack`     | TanStack Router      | `<RoutingProvider adapter={tanstackAdapter}>` at root  |
| `apps/react-router` | React Router v7      | `<RoutingProvider adapter={reactRouterAdapter}>`       |
| `apps/memory`       | none (memory router) | `createMemoryRouting().Provider` — no framework at all |

Every app has the same three routes — `/`, `/users`, and `/users/[id]` — and
each route file is a one-line re-export of a shared screen. The route files and
the provider are the only per-app code.

The screens exercise the whole shared vocabulary: structured `Href` links with
bracket params, `useParams`, `useActiveRoute` in the nav bar,
`useUpdateSearchParams` for the search filter / sort / tab state,
`router.back()` guarded by `useCapabilities().canGoBack`, and `<Redirect>` for
unknown users. The home screen renders the live capability matrix so the
differences between routers are visible instead of hidden.

`react-native-overlaid` supplies `Dialog`, `Popover`, and `Tooltip` inside the
shared screens to show the two libraries composing: overlays from one package,
navigation from another, both written once for web and native.

## Setup

The workspace links two libraries by path: `react-native-inter-router` from the
parent directory (run `npm run build` there first so `dist/` exists) and
`react-native-overlaid` from a sibling checkout at
`../../react-native-overlaid` (its `lib/` must also be built).

```sh
npm install
```

Then run any app:

```sh
npm run dev:next
npm run dev:expo
npm run dev:tanstack
npm run dev:react-router
npm run dev:memory
```

The memory app is the odd one out on purpose: the browser URL never changes
because no framework router is mounted. Navigation still works, which is the
point — the same screens run against a deterministic in-memory history, exactly
as they would inside a Jest test or a Storybook story.
