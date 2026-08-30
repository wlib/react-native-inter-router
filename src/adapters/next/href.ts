import type { LinkPrefetch, ResolvedHref } from '../../adapter/types'

/** Next App Router navigation accepts an already-resolved URL. */
export function toNextHref(destination: ResolvedHref): string {
  return destination.url
}

/** Next only exposes an opt-out switch; richer hints use its default policy. */
export function toNextPrefetch(
  prefetch: LinkPrefetch | undefined,
): false | undefined {
  return prefetch === false ? false : undefined
}
