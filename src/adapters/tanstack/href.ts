import type { LinkPrefetch, ResolvedHref } from '../../adapter/types'
import { normalizeHash } from '../../core/href'
import { formatPathPattern, parsePathPattern } from '../../core/path-pattern'

export interface TanstackToOptions {
  to: string
  params?: Record<string, string>
  search?: Record<string, unknown>
  hash?: string
}

/** Convert canonical bracket routes to TanStack's typed-navigation shape. */
export function toTanstackOptions(
  destination: ResolvedHref,
): TanstackToOptions {
  const { pathname, params = {}, query, hash } = destination.href
  const segments = parsePathPattern(pathname)
  const mappedParams: Record<string, string> = {}
  let needsConcretePathname = false

  for (const segment of segments) {
    if (segment.type === 'static') continue
    const input = Object.prototype.hasOwnProperty.call(params, segment.name)
      ? params[segment.name]
      : undefined
    if (input === undefined) continue

    if (segment.type === 'catchall') {
      const values = Array.isArray(input) ? input : [input]
      if (values.some((value) => String(value).includes('/'))) {
        needsConcretePathname = true
      } else if (values.length > 0) {
        defineValue(mappedParams, '_splat', values.map(String).join('/'))
      }
      continue
    }

    const value = Array.isArray(input) ? input[0] : input
    if (value !== undefined)
      defineValue(mappedParams, segment.name, String(value))
  }

  const result: TanstackToOptions = {
    to: needsConcretePathname
      ? resolvedPathname(destination.url)
      : formatPathPattern(segments, 'dollar'),
  }
  if (!needsConcretePathname && Object.keys(mappedParams).length > 0) {
    result.params = mappedParams
  }
  if (query && Object.values(query).some((value) => value !== undefined)) {
    result.search = query
  }
  const normalizedHash = normalizeHash(hash)
  if (normalizedHash) result.hash = normalizedHash
  return result
}

function resolvedPathname(url: string): string {
  const end = [url.indexOf('?'), url.indexOf('#')]
    .filter((index) => index >= 0)
    .reduce((first, index) => Math.min(first, index), url.length)
  return url.slice(0, end)
}

function defineValue(
  target: Record<string, string>,
  key: string,
  value: string,
): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}

/** Convert TanStack's decoded structured search into the public URL view. */
export function tanstackSearchToParams(
  search: Record<string, unknown>,
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item === undefined || item === null) continue
      const serialized =
        typeof item === 'object' ? JSON.stringify(item) : String(item)
      if (serialized !== undefined) params.append(key, serialized)
    }
  }
  return params
}

export function toTanstackPreload(
  prefetch: LinkPrefetch | undefined,
): false | 'intent' | 'viewport' | 'render' | undefined {
  if (prefetch === undefined) return undefined
  if (prefetch === false) return false
  return prefetch === true || prefetch === 'hover' ? 'intent' : prefetch
}
