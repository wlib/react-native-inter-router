import { createMemoryHistory } from '../history'

describe('createMemoryHistory', () => {
  it('always starts on a valid entry', () => {
    expect(createMemoryHistory().current.url).toBe('/')
    expect(createMemoryHistory({ initialEntries: [] }).current.url).toBe('/')

    const entries = ['/a', '/b', '/c']
    expect(createMemoryHistory({ initialEntries: entries }).index).toBe(2)
    expect(
      createMemoryHistory({ initialEntries: entries, initialIndex: -20 }).index,
    ).toBe(0)
    expect(
      createMemoryHistory({ initialEntries: entries, initialIndex: 1.9 }).index,
    ).toBe(1)
    expect(
      createMemoryHistory({ initialEntries: entries, initialIndex: 20 }).index,
    ).toBe(2)
    expect(
      createMemoryHistory({ initialEntries: entries, initialIndex: NaN }).index,
    ).toBe(2)
  })

  it('validates runtime inputs', () => {
    expect(() =>
      createMemoryHistory({ initialEntries: ['/a', 1] as unknown as string[] }),
    ).toThrow(/initialEntries\[1\]/)
    expect(() =>
      createMemoryHistory({ initialEntries: '/a' as unknown as string[] }),
    ).toThrow(/array of strings/)
    expect(() =>
      createMemoryHistory({ initialIndex: '1' as unknown as number }),
    ).toThrow(/initialIndex/)
  })

  it('pushes, replaces, carries state, and truncates forward entries', () => {
    const history = createMemoryHistory({ initialEntries: ['/a', '/b'] })
    history.back()
    history.push('/c', { source: 'push' })
    history.replace('/d', { source: 'replace' })

    expect(history.entries.map(({ url }) => url)).toEqual(['/a', '/d'])
    expect(history.current.state).toEqual({ source: 'replace' })
    expect(history.canGoForward()).toBe(false)
    expect(history.log).toEqual([
      { type: 'back' },
      { type: 'push', url: '/c', state: { source: 'push' } },
      { type: 'replace', url: '/d', state: { source: 'replace' } },
    ])
  })

  it('does not fall off either end and logs every requested action', () => {
    const history = createMemoryHistory()
    history.back()
    history.forward()
    history.push('/a')
    history.forward()

    expect(history.current.url).toBe('/a')
    expect(history.log.map(({ type }) => type)).toEqual([
      'back',
      'forward',
      'push',
      'forward',
    ])
  })

  it('notifies from a listener snapshot and supports idempotent unsubscribe', () => {
    const history = createMemoryHistory()
    const calls: string[] = []
    let unsubscribeSecond = () => {}
    const unsubscribeFirst = history.subscribe(() => {
      calls.push('first')
      unsubscribeSecond()
    })
    unsubscribeSecond = history.subscribe(() => calls.push('second'))

    history.push('/a')
    unsubscribeFirst()
    unsubscribeFirst()
    history.push('/b')

    expect(calls).toEqual(['first', 'second'])
  })

  it('refreshes with a new snapshot and prefetch does not notify', () => {
    const history = createMemoryHistory()
    const listener = jest.fn()
    history.subscribe(listener)
    const before = history.current

    history.prefetch('/future')
    expect(listener).not.toHaveBeenCalled()
    history.refresh()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(history.current).not.toBe(before)
    expect(history.current).toEqual(before)
  })

  it('exposes immutable entry and action snapshots', () => {
    const history = createMemoryHistory()
    history.push('/a')

    expect(Object.isFrozen(history.entries)).toBe(true)
    expect(Object.isFrozen(history.current)).toBe(true)
    expect(Object.isFrozen(history.log)).toBe(true)
    expect(Object.isFrozen(history.log[0])).toBe(true)
  })
})
