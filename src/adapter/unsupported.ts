export type UnsupportedOperation =
  'forward' | 'refresh' | 'canGoBack' | (string & {})

export type OnUnsupported =
  | 'noop'
  | 'warn'
  | 'error'
  | ((adapterName: string, operation: UnsupportedOperation) => void)

const warned = new Set<string>()

export function handleUnsupported(
  policy: OnUnsupported | undefined,
  adapterName: string,
  operation: UnsupportedOperation,
): void {
  if (typeof policy === 'function') {
    policy(adapterName, operation)
    return
  }

  const message =
    `[react-native-inter-router] router.${operation}() is not supported by ` +
    `the "${adapterName}" adapter (inspect router.capabilities).`

  switch (policy ?? defaultUnsupportedPolicy()) {
    case 'error':
      throw new Error(message)
    case 'warn': {
      const key = `${adapterName}:${operation}`
      if (!warned.has(key)) {
        warned.add(key)
        console.warn(message)
      }
      return
    }
    case 'noop':
      return
  }
}

function defaultUnsupportedPolicy(): 'warn' | 'noop' {
  const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV
  return nodeEnv === 'production' ? 'noop' : 'warn'
}

/** @internal */
export function resetUnsupportedWarnings(): void {
  warned.clear()
}
