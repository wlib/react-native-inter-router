import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// react-native-web takes react-native's place, and .web.* files win so
// platform-split packages (react-native-overlaid) resolve their web halves.
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

export default defineConfig({
  plugins: [react()],
  server: { port: 5175, strictPort: true },
  define: { global: 'globalThis' },
  resolve: {
    alias: { 'react-native': 'react-native-web' },
    dedupe: ['react', 'react-dom', 'react-native-web'],
    extensions: webExtensions,
  },
  optimizeDeps: {
    include: ['react-native-web'],
    esbuildOptions: { resolveExtensions: webExtensions },
  },
})
