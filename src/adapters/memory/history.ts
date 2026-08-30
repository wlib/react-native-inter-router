export interface MemoryEntry {
  readonly url: string
  readonly state?: unknown
}

export type MemoryAction =
  | {
      readonly type: 'push' | 'replace'
      readonly url: string
      readonly state?: unknown
    }
  | { readonly type: 'back' | 'forward' | 'refresh' }
  | { readonly type: 'prefetch'; readonly url: string }

export interface MemoryHistory {
  readonly entries: readonly MemoryEntry[]
  readonly index: number
  readonly current: MemoryEntry
  readonly log: readonly MemoryAction[]
  push(url: string, state?: unknown): void
  replace(url: string, state?: unknown): void
  back(): void
  forward(): void
  canGoBack(): boolean
  canGoForward(): boolean
  refresh(): void
  prefetch(url: string): void
  subscribe(listener: () => void): () => void
}

export interface MemoryHistoryOptions {
  initialEntries?: readonly string[]
  initialIndex?: number
}

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value)

function normalizeEntries(input: readonly string[] | undefined) {
  if (input === undefined) {
    return freeze([freeze({ url: '/' })]) as readonly MemoryEntry[]
  }
  if (!Array.isArray(input)) {
    throw new TypeError(
      '[react-native-inter-router] initialEntries must be an array of strings.',
    )
  }
  if (input.length === 0) {
    return freeze([freeze({ url: '/' })]) as readonly MemoryEntry[]
  }

  return freeze(
    input.map((url, index) => {
      if (typeof url !== 'string') {
        throw new TypeError(
          `[react-native-inter-router] initialEntries[${index}] must be a string.`,
        )
      }
      return freeze({ url })
    }),
  ) as readonly MemoryEntry[]
}

function normalizeIndex(input: number | undefined, length: number): number {
  if (input === undefined || Number.isNaN(input)) return length - 1
  if (typeof input !== 'number') {
    throw new TypeError(
      '[react-native-inter-router] initialIndex must be a number.',
    )
  }

  const integer = Math.trunc(input)
  return Math.max(0, Math.min(integer, length - 1))
}

function entry(url: string, state?: unknown): MemoryEntry {
  if (typeof url !== 'string') {
    throw new TypeError(
      '[react-native-inter-router] history URLs must be strings.',
    )
  }
  return freeze(state === undefined ? { url } : { url, state })
}

/** A deterministic browser-style history for tests, stories, and examples. */
export function createMemoryHistory(
  options: MemoryHistoryOptions = {},
): MemoryHistory {
  let entries = normalizeEntries(options.initialEntries)
  let index = normalizeIndex(options.initialIndex, entries.length)
  let log = freeze([]) as readonly MemoryAction[]
  const listeners = new Set<() => void>()

  const record = (action: MemoryAction) => {
    log = freeze([...log, freeze(action)]) as readonly MemoryAction[]
  }
  const notify = () => {
    for (const listener of [...listeners]) listener()
  }

  return {
    get entries() {
      return entries
    },
    get index() {
      return index
    },
    get current() {
      return entries[index]!
    },
    get log() {
      return log
    },
    push(url, state) {
      const next = entry(url, state)
      entries = freeze([...entries.slice(0, index + 1), next])
      index = entries.length - 1
      record(
        freeze(
          state === undefined
            ? { type: 'push', url }
            : { type: 'push', url, state },
        ),
      )
      notify()
    },
    replace(url, state) {
      const next = entry(url, state)
      entries = freeze(
        entries.map((existing, entryIndex) =>
          entryIndex === index ? next : existing,
        ),
      )
      record(
        freeze(
          state === undefined
            ? { type: 'replace', url }
            : { type: 'replace', url, state },
        ),
      )
      notify()
    },
    back() {
      record(freeze({ type: 'back' }))
      if (index === 0) return
      index -= 1
      notify()
    },
    forward() {
      record(freeze({ type: 'forward' }))
      if (index === entries.length - 1) return
      index += 1
      notify()
    },
    canGoBack: () => index > 0,
    canGoForward: () => index < entries.length - 1,
    refresh() {
      const next = freeze({ ...entries[index]! })
      entries = freeze(
        entries.map((existing, entryIndex) =>
          entryIndex === index ? next : existing,
        ),
      )
      record(freeze({ type: 'refresh' }))
      notify()
    },
    prefetch(url) {
      if (typeof url !== 'string') {
        throw new TypeError(
          '[react-native-inter-router] history URLs must be strings.',
        )
      }
      record(freeze({ type: 'prefetch', url }))
    },
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError(
          '[react-native-inter-router] history listeners must be functions.',
        )
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
