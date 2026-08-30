import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { RoutingProvider } from 'react-native-inter-router'
import { tanstackAdapter } from 'react-native-inter-router/tanstack'
import { HomeScreen, UserScreen, UsersScreen } from 'app'
import 'react-native-overlaid/styles.css'
import './index.css'

const rootRoute = createRootRoute({
  component: () => (
    <RoutingProvider adapter={tanstackAdapter}>
      <Outlet />
    </RoutingProvider>
  ),
})

const router = createRouter({
  routeTree: rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: HomeScreen,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/users',
      component: UsersScreen,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/users/$id',
      component: UserScreen,
    }),
  ]),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
