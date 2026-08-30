import { describeHref } from '../../../adapter/resolved-href'
import {
  tanstackSearchToParams,
  toTanstackOptions,
  toTanstackPreload,
} from '../href'

describe('toTanstackOptions', () => {
  it('converts bracket paths and preserves structured search', () => {
    expect(
      toTanstackOptions(
        describeHref({
          pathname: '/users/[id]',
          params: { id: 42 },
          query: { tab: 'posts', tags: ['a', 'b'] },
          hash: '#top',
        }),
      ),
    ).toEqual({
      to: '/users/$id',
      params: { id: '42' },
      search: { tab: 'posts', tags: ['a', 'b'] },
      hash: 'top',
    })
  })

  it('maps catch-alls to TanStack splats without flattening separators', () => {
    expect(
      toTanstackOptions(
        describeHref({
          pathname: '/docs/[...slug]',
          params: { slug: ['a', 'b c'] },
        }),
      ),
    ).toEqual({ to: '/docs/$', params: { _splat: 'a/b c' } })
  })

  it('uses a concrete pathname when catch-all elements contain separators', () => {
    expect(
      toTanstackOptions(
        describeHref({
          pathname: '/docs/[...slug]',
          params: { slug: ['a/b', 'c'] },
          query: { tab: 'api' },
          hash: '###top',
        }),
      ),
    ).toEqual({
      to: '/docs/a%2Fb/c',
      search: { tab: 'api' },
      hash: 'top',
    })
  })

  it('omits missing and empty path params', () => {
    expect(
      toTanstackOptions(
        describeHref({
          pathname: '/u/[id]/[...rest]',
          params: { id: [], rest: [] },
        }),
      ),
    ).toEqual({ to: '/u/$id/$' })
  })

  it('keeps parsed concrete hrefs concrete', () => {
    expect(toTanstackOptions(describeHref('/users/42?tab=a&tab=b'))).toEqual({
      to: '/users/42',
      search: { tab: ['a', 'b'] },
    })
  })

  it('ignores inherited path params and safely stores prototype names', () => {
    expect(
      toTanstackOptions(
        describeHref({ pathname: '/u/[constructor]/[toString]' }),
      ),
    ).toEqual({ to: '/u/$constructor/$toString' })

    const params = Object.create(null) as Record<string, string>
    params.__proto__ = 'proto'
    Object.defineProperty(params, 'constructor', {
      value: 'ctor',
      enumerable: true,
    })
    const result = toTanstackOptions({
      href: { pathname: '/u/[__proto__]/[constructor]', params },
      url: '/u/proto/ctor',
      external: false,
    })
    expect(result.params?.__proto__).toBe('proto')
    expect(Object.hasOwn(result.params ?? {}, '__proto__')).toBe(true)
    expect(result.params?.['constructor']).toBe('ctor')
  })
})

describe('tanstackSearchToParams', () => {
  it('serializes primitives, arrays, and nested values', () => {
    const params = tanstackSearchToParams({
      page: 2,
      enabled: false,
      tags: ['a', 'b'],
      filter: { min: 1 },
      nil: null,
    })
    expect(params.toString()).toBe(
      'page=2&enabled=false&tags=a&tags=b&filter=%7B%22min%22%3A1%7D',
    )
  })

  it('maps preload vocabulary without weakening explicit choices', () => {
    expect(toTanstackPreload('hover')).toBe('intent')
    expect(toTanstackPreload('viewport')).toBe('viewport')
    expect(toTanstackPreload(false)).toBe(false)
    expect(toTanstackPreload(true)).toBe('intent')
  })
})
