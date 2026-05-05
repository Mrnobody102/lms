import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import turboConfig from 'eslint-config-turbo/flat';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const rootDir = dirname(fileURLToPath(import.meta.url));
const nextFiles = [
  'apps/web-admin/**/*.{js,jsx,ts,tsx}',
  'apps/web-student/**/*.{js,jsx,ts,tsx}',
  'apps/super-portal/**/*.{js,jsx,ts,tsx}',
];
const backendAndPackageFiles = ['apps/api-server/**/*.ts', 'packages/**/*.{ts,tsx}'];

const scopedNextVitals = nextVitals.map((config) => ({
  ...config,
  files: nextFiles,
}));
const scopedTypeScriptRecommended = tseslint.configs.recommended.slice(1).map((config) => ({
  ...config,
  files: backendAndPackageFiles,
}));

export default [
  {
    ignores: [
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.tsbuildinfo',
      '**/.eslintrc.*',
      '**/next.config.*',
      '**/postcss.config.*',
      '**/tailwind.config.*',
    ],
  },
  js.configs.recommended,
  {
    files: ['packages/eslint-config/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
    },
    rules: {
      'no-undef': 'off',
    },
  },
  ...scopedTypeScriptRecommended,
  ...(turboConfig.default ?? turboConfig),
  ...scopedNextVitals,
  prettier,
  {
    files: backendAndPackageFiles,
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: rootDir,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  {
    files: nextFiles,
    rules: {
      'no-undef': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  {
    files: ['**/*.{spec,test}.{ts,tsx}', '**/e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
