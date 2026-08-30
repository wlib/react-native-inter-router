import {
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native'
import { Linking, Text } from 'react-native'
import { createMemoryRouting } from '../../adapters/memory'
import type {
  LinkOutputProps,
  NativeLinkOutputProps,
} from '../../react/create-use-link-props.native'

describe('native Link', () => {
  it('returns the native branch of the portable link-props contract', () => {
    const routing = createMemoryRouting()
    const { result } = renderHook(() => routing.useLinkProps('/a'))
    const portable: LinkOutputProps = result.current
    expect('onPress' in portable).toBe(true)
    if (!('onPress' in portable)) throw new Error('Expected native link props')
    const native: NativeLinkOutputProps = portable
    expect(native.accessibilityRole).toBe('link')
  })

  it('navigates with options and supports replace', () => {
    const routing = createMemoryRouting()
    const { rerender } = render(
      <routing.Link href="/a" state={{ from: 'home' }} testID="link">
        <Text>a</Text>
      </routing.Link>,
    )
    fireEvent.press(screen.getByTestId('link'))
    expect(routing.history.current).toEqual({
      url: '/a',
      state: { from: 'home' },
    })

    rerender(
      <routing.Link href="/b" replace testID="link">
        <Text>b</Text>
      </routing.Link>,
    )
    fireEvent.press(screen.getByTestId('link'))
    expect(routing.history.entries.map(({ url }) => url)).toEqual(['/', '/b'])
  })

  it('opens external URLs through the OS', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
    const routing = createMemoryRouting()
    render(
      <routing.Link href="mailto:test@example.com" testID="link">
        <Text>email</Text>
      </routing.Link>,
    )
    fireEvent.press(screen.getByTestId('link'))
    expect(open).toHaveBeenCalledWith('mailto:test@example.com')
    expect(routing.history.log).toHaveLength(0)
    open.mockRestore()
  })

  it('is inert when disabled or cancelled', () => {
    const routing = createMemoryRouting()
    const { rerender } = render(
      <routing.Link href="/a" disabled testID="link">
        <Text>a</Text>
      </routing.Link>,
    )
    const disabled = screen.getByTestId('link')
    expect(disabled.props.accessibilityRole).toBe('link')
    expect(disabled.props.accessibilityState).toEqual({ disabled: true })
    fireEvent.press(disabled)

    rerender(
      <routing.Link
        href="/a"
        onPress={(event) => event.preventDefault()}
        testID="link"
      >
        <Text>a</Text>
      </routing.Link>,
    )
    fireEvent.press(screen.getByTestId('link'))
    expect(routing.history.log).toHaveLength(0)
  })
})
