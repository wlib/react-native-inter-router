import type { ReactNode } from 'react'
import 'react-native-overlaid/styles.css'
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'inter-router × Next.js',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
