import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  Redirect,
  useCapabilities,
  useParams,
  useRouter,
  useSearchParamsObject,
  useUpdateSearchParams,
} from 'react-native-inter-router'
import { Dialog } from 'react-native-overlaid'
import { AppShell } from '../components/AppShell'
import { findUser } from '../data/users'

const TABS = ['profile', 'activity'] as const
type Tab = (typeof TABS)[number]

export default function UserScreen() {
  const params = useParams<{ id?: string }>()
  const query = useSearchParamsObject<{ tab?: string }>()
  const updateSearch = useUpdateSearchParams()
  const router = useRouter()
  const capabilities = useCapabilities()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const user = findUser(id)
  if (!user) return <Redirect href="/users" />

  const tab: Tab = query.tab === 'activity' ? 'activity' : 'profile'
  const canGoBack = capabilities.canGoBack ? router.canGoBack() : true

  return (
    <AppShell>
      {canGoBack && (
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
      )}

      <Text style={styles.title}>{user.name}</Text>
      <Text style={styles.role}>{user.role}</Text>

      <View style={styles.tabs}>
        {TABS.map((option) => (
          <Pressable
            key={option}
            style={[styles.tab, option === tab && styles.tabActive]}
            onPress={() => updateSearch({ tab: option })}
          >
            <Text
              style={[styles.tabLabel, option === tab && styles.tabLabelActive]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'profile' ? (
        <Text style={styles.body}>{user.bio}</Text>
      ) : (
        <Text style={styles.body}>
          {user.name} has no recorded activity in this demo, but this tab is a
          real URL: the “tab” query parameter was patched with
          useUpdateSearchParams, so reload and share links keep working.
        </Text>
      )}

      <Pressable style={styles.danger} onPress={() => setConfirmOpen(true)}>
        <Text style={styles.dangerLabel}>Delete user…</Text>
      </Pressable>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${user.name}?`}
        description="Relax — this demo has no backend. Nothing will happen."
      >
        <View style={styles.dialogActions}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setConfirmOpen(false)}
          >
            <Text style={styles.secondaryButtonLabel}>Cancel</Text>
          </Pressable>
          <Pressable
            style={styles.danger}
            onPress={() => {
              setConfirmOpen(false)
              router.push('/users')
            }}
          >
            <Text style={styles.dangerLabel}>Delete</Text>
          </Pressable>
        </View>
      </Dialog>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
  },
  backLabel: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  role: {
    color: '#64748b',
    fontSize: 15,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#f8fafc',
  },
  body: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  danger: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dangerLabel: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '600',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
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
