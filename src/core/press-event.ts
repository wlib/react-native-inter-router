export interface PressEvent {
  preventDefault(): void
  readonly defaultPrevented: boolean
}

export interface PreventableEvent {
  preventDefault?: () => void
  readonly defaultPrevented?: boolean
}

/** Normalize DOM and native cancellation while preserving the underlying event. */
export function createPressEvent(original?: PreventableEvent): PressEvent {
  let prevented = original?.defaultPrevented === true
  return {
    preventDefault() {
      if (!prevented) original?.preventDefault?.()
      prevented = true
    },
    get defaultPrevented() {
      return prevented || original?.defaultPrevented === true
    },
  }
}
