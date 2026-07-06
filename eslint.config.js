// Flat config for ESLint v10. See https://eslint.org/docs/latest/use/configure/configuration-files
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'reports/**',
      'auth/**',
      'dist/**',
      'build/**',
      '.husky/**',
      'package-lock.json',
      // Codegen landing zone — overwritten by every recording, never committed.
      'scripts/recorded-flow.ts',
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      playwright,
    },
    rules: {
      // Banned: sleeps and timeouts
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message: 'page.waitForTimeout() is banned. Use auto-retrying expect() locators instead.',
        },
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message: 'setTimeout() is banned in src/. Use auto-retrying expect() instead.',
        },
      ],

      // Imports / consistency
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',

      // Playwright-specific
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/expect-expect': [
        'error',
        {
          // Page-object assertion helpers count as assertions:
          // expectUrl, expectToast, expectSuccessBanner, waitForLoaded, ...
          assertFunctionPatterns: ['^expect', '^waitForLoaded$'],
        },
      ],
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/no-page-pause': 'warn',
      'playwright/no-useless-await': 'error',
      'playwright/prefer-web-first-assertions': 'error',

      // General hygiene
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.mjs', 'src/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.cjs', '**/*.mjs', '**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      parserOptions: {
        project: false,
        projectService: false,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);
