import type { ResolvedHref } from '../../adapter/types'

export interface ExpoHrefObject {
  pathname: string
  params?: Record<string, string | string[]>
}

/** Preserve Expo's route pattern and merge query/path values at its boundary. */
export function toExpoHref(destination: ResolvedHref): ExpoHrefObject {
  const { pathname, params, query } = destination.href
  const merged: Record<string, string | string[]> = {}

  // Expo has one params bag. Path params must win a same-name collision so
  // the destination route itself cannot be changed by a query value.
  for (const source of [query, params]) {
    if (!source) continue
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue
      defineParam(
        merged,
        key,
        Array.isArray(value) ? value.map(String) : String(value),
      )
    }
  }

  return Object.keys(merged).length === 0
    ? { pathname }
    : { pathname, params: merged }
}

/** Split Expo's merged local params using the current route's segments. */
export function splitExpoParams(
  localParams: Record<string, string | string[] | undefined>,
  segments: readonly string[],
): {
  params: Record<string, string | string[]>
  query: Record<string, string | string[]>
} {
  const dynamicNames = expoDynamicParamNames(segments)

  const params: Record<string, string | string[]> = {}
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(localParams)) {
    if (value === undefined) continue
    const target = dynamicNames.has(key) ? params : query
    defineParam(target, key, value)
  }
  return { params, query }
}

export function expoDynamicParamNames(
  segments: readonly string[],
): Set<string> {
  const names = new Set<string>()
  for (const segment of segments) {
    const match = /^\[(?:\.\.\.)?([^\]]+)]$/.exec(segment)
    const name = match?.[1]
    if (name) names.add(name)
  }
  return names
}

function defineParam(
  target: Record<string, string | string[]>,
  key: string,
  value: string | string[],
): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}
