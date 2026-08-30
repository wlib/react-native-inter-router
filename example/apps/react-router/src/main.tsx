import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { RoutingProvider } from 'react-native-inter-router'
import { reactRouterAdapter } from 'react-native-inter-router/react-router'
import { HomeScreen, UserScreen, UsersScreen } from 'app'
import 'react-native-overlaid/styles.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RoutingProvider adapter={reactRouterAdapter}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/users" element={<UsersScreen />} />
          <Route path="/users/:id" element={<UserScreen />} />
        </Routes>
      </RoutingProvider>
    </BrowserRouter>
  </StrictMode>,
)
