'use client'

import type { ComponentType } from 'react'
import { describeHref } from '../adapter/resolved-href'
import type { RouterAdapter } from '../adapter/types'
import type { Href } from '../core/href'

export interface RedirectProps {
  href: Href
}

export function createRedirect(
  useAdapter: () => RouterAdapter<any>,
): ComponentType<RedirectProps> {
  function Redirect({ href }: RedirectProps) {
    const adapter = useAdapter()
    const Implementation = adapter.Redirect
    return <Implementation to={describeHref(href)} />
  }

  Redirect.displayName = 'Redirect'
  return Redirect
}
