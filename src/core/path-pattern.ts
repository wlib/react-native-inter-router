import type { HrefParams, ParamValue } from './href'

export type PathSyntax = 'brackets' | 'colon' | 'dollar'

export type PathSegment =
  | { type: 'static'; value: string }
  | { type: 'param'; name: string }
  | { type: 'catchall'; name: string }

const PARAM = /^\[(?!\.\.\.)(.+)]$/
const CATCHALL = /^\[\.\.\.(.+)]$/

/** Parse only well-formed, non-empty bracket segments as parameters. */
export function parsePathPattern(pattern: string): PathSegment[] {
  return pattern.split('/').map((value): PathSegment => {
    const catchall = CATCHALL.exec(value)
    if (catchall?.[1] && isValidParamName(catchall[1])) {
      return { type: 'catchall', name: catchall[1] }
    }
    const param = PARAM.exec(value)
    if (param?.[1] && isValidParamName(param[1])) {
      return { type: 'param', name: param[1] }
    }
    return { type: 'static', value }
  })
}

function isValidParamName(name: string): boolean {
  return !name.includes('[') && !name.includes(']')
}

export function formatPathPattern(
  segments: readonly PathSegment[],
  syntax: PathSyntax,
): string {
  return segments.map((segment) => formatSegment(segment, syntax)).join('/')
}

function formatSegment(segment: PathSegment, syntax: PathSyntax): string {
  if (segment.type === 'static') return segment.value
  if (segment.type === 'param') {
    if (syntax === 'brackets') return `[${segment.name}]`
    if (syntax === 'colon') return `:${segment.name}`
    return `$${segment.name}`
  }
  if (syntax === 'brackets') return `[...${segment.name}]`
  return syntax === 'colon' ? '*' : '$'
}

export function convertPathPattern(pattern: string, to: PathSyntax): string {
  return formatPathPattern(parsePathPattern(pattern), to)
}

export function pathPatternParamNames(pattern: string): string[] {
  return parsePathPattern(pattern).flatMap((segment) =>
    segment.type === 'static' ? [] : [segment.name],
  )
}

/** Missing parameters remain visible; values are encoded one segment at a time. */
export function interpolatePathPattern(
  pattern: string,
  params: HrefParams,
): string {
  return parsePathPattern(pattern)
    .map((segment) => {
      if (segment.type === 'static') return segment.value
      if (!Object.prototype.hasOwnProperty.call(params, segment.name)) {
        return formatSegment(segment, 'brackets')
      }
      const value = params[segment.name]
      if (value === undefined) return formatSegment(segment, 'brackets')

      if (segment.type === 'catchall') {
        const values = Array.isArray(value) ? value : [value]
        return values.map(encodePathValue).join('/')
      }
      const first = Array.isArray(value) ? value[0] : value
      return first === undefined
        ? formatSegment(segment, 'brackets')
        : encodePathValue(first)
    })
    .join('/')
}

function encodePathValue(value: ParamValue): string {
  return encodeURIComponent(String(value))
}

/**
 * Match a concrete pathname. Catch-alls consume one or more segments and may
 * occur before a suffix; malformed percent escapes simply do not match.
 */
export function matchPathPattern(
  pattern: string,
  pathname: string,
): Record<string, string | string[]> | null {
  const patternSegments = parsePathPattern(pattern)
  const pathSegments = pathname.split('/')

  function visit(
    patternIndex: number,
    pathIndex: number,
    params: Record<string, string | string[]>,
  ): Record<string, string | string[]> | null {
    if (patternIndex === patternSegments.length) {
      return pathIndex === pathSegments.length ? params : null
    }

    const segment = patternSegments[patternIndex]
    if (!segment) return null
    if (segment.type === 'catchall') {
      const minimumRemaining = patternSegments.length - patternIndex - 1
      const maximum = pathSegments.length - minimumRemaining
      for (let end = maximum; end > pathIndex; end -= 1) {
        const decoded = decodeParts(pathSegments.slice(pathIndex, end))
        if (!decoded) continue
        const found = visit(
          patternIndex + 1,
          end,
          withParam(params, segment.name, decoded),
        )
        if (found) return found
      }
      return null
    }

    const part = pathSegments[pathIndex]
    if (part === undefined) return null
    if (segment.type === 'static') {
      return segment.value === part
        ? visit(patternIndex + 1, pathIndex + 1, params)
        : null
    }
    if (part === '') return null
    const decoded = decodePart(part)
    return decoded === null
      ? null
      : visit(
          patternIndex + 1,
          pathIndex + 1,
          withParam(params, segment.name, decoded),
        )
  }

  return visit(0, 0, {})
}

function withParam(
  current: Record<string, string | string[]>,
  name: string,
  value: string | string[],
): Record<string, string | string[]> {
  const next = { ...current }
  Object.defineProperty(next, name, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
  return next
}

function decodePart(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

function decodeParts(values: readonly string[]): string[] | null {
  const result: string[] = []
  for (const value of values) {
    const decoded = decodePart(value)
    if (decoded === null) return null
    result.push(decoded)
  }
  return result
}
