import {
  isExternalHref,
  normalizeHref,
  resolveHref,
  type Href,
} from '../core/href'
import type { ResolvedHref } from './types'

export function describeHref(href: Href): ResolvedHref {
  return {
    href: normalizeHref(href),
    url: resolveHref(href),
    external: isExternalHref(href),
  }
}
