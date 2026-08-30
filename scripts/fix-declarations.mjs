import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const declarationRoot = fileURLToPath(new URL('../dist', import.meta.url))

for (const file of await collectDeclarations(declarationRoot)) {
  const source = await readFile(file, 'utf8')
  const rewritten = source.replace(
    /(\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"])(\.[^'"]*)\2/g,
    (_match, prefix, quote, specifier) =>
      `${prefix}${quote}${resolveDeclarationSpecifier(file, specifier)}${quote}`,
  )
  for (const match of rewritten.matchAll(
    /(\bfrom\s+|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"])(\.[^'"]*)\2/g,
  )) {
    const specifier = match[3]
    if (specifier && !/\.(?:[cm]?js|json)$/.test(specifier)) {
      throw new Error(
        `Declaration contains a non-Node ESM specifier ${JSON.stringify(specifier)} in ${file}`,
      )
    }
  }
  await writeFile(file, rewritten)
}

async function collectDeclarations(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectDeclarations(path)))
    else if (entry.name.endsWith('.d.ts')) files.push(path)
  }
  return files
}

function resolveDeclarationSpecifier(importer, specifier) {
  if (/\.(?:[cm]?js|json)$/.test(specifier)) return specifier

  const base = resolve(dirname(importer), specifier)
  const variants = importer.endsWith('.native.d.ts') ? ['.native', ''] : ['']

  for (const variant of variants) {
    if (existsSync(`${base}${variant}.d.ts`)) {
      return `${specifier}${variant}.js`
    }
  }
  for (const variant of variants) {
    if (existsSync(join(base, `index${variant}.d.ts`))) {
      const prefix =
        specifier === '.' ? './' : `${specifier.replace(/\/$/, '')}/`
      return `${prefix}index${variant}.js`
    }
  }

  throw new Error(
    `Cannot resolve declaration specifier ${JSON.stringify(specifier)} from ${importer}`,
  )
}
