import type {
  CSSProperties,
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
} from 'react'
import type { Href } from '../core/href'
import type { PressEvent } from '../core/press-event'
import type { LinkPrefetch } from '../adapter/types'

/** Web CSS or a React Native style object/array. */
export type LinkStyle =
  CSSProperties | object | Array<object | null | undefined | false> | null

export interface LinkProps {
  href: Href
  replace?: boolean
  children?: ReactNode
  className?: string
  style?: LinkStyle
  onPress?: (event: PressEvent) => void
  disabled?: boolean
  accessibilityLabel?: string
  testID?: string
  prefetch?: LinkPrefetch
  scroll?: boolean
  state?: unknown
  target?: '_blank' | '_self' | '_parent' | '_top' | (string & {})
  rel?: string
  download?: string | boolean
}

/** The universal ref target is the concrete platform/framework link element. */
export type LinkComponent = ForwardRefExoticComponent<
  LinkProps & RefAttributes<unknown>
>
