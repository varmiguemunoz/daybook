import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sizePolicy = {
  'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
  complexity: ['error', 10],
};

const typedSources = ['apps/web/src/**/*.{ts,tsx}', 'apps/api/src/**/*.ts', 'packages/*/src/**/*.ts'];
const configFiles = ['**/*.config.{js,ts}', 'eslint.config.js', 'tests/**/*.ts'];

export default tseslint.config(
  {
    ignores: [
      '**/dist/',
      '**/node_modules/',
      '**/playwright-report/',
      '**/test-results/',
      'tests/visual/baseline/',
      '.agents/',
      '.claude/',
      '.opencode/',
      '**/src-tauri/target/',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  },
  { files: typedSources, rules: sizePolicy },
  { files: configFiles, languageOptions: { globals: { ...globals.node } } },
);
