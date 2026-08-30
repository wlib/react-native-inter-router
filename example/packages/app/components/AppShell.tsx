import type { ReactNode } from 'react'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Link, useActiveRoute, useRouter } from 'react-native-inter-router'
import { OverlayHost } from 'react-native-overlaid'

function NavItem({ href, label }: { href: string; label: string }) {
  const active = useActiveRoute(
    href,
    href === '/' ? { exact: true } : undefined,
  )
  return (
    <Link href={href} style={styles.navLink}>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </Link>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  return (
    <OverlayHost>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.brand}>inter-router demo</Text>
          <View style={styles.nav}>
            <NavItem href="/" label="Home" />
            <NavItem href="/users" label="Users" />
          </View>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {children}
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            The same screens, driven by the “{router.adapterName}” adapter
          </Text>
        </View>
      </View>
    </OverlayHost>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 14 : 48,
    paddingBottom: 14,
    backgroundColor: '#0f172a',
  },
  brand: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  nav: {
    flexDirection: 'row',
    gap: 18,
  },
  navLink: {
    paddingVertical: 4,
    // Neutralize the browser's default anchor underline; ignored on native.
    textDecorationLine: 'none',
  },
  navLabel: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#f8fafc',
    textDecorationLine: 'underline',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
  },
})
