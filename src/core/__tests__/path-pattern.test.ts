import {
  convertPathPattern,
  interpolatePathPattern,
  matchPathPattern,
  parsePathPattern,
  pathPatternParamNames,
} from '../path-pattern'

describe('path patterns', () => {
  test('parses and converts bracket syntax', () => {
    const pattern = '/users/[id]/files/[...path]'
    expect(convertPathPattern(pattern, 'colon')).toBe('/users/:id/files/*')
    expect(convertPathPattern(pattern, 'dollar')).toBe('/users/$id/files/$')
    expect(pathPatternParamNames(pattern)).toEqual(['id', 'path'])
  })

  test('treats malformed and empty bracket forms as static', () => {
    expect(parsePathPattern('/[]/[...]/[[id]]')).toEqual([
      { type: 'static', value: '' },
      { type: 'static', value: '[]' },
      { type: 'static', value: '[...]' },
      { type: 'static', value: '[[id]]' },
    ])
  })

  test('interpolates values without letting values introduce separators', () => {
    expect(
      interpolatePathPattern('/u/[id]/[...rest]', {
        id: 'a/b',
        rest: ['x/y', 'z z'],
      }),
    ).toBe('/u/a%2Fb/x%2Fy/z%20z')
  })

  test('does not interpolate names inherited from Object.prototype', () => {
    expect(
      interpolatePathPattern('/[constructor]/[toString]/[__proto__]', {}),
    ).toBe('/[constructor]/[toString]/[__proto__]')
    expect(
      interpolatePathPattern('/[constructor]', { constructor: 'own' }),
    ).toBe('/own')
  })

  test('matches static, parameter, and middle catch-all segments', () => {
    expect(matchPathPattern('/users/[id]', '/users/a%2Fb')).toEqual({
      id: 'a/b',
    })
    expect(matchPathPattern('/a/[...middle]/z', '/a/b/c/z')).toEqual({
      middle: ['b', 'c'],
    })
    expect(matchPathPattern('/a/[...middle]/z', '/a/z')).toBeNull()
  })

  test('returns null instead of throwing on malformed escapes', () => {
    expect(matchPathPattern('/users/[id]', '/users/%ZZ')).toBeNull()
    expect(matchPathPattern('/docs/[...rest]', '/docs/a/%E0%A4')).toBeNull()
  })

  test('extracts prototype-like parameter names as safe own properties', () => {
    const match = matchPathPattern('/[__proto__]/[constructor]', '/safe/value')
    expect(match?.['__proto__']).toBe('safe')
    expect(match?.['constructor']).toBe('value')
    expect(Object.keys(match ?? {})).toEqual(['__proto__', 'constructor'])
  })
})
