import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  Link,
  useSearchParamsObject,
  useUpdateSearchParams,
} from 'react-native-inter-router'
import { Popover } from 'react-native-overlaid'
import { AppShell } from '../components/AppShell'
import { users } from '../data/users'

const SORTS = ['name', 'role'] as const
type Sort = (typeof SORTS)[number]

export default function UsersScreen() {
  const query = useSearchParamsObject<{ q?: string; sort?: string }>()
  const updateSearch = useUpdateSearchParams()

  const q = typeof query.q === 'string' ? query.q : ''
  const sort: Sort = query.sort === 'role' ? 'role' : 'name'

  const visible = users
    .filter((user) => user.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a[sort].localeCompare(b[sort]))

  return (
    <AppShell>
      <Text style={styles.title}>Users</Text>
      <Text style={styles.lead}>
        The search box and sort order live in the URL query string, patched
        through useUpdateSearchParams — the same call on every router.
      </Text>

      <View style={styles.controls}>
        <TextInput
          style={styles.search}
          placeholder="Filter by name…"
          placeholderTextColor="#94a3b8"
          value={q}
          onChangeText={(text) => updateSearch({ q: text || undefined })}
        />
        <Popover>
          <Popover.Trigger>
            <View style={styles.sortButton}>
              <Text style={styles.sortButtonLabel}>Sort: {sort}</Text>
            </View>
          </Popover.Trigger>
          <Popover.Content>
            {({ close }) => (
              <View style={styles.sortMenu}>
                {SORTS.map((option) => (
                  <Pressable
                    key={option}
                    style={styles.sortOption}
                    onPress={() => {
                      updateSearch({ sort: option })
                      close()
                    }}
                  >
                    <Text
                      style={[
                        styles.sortOptionLabel,
                        option === sort && styles.sortOptionActive,
                      ]}
                    >
                      by {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Popover.Content>
        </Popover>
      </View>

      <View style={styles.list}>
        {visible.map((user) => (
          <Link
            key={user.id}
            href={{ pathname: '/users/[id]', params: { id: user.id } }}
            style={styles.row}
          >
            <View style={styles.rowInner}>
              <Text style={styles.rowName}>{user.name}</Text>
              <Text style={styles.rowRole}>{user.role}</Text>
            </View>
          </Link>
        ))}
        {visible.length === 0 && (
          <Text style={styles.empty}>No users match “{q}”.</Text>
        )}
      </View>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  search: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortButton: {
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortButtonLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  sortMenu: {
    padding: 6,
    gap: 2,
  },
  sortOption: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortOptionLabel: {
    color: '#0f172a',
    fontSize: 14,
  },
  sortOptionActive: {
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  row: {
    backgroundColor: '#ffffff',
    textDecorationLine: 'none',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  rowRole: {
    color: '#64748b',
    fontSize: 14,
  },
  empty: {
    color: '#64748b',
    fontSize: 14,
  },
})
