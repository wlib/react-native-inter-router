import { describeHref } from '../resolved-href'
import { handleUnsupported, resetUnsupportedWarnings } from '../unsupported'

afterEach(resetUnsupportedWarnings)

describe('describeHref', () => {
  test('keeps structured and flattened representations together', () => {
    expect(
      describeHref({
        pathname: '/users/[id]',
        params: { id: 7 },
        hash: '#bio',
      }),
    ).toEqual({
      href: {
        pathname: '/users/[id]',
        params: { id: 7 },
        hash: '#bio',
      },
      url: '/users/7#bio',
      external: false,
    })
  })
})

describe('unsupported policies', () => {
  test('warns only once per adapter and operation', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    handleUnsupported('warn', 'small', 'forward')
    handleUnsupported('warn', 'small', 'forward')
    handleUnsupported('warn', 'small', 'refresh')
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  test('supports callbacks, errors, and no-ops', () => {
    const callback = jest.fn()
    handleUnsupported(callback, 'small', 'forward')
    expect(callback).toHaveBeenCalledWith('small', 'forward')
    expect(() => handleUnsupported('error', 'small', 'refresh')).toThrow(
      /not supported/,
    )
    expect(() => handleUnsupported('noop', 'small', 'refresh')).not.toThrow()
  })
})
