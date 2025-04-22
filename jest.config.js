// eslint-disable-next-line import/no-default-export
export default {
  preset: 'solid-jest/preset/browser',
  setupFilesAfterEnv: [
    '<rootDir>/node_modules/@testing-library/jest-dom',
    '<rootDir>/jest-preload.js',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          'babel-preset-solid',
        ],
      },
    ],
  },
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^solid-js$': 'solid-js/dist/solid.cjs',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^solid-js/web$': 'solid-js/web/dist/web.cjs',
  },
  resolver: 'ts-jest-resolver',
  coverageProvider: 'v8',
  coverageReporters: ['cobertura', 'text'],
  collectCoverage: true,
  collectCoverageFrom: ['./src/*.{ts,tsx}', '!**/node_modules/**', '!./src/index.ts'],
  coverageDirectory: './.nyc_output',
};
