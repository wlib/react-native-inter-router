'use client'

import { useCallback, useMemo, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Href } from '../core/href'
import { createPressEvent } from '../core/press-event'
import { describeHref } from '../adapter/resolved-href'
import type { RouterAdapter } from '../adapter/types'
import type {
  UseLinkPropsOptions,
  WebLinkOutputProps,
} from './link-props-types'

export type {
  LinkOutputProps,
  NativeLinkOutputProps,
  UseLinkPropsOptions,
  WebLinkOutputProps,
} from './link-props-types'

export function createUseLinkProps(
  useAdapter: () => RouterAdapter<any>,
): (href: Href, options?: UseLinkPropsOptions) => WebLinkOutputProps {
  return function useLinkProps(href, options = {}) {
    const { replace, disabled, onPress, scroll, state, target, download } =
      options
    const adapter = useAdapter()
    const core = adapter.useRouterCore()
    const to = describeHref(href)
    const toRef = useRef(to)
    toRef.current = to
    const { external, url } = to

    const onClick = useCallback(
      (event: ReactMouseEvent) => {
        if (disabled) {
          event.preventDefault()
          return
        }

        const press = createPressEvent(event)
        onPress?.(press)
        if (press.defaultPrevented) return

        const modified =
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.button !== 0
        const normalizedTarget = target?.toLowerCase()
        const browserTarget =
          normalizedTarget !== undefined &&
          normalizedTarget !== '' &&
          normalizedTarget !== '_self'
        const isDownload = download !== undefined && download !== false

        if (external || modified || browserTarget || isDownload) return

        event.preventDefault()
        core.navigate(toRef.current, { replace, scroll, state })
      },
      [
        core,
        external,
        replace,
        disabled,
        onPress,
        scroll,
        state,
        target,
        download,
      ],
    )

    return useMemo(
      () => ({
        href: disabled ? undefined : url,
        onClick,
        role: 'link' as const,
        'aria-disabled': disabled ? (true as const) : undefined,
      }),
      [disabled, onClick, url],
    )
  }
}
