/* eslint config for React + TypeScript + Vite */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    // Not enabling type-aware rules to keep it fast and simple
    project: null,
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: { version: 'detect' },
    // Ensure eslint-plugin-import resolves TS paths/aliases
    'import/resolver': {
      typescript: {},
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'import/order': [
      'warn',
      {
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always',
        groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.config.*', '**/*.d.ts'],
};
