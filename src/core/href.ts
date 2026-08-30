import { interpolatePathPattern } from './path-pattern'

export type ParamValue = string | number | boolean
export type ParamInput = ParamValue | readonly ParamValue[]
export type HrefParams = Record<string, ParamInput | undefined>

export interface HrefObject {
  /** A concrete pathname or bracket pattern such as `/users/[id]`. */
  pathname: string
  params?: HrefParams
  query?: HrefParams
  /** With or without a leading `#`. */
  hash?: string
}

export type Href = string | HrefObject

/** Strings are parsed; object hrefs retain their structure and identity. */
export function normalizeHref(href: Href): HrefObject {
  return typeof href === 'string' ? parseHref(href) : href
}

/** Parse on the first `#` and first `?`, preserving repeats and empty values. */
export function parseHref(url: string): HrefObject {
  const hashIndex = url.indexOf('#')
  const beforeHash = hashIndex < 0 ? url : url.slice(0, hashIndex)
  const hash = hashIndex < 0 ? undefined : url.slice(hashIndex + 1)
  const queryIndex = beforeHash.indexOf('?')
  const pathname = queryIndex < 0 ? beforeHash : beforeHash.slice(0, queryIndex)
  const queryString =
    queryIndex < 0 ? undefined : beforeHash.slice(queryIndex + 1)

  const result: HrefObject = { pathname }
  if (queryString !== undefined && queryString !== '') {
    const query: Record<string, string | string[]> = {}
    new URLSearchParams(queryString).forEach((value, key) => {
      if (!Object.prototype.hasOwnProperty.call(query, key)) {
        defineQueryValue(query, key, value)
      } else {
        const previous = query[key]
        defineQueryValue(
          query,
          key,
          Array.isArray(previous)
            ? [...previous, value]
            : [previous as string, value],
        )
      }
    })
    if (Object.keys(query).length > 0) result.query = query
  }
  if (hash !== undefined) result.hash = hash
  return result
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

/** Interpolate path params, then append query and a normalized hash. */
export function resolveHref(href: Href): string {
  if (typeof href === 'string') return href

  let url = href.params
    ? interpolatePathPattern(href.pathname, href.params)
    : href.pathname
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(href.query ?? {})) {
    if (value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) search.append(key, String(item))
  }

  const queryString = search.toString()
  if (queryString) url += `?${queryString}`

  const hash = normalizeHash(href.hash)
  if (hash) url += `#${hash}`
  return url
}

/** Remove all leading hash markers. Empty and absent hashes normalize to `''`. */
export function normalizeHash(hash: string | undefined): string {
  return hash?.replace(/^#+/, '') ?? ''
}

/** Absolute-scheme and protocol-relative destinations leave the app router. */
export function isExternalHref(href: Href): boolean {
  const pathname = typeof href === 'string' ? href : href.pathname
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(pathname)
}
