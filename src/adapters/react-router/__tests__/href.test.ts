import { describeHref } from '../../../adapter/resolved-href'
import { toReactRouterPrefetch, toReactRouterTo } from '../href'

describe('React Router href conversion', () => {
  it('splits a resolved destination into native To fields', () => {
    expect(
      toReactRouterTo(
        describeHref({
          pathname: '/users/[id]',
          params: { id: 'a/b' },
          query: { tag: ['one', 'two'] },
          hash: '#bio',
        }),
      ),
    ).toEqual({
      pathname: '/users/a%2Fb',
      search: '?tag=one&tag=two',
      hash: '#bio',
    })
  })

  it('preserves search-only and hash-only relative destinations', () => {
    expect(toReactRouterTo(describeHref('?tab=a'))).toEqual({
      search: '?tab=a',
    })
    expect(toReactRouterTo(describeHref('#top'))).toEqual({ hash: '#top' })
  })

  it('maps unified prefetch values to React Router values', () => {
    expect(toReactRouterPrefetch(undefined)).toBeUndefined()
    expect(toReactRouterPrefetch(false)).toBe('none')
    expect(toReactRouterPrefetch(true)).toBe('intent')
    expect(toReactRouterPrefetch('hover')).toBe('intent')
    expect(toReactRouterPrefetch('render')).toBe('render')
    expect(toReactRouterPrefetch('viewport')).toBe('viewport')
  })
})
