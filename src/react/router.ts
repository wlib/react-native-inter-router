import type { Href } from '../core/href'
import { describeHref } from '../adapter/resolved-href'
import { handleUnsupported, type OnUnsupported } from '../adapter/unsupported'
import type {
  AdapterRouterCore,
  NavigateOptions,
  RouterAdapter,
  RouterCapabilities,
} from '../adapter/types'

export interface RouterNavigateOptions {
  scroll?: boolean
  state?: unknown
}

export interface Router {
  push(href: Href, options?: RouterNavigateOptions): void
  replace(href: Href, options?: RouterNavigateOptions): void
  navigate(href: Href, options?: NavigateOptions): void
  back(): void
  forward(): void
  refresh(): void
  /** Prefetch is an optimization hint and is silently ignored if absent. */
  prefetch(href: Href): void
  canGoBack(): boolean
  readonly capabilities: RouterCapabilities
  readonly adapterName: string
}

type CurrentCore = AdapterRouterCore | (() => AdapterRouterCore)

function readCore(value: CurrentCore): AdapterRouterCore {
  return typeof value === 'function' ? value() : value
}

/**
 * Wrap the adapter's narrow navigation core in the public router API.
 * A getter may be supplied by React bindings so the returned wrapper stays
 * referentially stable while invoking the latest hook result.
 */
export function wrapRouterCore(
  adapter: RouterAdapter<any>,
  currentCore: CurrentCore,
  onUnsupported: OnUnsupported | undefined,
): Router {
  const unsupported = (operation: string) =>
    handleUnsupported(onUnsupported, adapter.name, operation)

  return {
    navigate(href, options = {}) {
      readCore(currentCore).navigate(describeHref(href), options)
    },
    push(href, options) {
      readCore(currentCore).navigate(describeHref(href), {
        ...options,
        replace: false,
      })
    },
    replace(href, options) {
      readCore(currentCore).navigate(describeHref(href), {
        ...options,
        replace: true,
      })
    },
    back() {
      readCore(currentCore).back()
    },
    forward() {
      const core = readCore(currentCore)
      return core.forward ? core.forward() : unsupported('forward')
    },
    refresh() {
      const core = readCore(currentCore)
      return core.refresh ? core.refresh() : unsupported('refresh')
    },
    prefetch(href) {
      readCore(currentCore).prefetch?.(describeHref(href))
    },
    canGoBack() {
      const core = readCore(currentCore)
      if (core.canGoBack) return core.canGoBack()
      unsupported('canGoBack')
      return false
    },
    capabilities: adapter.capabilities,
    adapterName: adapter.name,
  }
}
