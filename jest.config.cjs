module.exports = {
  projects: [
    {
      displayName: 'core',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': [
          'babel-jest',
          {
            configFile: false,
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              '@babel/preset-typescript',
            ],
          },
        ],
      },
    },
    {
      displayName: 'web',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.web.test.tsx'],
      setupFiles: ['<rootDir>/jest.setup.web.cjs'],
      transformIgnorePatterns: ['/node_modules/(?!(seroval|seroval-plugins)/)'],
      transform: {
        '^.+\\.(t|j)sx?$': [
          'babel-jest',
          {
            configFile: false,
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              '@babel/preset-typescript',
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
            plugins: [require.resolve('./jest.babel-import-meta.cjs')],
          },
        ],
      },
    },
    {
      displayName: 'native',
      preset: 'react-native',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.native.test.tsx'],
      moduleFileExtensions: [
        'native.tsx',
        'native.ts',
        'native.js',
        'tsx',
        'ts',
        'jsx',
        'js',
        'json',
        'node',
      ],
      moduleNameMapper: {
        '^expo-router$': '<rootDir>/jest.mocks/expo-router.tsx',
      },
    },
  ],
}
