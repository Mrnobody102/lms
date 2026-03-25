/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@repo/eslint-config/next.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  ignorePatterns: [
    'postcss.config.*',
    'tailwind.config.*',
    'next.config.*',
    '.eslintrc.*',
    '!.eslintrc.js',
  ],
  rules: {
    'no-unused-vars': 'off',
  },
};
