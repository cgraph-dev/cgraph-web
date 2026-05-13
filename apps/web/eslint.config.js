import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // React Hooks plugin - use flat config compatible approach
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  // Main config for all TypeScript/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        WebSocket: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        process: 'readonly',
        crypto: 'readonly',
        indexedDB: 'readonly',
        navigator: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        structuredClone: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
      },
    },
    plugins: {
      react,
      'react-refresh': reactRefresh,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-require-imports': 'error',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Disabled: This is a HMR convenience warning, not a production concern
      'react-refresh/only-export-components': 'off',

      // General
      'no-unused-vars': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Override: Allow console in logger and error tracking modules only
  {
    files: [
      '**/lib/logger.ts',
      '**/lib/logger.production.ts',
      '**/lib/logger/**/*.ts',
      '**/lib/error-tracking.ts',
      '**/lib/errorTracking.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  // Override: Allow console in stories, test pages, main.tsx, dev tools, and middleware
  {
    files: [
      '**/*.stories.tsx',
      '**/pages/test/**/*.tsx',
      '**/main.tsx',
      '**/stores/middleware.ts',
      '**/components/dev/**/*.tsx',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  // Override: Allow console in test files that test logger modules
  {
    files: ['**/lib/__tests__/logger.test.ts', '**/lib/__tests__/logger.*.test.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // Override: Security code needs control-regex for sanitization
  {
    files: ['**/lib/security/**/*.ts'],
    rules: {
      'no-control-regex': 'off',
    },
  },
  // Override: Test files may use @ts-expect-error for testing error paths with partial mocks,
  // and type assertions for mock casting (e.g. api.get as MockedFunction<typeof api.get>)
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
    },
  },
  // Override: Disable react-refresh for stores, hooks, contexts, providers (non-component exports)
  {
    files: [
      '**/stores/**/*.ts',
      '**/hooks/**/*.ts',
      '**/contexts/**/*.tsx',
      '**/providers/**/*.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Rule 1: Import boundaries — lib/ and stores/ must not import from UI layers
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/components/*', '@/pages/*'],
              message:
                'lib/ cannot import from components or pages — extract shared logic to lib/ or packages/',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/stores/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/components/*', '@/pages/*'],
              message:
                'stores/ cannot import from components or pages — keep store logic UI-agnostic',
            },
          ],
        },
      ],
    },
  },

  // Rule 2: Hardcoded color literal migration is tracked outside the release lint gate.
  // The broad selector also matches theme palettes, animation assets, and test fixtures.
  {
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  // Rule 3: no-console — already enforced at error level in main config block above.

  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '*.config.ts', 'coverage/'],
  }
);
