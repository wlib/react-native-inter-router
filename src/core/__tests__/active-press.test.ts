import { isActivePath } from '../active'
import { createPressEvent } from '../press-event'

describe('active paths', () => {
  test('prefix matches only on segment boundaries', () => {
    expect(isActivePath('/users/42/', '/users')).toBe(true)
    expect(isActivePath('/users-archive', '/users')).toBe(false)
    expect(isActivePath('/anything', '/')).toBe(false)
    expect(isActivePath('/anything', '')).toBe(false)
    expect(isActivePath('/anything', '?q=1')).toBe(false)
    expect(isActivePath('', '?q=1')).toBe(true)
  })

  test('supports exact and structured destinations while ignoring search/hash', () => {
    expect(isActivePath('/users/42', '/users?tab=a#top')).toBe(true)
    expect(isActivePath('/users/42', '/users', { exact: true })).toBe(false)
    expect(
      isActivePath('/users/42/posts', {
        pathname: '/users/[id]',
        params: { id: 42 },
      }),
    ).toBe(true)
    expect(isActivePath('/x', 'https://example.com/x')).toBe(false)
    expect(isActivePath('/x', '//example.com/x')).toBe(false)
    expect(isActivePath('/x', { pathname: 'custom-protocol:/x' })).toBe(false)
    expect(
      isActivePath('/x', { pathname: '//example.com/x', query: { q: 1 } }),
    ).toBe(false)
  })
})

describe('press events', () => {
  test('tracks native cancellation and calls the underlying event once', () => {
    const preventDefault = jest.fn()
    const press = createPressEvent({ preventDefault })
    expect(press.defaultPrevented).toBe(false)
    press.preventDefault()
    press.preventDefault()
    expect(press.defaultPrevented).toBe(true)
    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  test('reflects cancellation that happened on the original event', () => {
    const original = { defaultPrevented: false }
    const press = createPressEvent(original)
    original.defaultPrevented = true
    expect(press.defaultPrevented).toBe(true)
  })
})
