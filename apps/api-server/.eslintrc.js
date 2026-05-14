/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@repo/eslint-config/library.js', 'plugin:nestjs/recommended'],
  plugins: ['nestjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'no-unused-vars': 'off',
    'nestjs/use-validation-pipe': 'error',
    'nestjs/deprecated-api-modules': 'error',
    'nestjs/no-not-found-exception': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/', '../../packages/'],
};
