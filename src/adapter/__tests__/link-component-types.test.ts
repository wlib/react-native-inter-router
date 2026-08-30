import { forwardRef } from 'react'
import { defineAdapter, type AdapterDefinition } from '../define-adapter'
import type {
  AdapterLinkComponent,
  AdapterLinkProps,
  RouteLocation,
} from '../types'

const location: RouteLocation = {
  pathname: '/',
  params: {},
  searchParams: new URLSearchParams(),
  hash: '',
}

const ForwardedLink = forwardRef<unknown, AdapterLinkProps>(() => null)
const typedForwardedLink: AdapterLinkComponent = ForwardedLink

const validDefinition: AdapterDefinition = {
  name: 'forwarded-link',
  useLocation: () => location,
  useRouterCore: () => ({ navigate: () => {}, back: () => {} }),
  Link: typedForwardedLink,
}

const invalidDefinition: AdapterDefinition = {
  name: 'ordinary-link',
  useLocation: () => location,
  useRouterCore: () => ({ navigate: () => {}, back: () => {} }),
  // @ts-expect-error React 18 strips refs from ordinary function components.
  Link: () => null,
}

describe('AdapterLinkComponent', () => {
  it('accepts forwardRef components in adapter definitions', () => {
    expect(defineAdapter(validDefinition).Link).toBe(ForwardedLink)
  })

  it('keeps the compile-only invalid definition reachable', () => {
    expect(invalidDefinition.name).toBe('ordinary-link')
  })
})
