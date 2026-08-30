import { forwardRef, type Ref } from 'react'
import {
  Pressable,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native'
import { createPressEvent } from '../core/press-event'
import { describeHref } from '../adapter/resolved-href'
import type { ResolvedHref, RouterAdapter } from '../adapter/types'
import type {
  NativeLinkOutputProps,
  UseLinkPropsOptions,
} from '../react/create-use-link-props'
import type { Href } from '../core/href'
import type { LinkComponent, LinkProps } from './link-types'

interface LinkDependencies {
  useAdapter: () => RouterAdapter<any>
  useLinkProps: (
    href: Href,
    options?: UseLinkPropsOptions,
  ) => NativeLinkOutputProps
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
      <FallbackPressable
        props={props}
        forwardedRef={ref}
        useLinkProps={useLinkProps}
      />
    )
  })
  Link.displayName = 'Link'
  return Link
}

function FallbackPressable({
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
  })

  return (
    <Pressable
      {...linkProps}
      ref={forwardedRef as Ref<View>}
      // NativeWind augments Pressable with this prop when installed.
      {...({ className: props.className } as object)}
      style={props.style as StyleProp<ViewStyle>}
      accessibilityLabel={props.accessibilityLabel}
      testID={props.testID}
    >
      {props.children}
    </Pressable>
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
