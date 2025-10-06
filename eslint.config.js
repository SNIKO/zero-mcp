// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ['dist/**', 'node_modules/**'], // ignore build output
  },
  js.configs.recommended, // base JS rules
  ...tseslint.configs.recommended, // TypeScript rules
  prettier, // disables formatting rules conflicting with Prettier
  {
    rules: {
      'no-unused-vars': 'off', // disabled in favor of @typescript-eslint/no-unused-vars
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
