import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = new URL('..', import.meta.url)
const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url)),
)
const temporary = mkdtempSync(join(tmpdir(), 'react-native-inter-router-pack-'))

try {
  const result = JSON.parse(
    execFileSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, npm_config_cache: join(temporary, 'npm-cache') },
      },
    ),
  )[0]
  const files = new Set(result.files.map(({ path }) => path))
  const targets = new Set()

  const visit = (value) => {
    if (typeof value === 'string') {
      if (value.startsWith('./dist/')) targets.add(value.slice(2))
      return
    }
    if (value && typeof value === 'object') Object.values(value).forEach(visit)
  }
  visit(pkg.exports)

  const missing = [...targets].filter((target) => !files.has(target))
  const forbidden = [...files].filter(
    (file) =>
      file.startsWith('src/') ||
      file.includes('/__tests__/') ||
      /(?:^|\/)jest\./.test(file) ||
      /\.test\.[cm]?[jt]sx?$/.test(file),
  )
  const nativeSources = [...files].filter((file) =>
    /\.native\.(?:js|d\.ts)$/.test(file),
  )
  const legacyShims = [
    'index.js',
    'index.native.js',
    'core.js',
    'next.js',
    'next.native.js',
    'expo.js',
    'expo.native.js',
    'tanstack.js',
    'tanstack.native.js',
    'react-router.js',
    'react-router.native.js',
    'memory.js',
    'memory.native.js',
  ]
  const missingLegacyShims = legacyShims.filter((file) => !files.has(file))
  const declarationMaps = [...files].filter((file) =>
    file.endsWith('.d.ts.map'),
  )

  if (
    missing.length ||
    forbidden.length ||
    nativeSources.length === 0 ||
    missingLegacyShims.length ||
    declarationMaps.length ||
    pkg['react-native'] !== './index.native.js'
  ) {
    const details = [
      missing.length ? `missing export targets: ${missing.join(', ')}` : '',
      forbidden.length
        ? `source/test files published: ${forbidden.join(', ')}`
        : '',
      nativeSources.length === 0
        ? 'no compiled .native.js/.native.d.ts files'
        : '',
      missingLegacyShims.length
        ? `missing legacy shims: ${missingLegacyShims.join(', ')}`
        : '',
      declarationMaps.length
        ? `unexpected declaration maps: ${declarationMaps.join(', ')}`
        : '',
      pkg['react-native'] !== './index.native.js'
        ? 'package react-native field does not select index.native.js'
        : '',
    ].filter(Boolean)
    throw new Error(`Package verification failed:\n- ${details.join('\n- ')}`)
  }

  const archive = join(temporary, result.filename)
  execFileSync('tar', ['-xzf', archive, '-C', temporary])
  const extracted = join(temporary, 'package')
  symlinkSync(
    join(fileURLToPath(root), 'node_modules'),
    join(extracted, 'node_modules'),
    'dir',
  )
  const shimTargets = {
    'index.js': './dist/index.js',
    'index.native.js': './dist/index.native.js',
    'core.js': './dist/core/index.js',
    'next.js': './dist/adapters/next/index.js',
    'next.native.js': './dist/adapters/next/index.native.js',
    'expo.js': './dist/adapters/expo/index.js',
    'expo.native.js': './dist/adapters/expo/index.native.js',
    'tanstack.js': './dist/adapters/tanstack/index.js',
    'tanstack.native.js': './dist/adapters/tanstack/index.native.js',
    'react-router.js': './dist/adapters/react-router/index.js',
    'react-router.native.js': './dist/adapters/react-router/index.native.js',
    'memory.js': './dist/adapters/memory/index.js',
    'memory.native.js': './dist/adapters/memory/index.native.js',
  }
  for (const [shim, target] of Object.entries(shimTargets)) {
    if (!readFileSync(join(extracted, shim), 'utf8').includes(target)) {
      throw new Error(`Legacy shim ${shim} does not select ${target}`)
    }
  }
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      [
        `const core = await import('${pkg.name}/core')`,
        `const root = await import('${pkg.name}')`,
        `const memory = await import('${pkg.name}/memory')`,
        `const framework = await import('${pkg.name}/react-router')`,
        `const React = await import('react')`,
        `const { renderToStaticMarkup } = await import('react-dom/server')`,
        `if (core.resolveHref({ pathname: '/u/[id]', params: { id: 1 } }) !== '/u/1') throw new Error('core smoke failed')`,
        `if (typeof root.createRouting !== 'function') throw new Error('root smoke failed')`,
        `if (typeof memory.createMemoryHistory !== 'function') throw new Error('memory smoke failed')`,
        `const routing = memory.createMemoryRouting({ initialEntries: ['/shared-context'] })`,
        `function RootProbe() { return React.createElement('i', null, root.usePathname()) }`,
        `function FrameworkProbe() { return React.createElement('b', null, framework.usePathname()) }`,
        `const markup = renderToStaticMarkup(React.createElement(routing.Provider, null, React.createElement(RootProbe), React.createElement(FrameworkProbe)))`,
        `if (markup !== '<i>/shared-context</i><b>/shared-context</b>') throw new Error('shared adapter context smoke failed: ' + markup)`,
      ].join(';'),
    ],
    { cwd: extracted, stdio: 'pipe' },
  )
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      [
        `const root = await import('./index.js')`,
        `const memory = await import('./memory.js')`,
        `const framework = await import('./react-router.js')`,
        `const React = await import('react')`,
        `const { renderToStaticMarkup } = await import('react-dom/server')`,
        `const routing = memory.createMemoryRouting({ initialEntries: ['/legacy-context'] })`,
        `function RootProbe() { return React.createElement('i', null, root.usePathname()) }`,
        `function FrameworkProbe() { return React.createElement('b', null, framework.usePathname()) }`,
        `const markup = renderToStaticMarkup(React.createElement(routing.Provider, null, React.createElement(RootProbe), React.createElement(FrameworkProbe)))`,
        `if (markup !== '<i>/legacy-context</i><b>/legacy-context</b>') throw new Error('legacy shared context smoke failed: ' + markup)`,
      ].join(';'),
    ],
    { cwd: extracted, stdio: 'pipe' },
  )
  execFileSync(
    process.execPath,
    [
      '--conditions=react-native',
      '--input-type=module',
      '--eval',
      `if (!import.meta.resolve('${pkg.name}').endsWith('/dist/index.native.js')) throw new Error('native export condition failed')`,
    ],
    { cwd: extracted, stdio: 'pipe' },
  )
  const consumer = join(extracted, 'consumer-smoke')
  mkdirSync(consumer)
  writeFileSync(
    join(consumer, 'consumer.ts'),
    [
      `import type { Href, LinkOutputProps, NativeLinkOutputProps, PathSyntax, WebLinkOutputProps } from '${pkg.name}'`,
      `import type { MemoryHistoryOptions } from '${pkg.name}/memory'`,
      `type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false`,
      `type Assert<T extends true> = T`,
      `export type PortableOutput = Assert<Equal<LinkOutputProps, WebLinkOutputProps | NativeLinkOutputProps>>`,
      `export type CoreSurface = typeof import('${pkg.name}/core')`,
      `export type MemorySurface = typeof import('${pkg.name}/memory')`,
      `export const href = { pathname: '/users/[id]', params: { id: 1 } } satisfies Href`,
      `export const syntax: PathSyntax = 'brackets'`,
      `export const memoryOptions = { initialIndex: 0 } satisfies MemoryHistoryOptions`,
      `// @ts-expect-error Href params accept primitives and arrays, not objects`,
      `export const badHref: Href = { pathname: '/users/[id]', params: { id: { invalid: true } } }`,
      `// @ts-expect-error PathSyntax is a closed union`,
      `export const badSyntax: PathSyntax = 'express'`,
      `// @ts-expect-error memory initialIndex must be numeric`,
      `export const badMemoryOptions: MemoryHistoryOptions = { initialIndex: '0' }`,
      `export function consume(output: LinkOutputProps): 'web' | 'native' {`,
      `  if ('onClick' in output) {`,
      `    const web: WebLinkOutputProps = output`,
      `    return web.role === 'link' ? 'web' : 'web'`,
      `  }`,
      `  const native: NativeLinkOutputProps = output`,
      `  return native.accessibilityRole === 'link' ? 'native' : 'native'`,
      `}`,
    ].join('\n'),
  )
  writeFileSync(
    join(consumer, 'frameworks.ts'),
    [
      `export type NextSurface = typeof import('${pkg.name}/next')`,
      `export type ExpoSurface = typeof import('${pkg.name}/expo')`,
      `export type TanstackSurface = typeof import('${pkg.name}/tanstack')`,
      `export type ReactRouterSurface = typeof import('${pkg.name}/react-router')`,
    ].join('\n'),
  )
  const configurations = {
    bundler: { module: 'ESNext', moduleResolution: 'Bundler' },
    node16: { module: 'Node16', moduleResolution: 'Node16' },
    nodenext: { module: 'NodeNext', moduleResolution: 'NodeNext' },
  }
  for (const [name, resolution] of Object.entries(configurations)) {
    const config = join(consumer, `tsconfig.${name}.json`)
    writeFileSync(
      config,
      JSON.stringify({
        compilerOptions: {
          ...resolution,
          allowSyntheticDefaultImports: true,
          jsx: 'react-jsx',
          lib: ['ESNext', 'DOM'],
          noEmit: true,
          skipLibCheck: false,
          strict: true,
          target: 'ES2022',
          types: ['react'],
        },
        include: ['consumer.ts'],
      }),
    )
    execFileSync(
      join(extracted, 'node_modules', '.bin', 'tsc'),
      ['--project', config, '--pretty', 'false'],
      { cwd: consumer, stdio: 'inherit' },
    )
  }
  // Framework peers own large declaration graphs. Some current releases have
  // internal strict-check defects, so this smoke isolates subpath resolution
  // with skipLibCheck while the package-owned graph above stays fully strict.
  for (const [name, resolution] of Object.entries(configurations)) {
    const config = join(consumer, `tsconfig.frameworks-${name}.json`)
    writeFileSync(
      config,
      JSON.stringify({
        compilerOptions: {
          ...resolution,
          allowSyntheticDefaultImports: true,
          jsx: 'react-jsx',
          lib: ['ESNext', 'DOM'],
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2022',
          types: ['react'],
        },
        include: ['frameworks.ts'],
      }),
    )
    execFileSync(
      join(extracted, 'node_modules', '.bin', 'tsc'),
      ['--project', config, '--pretty', 'false'],
      { cwd: consumer, stdio: 'inherit' },
    )
  }

  console.log(
    `Verified ${result.filename}: ${files.size} files, ${targets.size} export targets, ${nativeSources.length} native outputs, packed runtime/type smokes passed.`,
  )
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
