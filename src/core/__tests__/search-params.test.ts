import {
  applySearchParamsPatch,
  searchParamsEqual,
  searchParamsToObject,
  toSearchParams,
} from '../search-params'

describe('search params', () => {
  test('serializes arrays and primitives', () => {
    expect(
      toSearchParams({
        a: 1,
        b: ['x', 'y'],
        c: false,
        gone: undefined,
      }).toString(),
    ).toBe('a=1&b=x&b=y&c=false')
  })

  test('copies URLSearchParams inputs', () => {
    const input = new URLSearchParams('a=1')
    const output = toSearchParams(input)
    expect(output).not.toBe(input)
    expect(output.toString()).toBe('a=1')
  })

  test('preserves repeated empty values in object views', () => {
    expect(searchParamsToObject(new URLSearchParams('x=&x=2'))).toEqual({
      x: ['', '2'],
    })
  })

  test('preserves prototype-like keys as own object data', () => {
    const result = searchParamsToObject(
      new URLSearchParams('__proto__=safe&constructor=value&toString=text'),
    )
    expect(result['__proto__']).toBe('safe')
    expect(result['constructor']).toBe('value')
    expect(result['toString']).toBe('text')
    expect(Object.keys(result)).toEqual([
      '__proto__',
      'constructor',
      'toString',
    ])
  })

  test('patches a copy, deletes, and replaces arrays', () => {
    const input = new URLSearchParams('a=1&tag=old')
    const output = applySearchParamsPatch(input, {
      a: undefined,
      tag: ['new', 'next'],
    })
    expect(input.toString()).toBe('a=1&tag=old')
    expect(output.toString()).toBe('tag=new&tag=next')
  })

  test('isolates functional results from their mutable working copy', () => {
    let working: URLSearchParams | undefined
    const output = applySearchParamsPatch(
      new URLSearchParams('a=1'),
      (current) => {
        working = current
        current.set('a', '2')
        return current
      },
    )
    working?.set('a', '3')
    expect(output.toString()).toBe('a=2')
  })

  test('compares ordered serialized values', () => {
    expect(
      searchParamsEqual(
        new URLSearchParams('a=1&a=2'),
        new URLSearchParams('a=1&a=2'),
      ),
    ).toBe(true)
    expect(
      searchParamsEqual(
        new URLSearchParams('a=1&a=2'),
        new URLSearchParams('a=2&a=1'),
      ),
    ).toBe(false)
  })
})
