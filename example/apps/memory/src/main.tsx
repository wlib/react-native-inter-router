import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { usePathname } from 'react-native-inter-router'
import { matchPathPattern } from 'react-native-inter-router/core'
import { createMemoryRouting } from 'react-native-inter-router/memory'
import { HomeScreen, UserScreen, UsersScreen } from 'app'
import 'react-native-overlaid/styles.css'
import './index.css'

// No framework router at all: the memory adapter owns navigation, so the
// browser URL never changes. The same shared screens still work because the
// provider context overrides everything they import from the package root.
const routing = createMemoryRouting({
  initialEntries: ['/'],
  routes: ['/users/[id]'],
})

function Screens() {
  const pathname = usePathname()
  if (pathname === '/users') return <UsersScreen />
  if (matchPathPattern('/users/[id]', pathname)) return <UserScreen />
  return <HomeScreen />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <routing.Provider>
      <Screens />
    </routing.Provider>
  </StrictMode>,
)
