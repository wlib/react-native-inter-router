import {
  isExternalHref,
  normalizeHash,
  normalizeHref,
  parseHref,
  resolveHref,
} from '../href'

describe('hrefs', () => {
  test('resolves encoded params, repeated queries, and normalized hashes', () => {
    expect(
      resolveHref({
        pathname: '/docs/[...slug]/[edition]',
        params: { slug: ['a', 'b c'], edition: 'x/y' },
        query: { tag: ['one', 'two'], empty: '', skip: undefined },
        hash: '##contents',
      }),
    ).toBe('/docs/a/b%20c/x%2Fy?tag=one&tag=two&empty=#contents')
  })

  test('leaves missing params inspectable', () => {
    expect(resolveHref({ pathname: '/users/[id]' })).toBe('/users/[id]')
    expect(resolveHref({ pathname: '/users/[id]', params: { id: [] } })).toBe(
      '/users/[id]',
    )
  })

  test('parses using first delimiters and retains repeated empty values', () => {
    expect(parseHref('/a?x=&x=2&encoded=%3F#one#two')).toEqual({
      pathname: '/a',
      query: { x: ['', '2'], encoded: '?' },
      hash: 'one#two',
    })
  })

  test('preserves object-prototype-like query keys as own data', () => {
    const parsed = parseHref('/a?__proto__=safe&constructor=value')
    expect(parsed.query?.__proto__).toBe('safe')
    expect(parsed.query?.['constructor']).toBe('value')
    expect(Object.keys(parsed.query ?? {})).toEqual([
      '__proto__',
      'constructor',
    ])
    expect(
      Object.prototype.hasOwnProperty.call(parsed.query, '__proto__'),
    ).toBe(true)
  })

  test('normalizes strings without cloning object hrefs', () => {
    expect(normalizeHref('/a?q=1')).toEqual({
      pathname: '/a',
      query: { q: '1' },
    })
    const object = { pathname: '/a' }
    expect(normalizeHref(object)).toBe(object)
  })

  test.each([
    ['https://example.com', true],
    ['MAILTO:user@example.com', true],
    ['custom+thing:value', true],
    ['//example.com/path', true],
    ['/local', false],
    ['local:ish/path', true],
    ['?query=1', false],
    ['#hash', false],
  ])('classifies %s as external=%s', (href, expected) => {
    expect(isExternalHref(href)).toBe(expected)
  })

  test('normalizes leading hash markers', () => {
    expect(normalizeHash('###hello')).toBe('hello')
    expect(normalizeHash(undefined)).toBe('')
  })
})
