import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';

export default defineConfig(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'drizzle/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'readonly', require: 'readonly' },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly' },
    },
  },
  ...tseslint.configs.recommended,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  // Accessibility: images need alt text, clickable things must be keyboard-reachable, labels must be tied to inputs.
  { ...jsxA11y.flatConfigs.recommended, files: ['src/**/*.tsx'] },
  {
    // Skipping, focusing or stubbing a test is how a stuck agent "fixes" a failure.
    files: ['**/*.test.ts', 'e2e/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=/^(skip|only|todo|fixme)$/][callee.object.name=/^(it|test|describe)$/]',
          message: 'Do not skip, focus or stub tests. Fix the test or stop and ask.',
        },
        {
          selector: 'CallExpression[callee.name=/^(xit|xdescribe|xtest|fit|fdescribe)$/]',
          message: 'Do not skip or focus tests. Fix the test or stop and ask.',
        },
      ],
    },
  },
  {
    // Agents must not be able to silence a check with a comment.
    plugins: { '@eslint-community/eslint-comments': eslintComments },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@eslint-community/eslint-comments/no-use': ['error', { allow: [] }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
