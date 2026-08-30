import { Linking } from 'react-native'

/** Hand external destinations to the operating system on React Native. */
export function openExternalUrl(url: string, _target?: string): void {
  void Linking.openURL(url).catch(() => {
    // There may be no installed handler. Link presses should not reject globally.
  })
}
