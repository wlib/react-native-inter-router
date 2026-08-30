module.exports = function importMetaEnv() {
  return {
    name: 'jest-import-meta-env',
    visitor: {
      MetaProperty(path) {
        path.replaceWithSourceString(
          '({ env: { PROD: false, DEV: true, SSR: false } })',
        )
      },
    },
  }
}
