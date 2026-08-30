import { describeHref } from '../../../adapter/resolved-href'
import { splitExpoParams, toExpoHref } from '../href'

describe('toExpoHref', () => {
  it('preserves the pattern and merges typed params and query values', () => {
    expect(
      toExpoHref(
        describeHref({
          pathname: '/users/[id]',
          params: { id: 42 },
          query: { tab: 'posts', flags: ['a', true] },
        }),
      ),
    ).toEqual({
      pathname: '/users/[id]',
      params: { id: '42', tab: 'posts', flags: ['a', 'true'] },
    })
  })

  it('lets path params win same-name collisions', () => {
    expect(
      toExpoHref(
        describeHref({
          pathname: '/users/[id]',
          params: { id: 'path' },
          query: { id: 'query' },
        }),
      ).params,
    ).toEqual({ id: 'path' })
  })

  it('keeps parsed string queries structured and omits an empty bag', () => {
    expect(toExpoHref(describeHref('/a?x=1&x=2'))).toEqual({
      pathname: '/a',
      params: { x: ['1', '2'] },
    })
    expect(toExpoHref(describeHref('/plain'))).toEqual({ pathname: '/plain' })
  })

  it('stores prototype-named values as ordinary own params', () => {
    const params = Object.create(null) as Record<string, string>
    params.__proto__ = 'path'
    Object.defineProperty(params, 'constructor', {
      value: 'ctor',
      enumerable: true,
    })
    const result = toExpoHref({
      href: { pathname: '/[__proto__]/[constructor]', params },
      url: '/path/ctor',
      external: false,
    })
    expect(Object.getPrototypeOf(result.params)).toBe(Object.prototype)
    expect(Object.hasOwn(result.params ?? {}, '__proto__')).toBe(true)
    expect(result.params?.__proto__).toBe('path')
    expect(result.params?.['constructor']).toBe('ctor')
  })
})

describe('splitExpoParams', () => {
  it('recognizes scalar and catch-all segments and drops undefined values', () => {
    expect(
      splitExpoParams(
        { id: '42', slug: ['a', 'b'], tab: 'posts', missing: undefined },
        ['(app)', 'users', '[id]', 'docs', '[...slug]'],
      ),
    ).toEqual({
      params: { id: '42', slug: ['a', 'b'] },
      query: { tab: 'posts' },
    })
  })

  it('does not mistake bracket-like static segments for params', () => {
    expect(splitExpoParams({ id: 'x' }, ['prefix[id]'])).toEqual({
      params: {},
      query: { id: 'x' },
    })
  })

  it('safely splits prototype-named local params', () => {
    const local = Object.create(null) as Record<string, string>
    local.__proto__ = 'path'
    Object.defineProperty(local, 'constructor', {
      value: 'query',
      enumerable: true,
    })
    const result = splitExpoParams(local, ['[__proto__]'])
    expect(result.params.__proto__).toBe('path')
    expect(Object.hasOwn(result.params, '__proto__')).toBe(true)
    expect(result.query['constructor']).toBe('query')
    expect(Object.hasOwn(result.query, 'constructor')).toBe(true)
  })
})
