// react-native-inter-router and react-native-overlaid are file: links to
// checkouts outside this workspace, so Metro must watch them and must resolve
// the singleton packages (react, react-native, ...) from the workspace's own
// node_modules — a second copy of react from a library's node_modules would
// break hooks at runtime.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const interRouterRoot = path.resolve(workspaceRoot, '..')
const overlaidRoot = path.resolve(interRouterRoot, '../react-native-overlaid')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot, interRouterRoot, overlaidRoot]

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const singletons = [
  'react',
  'react-dom',
  'react-native',
  'react-native-safe-area-context',
  'react-native-screens',
  'expo-router',
]

config.resolver.blockList = [interRouterRoot, overlaidRoot].flatMap((root) =>
  singletons.map(
    (name) => new RegExp(`^${escape(root)}/node_modules/${escape(name)}/.*$`),
  ),
)

config.resolver.extraNodeModules = Object.fromEntries(
  singletons.map((name) => [
    name,
    path.join(workspaceRoot, 'node_modules', name),
  ]),
)

config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules'),
]

module.exports = config
