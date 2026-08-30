/**
 * Development-only Expo Router surface. Consumers compile against Expo's own
 * declarations; keeping this shim narrow avoids installing the Expo SDK here.
 */
declare module 'expo-router' {
  import type { ComponentType, ReactNode, Ref } from 'react'

  export type Href =
    string | { pathname: string; params?: Record<string, string | string[]> }

  export interface Router {
    push(href: Href): void
    replace(href: Href): void
    navigate(href: Href): void
    back(): void
    canGoBack(): boolean
    setParams(params: Record<string, string | string[]>): void
    prefetch(href: Href): void
  }

  export function useRouter(): Router
  export function usePathname(): string
  export function useSegments(): string[]
  export function useLocalSearchParams(): Record<
    string,
    string | string[] | undefined
  >

  export interface LinkProps {
    href: Href
    replace?: boolean
    prefetch?: boolean
    asChild?: boolean
    className?: string
    accessibilityLabel?: string
    testID?: string
    target?: string
    rel?: string
    download?: string | boolean
    onPress?: (event: unknown) => void
    ref?: Ref<unknown>
    children?: ReactNode
  }

  export const Link: ComponentType<LinkProps>
  export const Redirect: ComponentType<{ href: Href }>
}
