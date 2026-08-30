import { describeHref } from '../../../adapter/resolved-href'
import { toNextHref, toNextPrefetch } from '../href'

describe('Next href conversion', () => {
  it('uses the resolved URL while retaining encoding and repeated query keys', () => {
    expect(
      toNextHref(
        describeHref({
          pathname: '/users/[id]',
          params: { id: 'a/b' },
          query: { tag: ['one', 'two'] },
          hash: '#details',
        }),
      ),
    ).toBe('/users/a%2Fb?tag=one&tag=two#details')
  })

  it('only maps an explicit prefetch opt-out', () => {
    expect(toNextPrefetch(false)).toBe(false)
    expect(toNextPrefetch(true)).toBeUndefined()
    expect(toNextPrefetch('viewport')).toBeUndefined()
  })
})
