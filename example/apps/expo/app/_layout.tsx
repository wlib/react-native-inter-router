import { Stack } from 'expo-router'
import { RoutingProvider } from 'react-native-inter-router'
import { expoAdapter } from 'react-native-inter-router/expo'

export default function RootLayout() {
  return (
    <RoutingProvider adapter={expoAdapter}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoutingProvider>
  )
}
