/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,

  env: {
    es2022: true,
    node: true
  },

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },

  extends: ['eslint:recommended', 'prettier'],

  rules: {
    // 🧠 Best practices for libraries
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'no-debugger': 'error',

    // 🧱 Safer exports
    'no-undef': 'error',

    // 🧩 Clean code
    'no-var': 'error',
    'prefer-const': 'error',

    // ⚠️ Avoid fragile patterns
    'no-case-declarations': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],

    // 📦 Library-specific
    'no-process-exit': 'error', // don’t kill host app
    'no-restricted-globals': ['error', 'event', 'fdescribe']
  },

  overrides: [
    // ✅ Allow dev tools / config files to be more relaxed
    {
      files: ['*.config.js', '*.config.cjs', 'scripts/**'],
      rules: {
        'no-console': 'off'
      }
    },

    // ✅ Test files
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ]
}
