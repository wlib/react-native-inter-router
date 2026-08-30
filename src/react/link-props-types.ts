import type { MouseEvent as ReactMouseEvent } from 'react'
import type { PressEvent } from '../core/press-event'

export interface UseLinkPropsOptions {
  replace?: boolean
  disabled?: boolean
  onPress?: (event: PressEvent) => void
  scroll?: boolean
  state?: unknown
  /** Web only: non-self targets remain browser-owned. */
  target?: string
  /** Web only: downloads remain browser-owned. */
  download?: string | boolean
}

export interface WebLinkOutputProps {
  href?: string
  onClick: (event: ReactMouseEvent) => void
  role: 'link'
  'aria-disabled'?: true
}

export interface NativeLinkOutputProps {
  onPress: (event: unknown) => void
  accessibilityRole: 'link'
  accessibilityState?: { disabled: true }
  disabled?: boolean
}

/** Portable public result; bundlers select one concrete platform branch. */
export type LinkOutputProps = WebLinkOutputProps | NativeLinkOutputProps
