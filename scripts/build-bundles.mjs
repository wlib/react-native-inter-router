import { build } from 'esbuild'

const entryPoints = {
  index: 'src/index.ts',
  'adapters/next/index': 'src/adapters/next/index.ts',
  'adapters/expo/index': 'src/adapters/expo/index.ts',
  'adapters/tanstack/index': 'src/adapters/tanstack/index.ts',
  'adapters/react-router/index': 'src/adapters/react-router/index.ts',
  'adapters/memory/index': 'src/adapters/memory/index.ts',
}

const common = {
  bundle: true,
  chunkNames: 'chunks/web/[name]-[hash]',
  entryPoints,
  format: 'esm',
  jsx: 'automatic',
  outdir: 'dist',
  packages: 'external',
  platform: 'neutral',
  splitting: true,
  sourcemap: true,
  target: 'es2020',
  banner: { js: "'use client';" },
}

const web = await build({ ...common, metafile: true })
assertSharedContext(web.metafile.outputs, 'web')

const native = await build({
  ...common,
  chunkNames: 'chunks/native/[name]-[hash]',
  entryNames: '[dir]/[name].native',
  metafile: true,
  resolveExtensions: [
    '.native.tsx',
    '.native.ts',
    '.native.jsx',
    '.native.js',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.json',
  ],
})
assertNativeResolution(native.metafile.inputs)
assertSharedContext(native.metafile.outputs, 'native')

await build({
  bundle: true,
  entryPoints: { 'core/index': 'src/core/index.ts' },
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  platform: 'neutral',
  sourcemap: true,
  target: 'es2020',
})

function assertNativeResolution(inputsRecord) {
  const inputs = new Set(Object.keys(inputsRecord))
  const expected = [
    'src/components/create-link.native.tsx',
    'src/react/create-use-link-props.native.ts',
    'src/core/open-external.native.ts',
  ]
  const forbidden = [
    'src/components/create-link.tsx',
    'src/react/create-use-link-props.ts',
    'src/core/open-external.ts',
  ]
  const missing = expected.filter((file) => !inputs.has(file))
  const wrongPlatform = forbidden.filter((file) => inputs.has(file))
  if (missing.length || wrongPlatform.length) {
    throw new Error(
      [
        'Native bundle resolution assertion failed.',
        missing.length ? `Missing: ${missing.join(', ')}` : '',
        wrongPlatform.length
          ? `Included web files: ${wrongPlatform.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }
}

function assertSharedContext(outputsRecord, platform) {
  const owners = Object.entries(outputsRecord)
    .filter(([, output]) =>
      Object.prototype.hasOwnProperty.call(
        output.inputs,
        'src/react/context.tsx',
      ),
    )
    .map(([file]) => file)
  const expectedDirectory = `dist/chunks/${platform}/`
  if (owners.length !== 1 || !owners[0].startsWith(expectedDirectory)) {
    throw new Error(
      `${platform} AdapterContext must live in exactly one shared ${expectedDirectory} chunk; found: ${owners.join(', ') || 'none'}`,
    )
  }
}
