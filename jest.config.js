module.exports = {
  restoreMocks: true,
  coverageDirectory: 'jest-coverage/',
  collectCoverageFrom: [
    '<rootDir>/ui/**/swaps/**',
    '<rootDir>/ui/ducks/send/**',
  ],
  coveragePathIgnorePatterns: ['.stories.js', '.snap'],
  coverageThreshold: {
    global: {
      branches: 45.24,
      functions: 51.94,
      lines: 58.36,
      statements: 58.6,
    },
  },
  setupFiles: ['./test/setup.js', './test/env.js'],
  setupFilesAfterEnv: ['./test/jest/setup.js'],
  testMatch: [
    '<rootDir>/ui/**/?(*.)+(test).js',
    '<rootDir>/shared/**/?(*.)+(test).js',
  ],
};
