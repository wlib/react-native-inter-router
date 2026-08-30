import { isExternalHref, normalizeHref, resolveHref, type Href } from './href'

export interface ActiveMatchOptions {
  exact?: boolean
}

export function isActivePath(
  pathname: string,
  href: Href,
  options: ActiveMatchOptions = {},
): boolean {
  if (isExternalHref(href)) return false
  const normalized = normalizeHref(href)
  const target = canonicalPath(
    resolveHref({ ...normalized, query: undefined, hash: undefined }),
  )
  const current = canonicalPath(pathname)

  if (options.exact || target === '' || target === '/')
    return current === target
  return current === target || current.startsWith(`${target}/`)
}

function canonicalPath(value: string): string {
  const queryOrHash = value.search(/[?#]/)
  const pathname = queryOrHash < 0 ? value : value.slice(0, queryOrHash)
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
}
