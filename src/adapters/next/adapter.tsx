'use client'

import NextLink from 'next/link.js'
import {
  useParams as useNextParams,
  usePathname as useNextPathname,
  useRouter as useNextRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation.js'
import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type MouseEventHandler,
  type Ref,
} from 'react'
import { defineAdapter } from '../../adapter/define-adapter'
import type {
  AdapterLinkProps,
  AdapterRouterCore,
  NavigateOptions,
  ResolvedHref,
} from '../../adapter/types'
import { toNextHref, toNextPrefetch } from './href'

export type NextRouterInstance = ReturnType<typeof useNextRouter>

const NextAdapterLink = forwardRef<unknown, AdapterLinkProps>(
  function NextAdapterLink(
    {
      to,
      replace,
      prefetch,
      scroll,
      children,
      className,
      style,
      onNativePress,
      accessibilityLabel,
      testID,
      target,
      rel,
      download,
    },
    ref,
  ) {
    return (
      <NextLink
        ref={ref as Ref<HTMLAnchorElement>}
        href={toNextHref(to)}
        replace={replace}
        prefetch={toNextPrefetch(prefetch)}
        scroll={scroll}
        className={className}
        style={style as CSSProperties | undefined}
        aria-label={accessibilityLabel}
        data-testid={testID}
        target={target}
        rel={rel}
        download={download}
        onClick={
          onNativePress as MouseEventHandler<HTMLAnchorElement> | undefined
        }
      >
        {children}
      </NextLink>
    )
  },
)

/** Next.js App Router adapter. */
export const nextAdapter = defineAdapter<NextRouterInstance>({
  name: 'next',
  capabilities: {
    forward: true,
    refresh: true,
    prefetch: true,
    scroll: true,
    hash: false,
    state: false,
    canGoBack: false,
  },

  useLocation() {
    const pathname = useNextPathname()
    const nextSearchParams = useNextSearchParams()
    const nextParams = useNextParams()

    return useMemo(() => {
      const params: Record<string, string | string[]> = {}
      for (const [key, value] of Object.entries(nextParams ?? {})) {
        if (typeof value === 'string' || Array.isArray(value)) {
          defineLocationParam(params, key, value)
        }
      }

      return {
        pathname: pathname ?? '',
        params,
        searchParams: new URLSearchParams(nextSearchParams?.toString()),
        hash: '',
      }
    }, [pathname, nextParams, nextSearchParams])
  },

  useRouterCore() {
    const router = useNextRouter()
    return useMemo<AdapterRouterCore>(
      () => ({
        navigate(to: ResolvedHref, options: NavigateOptions) {
          const href = toNextHref(to)
          if (options.replace) {
            router.replace(href, { scroll: options.scroll })
          } else {
            router.push(href, { scroll: options.scroll })
          }
        },
        back: () => router.back(),
        forward: () => router.forward(),
        refresh: () => router.refresh(),
        prefetch: (to) => router.prefetch(toNextHref(to)),
      }),
      [router],
    )
  },

  usePlatform: useNextRouter,
  Link: NextAdapterLink,
})

function defineLocationParam(
  target: Record<string, string | string[]>,
  key: string,
  value: string | string[],
): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}
