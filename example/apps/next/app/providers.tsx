'use client'

import { Suspense, type ReactNode } from 'react'
import { RoutingProvider } from 'react-native-inter-router'
import { nextAdapter } from 'react-native-inter-router/next'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <RoutingProvider adapter={nextAdapter}>
        {/* useSearchParams() inherits Next's Suspense requirement. */}
        <Suspense>{children}</Suspense>
      </RoutingProvider>
    </div>
  )
}
