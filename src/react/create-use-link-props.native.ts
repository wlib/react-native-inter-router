import { useCallback, useMemo, useRef } from 'react'
import type { Href } from '../core/href'
import { createPressEvent } from '../core/press-event'
import { openExternalUrl } from '../core/open-external'
import { describeHref } from '../adapter/resolved-href'
import type { RouterAdapter } from '../adapter/types'
import type {
  NativeLinkOutputProps,
  UseLinkPropsOptions,
} from './link-props-types'

export type {
  LinkOutputProps,
  NativeLinkOutputProps,
  UseLinkPropsOptions,
  WebLinkOutputProps,
} from './link-props-types'

export function createUseLinkProps(
  useAdapter: () => RouterAdapter<any>,
): (href: Href, options?: UseLinkPropsOptions) => NativeLinkOutputProps {
  return function useLinkProps(href, options = {}) {
    const { replace, disabled, onPress, scroll, state } = options
    const adapter = useAdapter()
    const core = adapter.useRouterCore()
    const to = describeHref(href)
    const toRef = useRef(to)
    toRef.current = to
    const { external, url } = to

    const handlePress = useCallback(
      (event: unknown) => {
        if (disabled) return

        const press = createPressEvent(
          event as
            | { preventDefault?: () => void; defaultPrevented?: boolean }
            | undefined,
        )
        onPress?.(press)
        if (press.defaultPrevented) return

        if (external) {
          openExternalUrl(url)
        } else {
          core.navigate(toRef.current, { replace, scroll, state })
        }
      },
      [core, url, external, replace, disabled, onPress, scroll, state],
    )

    return useMemo(
      () => ({
        onPress: handlePress,
        accessibilityRole: 'link' as const,
        accessibilityState: disabled
          ? ({ disabled: true } as const)
          : undefined,
        disabled,
      }),
      [disabled, handlePress],
    )
  }
}
