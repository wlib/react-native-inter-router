import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, useCapabilities } from 'react-native-inter-router'
import { Dialog, Tooltip } from 'react-native-overlaid'
import { AppShell } from '../components/AppShell'

const CAPABILITY_NAMES = [
  'forward',
  'refresh',
  'prefetch',
  'scroll',
  'hash',
  'state',
  'canGoBack',
] as const

export default function HomeScreen() {
  const capabilities = useCapabilities()
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <AppShell>
      <Text style={styles.title}>One routing vocabulary</Text>
      <Text style={styles.lead}>
        Every screen in this demo is written once, in a shared package, against
        react-native-inter-router. Each app in the workspace renders the same
        screens through a different router adapter.
      </Text>

      <Tooltip text="Frozen declarations from the adapter, not runtime probes.">
        <Text style={styles.sectionTitle}>Adapter capabilities</Text>
      </Tooltip>
      <View style={styles.capabilities}>
        {CAPABILITY_NAMES.map((name) => (
          <View
            key={name}
            style={[
              styles.capability,
              capabilities[name] ? styles.capabilityOn : styles.capabilityOff,
            ]}
          >
            <Text
              style={[
                styles.capabilityLabel,
                capabilities[name]
                  ? styles.capabilityLabelOn
                  : styles.capabilityLabelOff,
              ]}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>

      <Link
        href={{ pathname: '/users', query: { sort: 'name' } }}
        style={styles.primaryLink}
      >
        <Text style={styles.primaryLinkLabel}>Browse users →</Text>
      </Link>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => setAboutOpen(true)}
      >
        <Text style={styles.secondaryButtonLabel}>About this demo</Text>
      </Pressable>

      <Dialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        title="About this demo"
        description={
          'The screens live in example/packages/app and import only the ' +
          'provider-driven root entry of react-native-inter-router, plus ' +
          'overlays from react-native-overlaid. Each app supplies its own ' +
          'adapter through <RoutingProvider>.'
        }
      >
        <Pressable
          style={styles.secondaryButton}
          onPress={() => setAboutOpen(false)}
        >
          <Text style={styles.secondaryButtonLabel}>Close</Text>
        </Pressable>
      </Dialog>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  capabilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capability: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  capabilityOn: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  capabilityOff: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  capabilityLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  capabilityLabelOn: {
    color: '#166534',
  },
  capabilityLabelOff: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  primaryLink: {
    alignSelf: 'flex-start',
    textDecorationLine: 'none',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryLinkLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
})
