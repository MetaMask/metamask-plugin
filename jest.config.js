module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  collectCoverageFrom: ['<rootDir>/ui/**/swaps/**'],
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageThreshold: {
    global: {
      branches: 32.75,
      functions: 42.9,
      lines: 43.12,
      statements: 43.67,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  setupFilesAfterEnv: ['./test/jest/setup.js'],
  testMatch: ['<rootDir>/**/*.test.js'],
  testPathIgnorePatterns: [
    '<rootDir>/app/scripts/metamask-controller.test.js',
    '<rootDir>/app/scripts/controllers/transactions/index.test.js',
    '<rootDir>/app/scripts/controllers/network/pending-middleware.test.js',
    '<rootDir>/app/scripts/controllers/permissions/permissions-middleware.test.js',
    '<rootDir>/test/unit-global/',
  ],
};
