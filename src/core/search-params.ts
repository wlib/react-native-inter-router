import type { HrefParams } from './href'

export type QueryInput = HrefParams
export type SearchParamsInput = QueryInput | URLSearchParams | string

export function toSearchParams(input: SearchParamsInput): URLSearchParams {
  if (input instanceof URLSearchParams) {
    return new URLSearchParams(input.toString())
  }
  if (typeof input === 'string') return new URLSearchParams(input)

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) search.append(key, String(item))
  }
  return search
}

export function searchParamsToObject<
  T extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[]
  >,
>(searchParams: URLSearchParams): T {
  const result: Record<string, string | string[]> = {}
  searchParams.forEach((value, key) => {
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      defineQueryValue(result, key, value)
      return
    }
    const previous = result[key]
    defineQueryValue(
      result,
      key,
      Array.isArray(previous)
        ? [...previous, value]
        : [previous as string, value],
    )
  })
  return result as T
}

function defineQueryValue(
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

export type SearchParamsPatch =
  QueryInput | ((current: URLSearchParams) => URLSearchParams | QueryInput)

/** Always works on and returns a copy; caller-owned params are never mutated. */
export function applySearchParamsPatch(
  current: URLSearchParams,
  patch: SearchParamsPatch,
): URLSearchParams {
  const copy = new URLSearchParams(current.toString())
  if (typeof patch === 'function') {
    const result = patch(copy)
    return toSearchParams(result)
  }

  for (const [key, value] of Object.entries(patch)) {
    copy.delete(key)
    if (value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) copy.append(key, String(item))
  }
  return copy
}

/** URLSearchParams is ordered, so equality intentionally includes ordering. */
export function searchParamsEqual(
  first: URLSearchParams,
  second: URLSearchParams,
): boolean {
  return first.toString() === second.toString()
}
