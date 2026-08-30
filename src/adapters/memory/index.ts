import { createRouting, type Routing } from '../../react/create-routing'
import type { RoutingConfig } from '../../react/context'
import {
  createMemoryAdapter,
  type MemoryAdapter,
  type MemoryAdapterOptions,
} from './adapter'
import type { MemoryHistory } from './history'

export {
  createMemoryHistory,
  type MemoryHistory,
  type MemoryHistoryOptions,
  type MemoryEntry,
  type MemoryAction,
} from './history'
export {
  createMemoryAdapter,
  type MemoryAdapter,
  type MemoryAdapterOptions,
} from './adapter'

export interface MemoryRouting extends Routing<MemoryHistory> {
  readonly adapter: MemoryAdapter
  readonly history: MemoryHistory
}

/** Create an isolated adapter and bound API in one call. */
export function createMemoryRouting(
  options: MemoryAdapterOptions = {},
  config?: RoutingConfig,
): MemoryRouting {
  const adapter = createMemoryAdapter(options)
  return {
    ...createRouting(adapter, config),
    adapter,
    history: adapter.history,
  }
}
