'use client'

import { forwardRef, type CSSProperties, type Ref } from 'react'
import { createPressEvent } from '../core/press-event'
import { describeHref } from '../adapter/resolved-href'
import type { ResolvedHref, RouterAdapter } from '../adapter/types'
import type {
  UseLinkPropsOptions,
  WebLinkOutputProps,
} from '../react/create-use-link-props'
import type { Href } from '../core/href'
import type { LinkComponent, LinkProps } from './link-types'

interface LinkDependencies {
  useAdapter: () => RouterAdapter<any>
  useLinkProps: (
    href: Href,
    options?: UseLinkPropsOptions,
  ) => WebLinkOutputProps
}

export function createLink({
  useAdapter,
  useLinkProps,
}: LinkDependencies): LinkComponent {
  const Link = forwardRef<unknown, LinkProps>(function Link(props, ref) {
    const adapter = useAdapter()
    const to = describeHref(props.href)

    if (!props.disabled && !to.external && adapter.Link) {
      return (
        <AdapterLink
          props={props}
          forwardedRef={ref}
          to={to}
          Impl={adapter.Link}
        />
      )
    }

    return (
      <FallbackAnchor
        props={props}
        forwardedRef={ref}
        useLinkProps={useLinkProps}
      />
    )
  })
  Link.displayName = 'Link'
  return Link
}

function FallbackAnchor({
  props,
  forwardedRef,
  useLinkProps,
}: {
  props: LinkProps
  forwardedRef: Ref<unknown>
  useLinkProps: LinkDependencies['useLinkProps']
}) {
  const linkProps = useLinkProps(props.href, {
    replace: props.replace,
    disabled: props.disabled,
    onPress: props.onPress,
    scroll: props.scroll,
    state: props.state,
    target: props.target,
    download: props.download,
  })

  return (
    <a
      {...linkProps}
      ref={forwardedRef as Ref<HTMLAnchorElement>}
      className={props.className}
      style={props.style as CSSProperties | undefined}
      aria-label={props.accessibilityLabel}
      data-testid={props.testID}
      target={props.target}
      rel={props.rel}
      download={props.download}
    >
      {props.children}
    </a>
  )
}

function AdapterLink({
  props,
  forwardedRef,
  to,
  Impl,
}: {
  props: LinkProps
  forwardedRef: Ref<unknown>
  to: ResolvedHref
  Impl: NonNullable<RouterAdapter['Link']>
}) {
  return (
    <Impl
      to={to}
      replace={props.replace}
      prefetch={props.prefetch}
      scroll={props.scroll}
      state={props.state}
      className={props.className}
      style={props.style}
      accessibilityLabel={props.accessibilityLabel}
      testID={props.testID}
      target={props.target}
      rel={props.rel}
      download={props.download}
      ref={forwardedRef}
      onNativePress={
        props.onPress
          ? (event: unknown) => {
              props.onPress?.(
                createPressEvent(
                  event as {
                    preventDefault?: () => void
                    defaultPrevented?: boolean
                  },
                ),
              )
            }
          : undefined
      }
    >
      {props.children}
    </Impl>
  )
}
