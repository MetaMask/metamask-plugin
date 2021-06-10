module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2017,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      impliedStrict: true,
      modules: true,
      blockBindings: true,
      arrowFunctions: true,
      objectLiteralShorthandMethods: true,
      objectLiteralShorthandProperties: true,
      templateStrings: true,
      classes: true,
      jsx: true,
    },
  },

  ignorePatterns: [
    '!.eslintrc.js',
    'node_modules/**',
    'dist/**',
    'builds/**',
    'test-*/**',
    'docs/**',
    'coverage/',
    'jest-coverage/',
    'development/chromereload.js',
    'app/vendor/**',
    'test/e2e/send-eth-with-private-key-test/**',
    'nyc_output/**',
    '.vscode/**',
    'lavamoat/*/policy.json',
  ],

  extends: [
    '@metamask/eslint-config',
    '@metamask/eslint-config-nodejs',
    'prettier',
  ],

  plugins: ['@babel', 'import', 'prettier'],

  globals: {
    document: 'readonly',
    window: 'readonly',
  },

  rules: {
    'default-param-last': 'off',
    'prefer-object-spread': 'error',
    'require-atomic-updates': 'off',

    'import/no-unassigned-import': 'off',

    'no-invalid-this': 'off',
    '@babel/no-invalid-this': 'error',

    // Prettier handles this
    '@babel/semi': 'off',

    'node/no-process-env': 'off',

    // TODO: re-enable these rules
    'node/no-sync': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
  },
  overrides: [
    {
      files: ['ui/**/*.js', 'test/lib/render-helpers.js', 'test/jest/*.js'],
      plugins: ['react'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      rules: {
        'react/no-unused-prop-types': 'error',
        'react/no-unused-state': 'error',
        'react/jsx-boolean-value': 'error',
        'react/jsx-curly-brace-presence': [
          'error',
          { props: 'never', children: 'never' },
        ],
        'react/no-deprecated': 'error',
        'react/default-props-match-prop-types': 'error',
        'react/jsx-no-duplicate-props': 'error',
      },
    },
    {
      files: ['test/e2e/**/*.spec.js'],
      extends: ['@metamask/eslint-config-mocha'],
      rules: {
        'mocha/no-hooks-for-single-case': 'off',
        'mocha/no-setup-in-describe': 'off',
      },
    },
    {
      files: ['app/scripts/migrations/*.js', '*.stories.js'],
      rules: {
        'import/no-anonymous-default-export': ['error', { allowObject: true }],
      },
    },
    {
      files: ['app/scripts/migrations/*.js'],
      rules: {
        'node/global-require': 'off',
      },
    },
    {
      files: [
        '**/unit-global/*.test.js',
        'app/scripts/metamask-controller.test.js',
        'app/scripts/controllers/transactions/index.test.js',
        'app/scripts/controllers/network/pending-middleware.test.js',
        'app/scripts/controllers/permissions/permissions-middleware.test.js',
      ],
      extends: ['@metamask/eslint-config-mocha'],
      rules: {
        'mocha/no-setup-in-describe': 'off',
      },
    },
    {
      files: ['**/__snapshots__/*.snap'],
      plugins: ['jest'],
      rules: {
        'jest/no-large-snapshots': [
          'error',
          { maxSize: 50, inlineMaxSize: 50 },
        ],
      },
    },
    {
      files: ['**/*.test.js', 'ui/__mocks__/*.js'],
      excludedFiles: [
        '**/unit-global/*.test.js',
        'app/scripts/metamask-controller.test.js',
        'app/scripts/controllers/transactions/index.test.js',
        'app/scripts/controllers/network/pending-middleware.test.js',
        'app/scripts/controllers/permissions/permissions-middleware.test.js',
      ],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        'jest/no-restricted-matchers': 'off',
        'import/unambiguous': 'off',
        'import/named': 'off',
      },
    },
    {
      files: [
        'development/**/*.js',
        'test/e2e/benchmark.js',
        'test/helpers/setup-helper.js',
      ],
      rules: {
        'node/no-process-exit': 'off',
        'node/shebang': 'off',
      },
    },
    {
      files: [
        '.eslintrc.js',
        'babel.config.js',
        'nyc.config.js',
        'stylelint.config.js',
        'app/scripts/runLockdown.js',
        'development/**/*.js',
        'test/e2e/**/*.js',
        'test/lib/wait-until-called.js',
        'test/env.js',
        'test/setup.js',
        'jest.config.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],

  settings: {
    react: {
      version: 'detect',
    },
  },
};
