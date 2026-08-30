// react-native-web takes react-native's place, .web.* files win so
// platform-split packages (react-native-overlaid) resolve their web halves,
// and the shared "app" workspace package ships raw TypeScript.
const webExtensions = [
  '.web.tsx',
  '.web.ts',
  '.web.mjs',
  '.web.js',
  '.tsx',
  '.ts',
  '.mjs',
  '.js',
  '.jsx',
  '.json',
]

import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['app', 'react-native-web'],
  turbopack: {
    // The inter-router and overlaid packages are file: links to checkouts
    // outside this workspace; root must cover the common ancestor or
    // Turbopack refuses to resolve them.
    root: fileURLToPath(new URL('../../../..', import.meta.url)),
    resolveAlias: { 'react-native': 'react-native-web' },
    resolveExtensions: webExtensions,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    }
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.mjs',
      '.web.js',
      ...config.resolve.extensions,
    ]
    return config
  },
}

export default nextConfig
