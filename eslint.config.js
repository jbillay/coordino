import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  // Apply recommended JavaScript rules
  js.configs.recommended,

  // Apply recommended Vue 3 rules
  ...vue.configs['flat/recommended'],

  // Prettier integration
  prettierConfig,

  {
    plugins: {
      prettier
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest
        // Add any other custom globals here if needed
      }
    },

    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Vue.js specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/no-reserved-component-names': 'off',
      'vue/require-default-prop': 'error',
      'vue/require-prop-types': 'error',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/custom-event-name-casing': 'off',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'warn',
      'vue/require-explicit-emits': 'error',
      'vue/component-api-style': ['error', ['script-setup', 'composition']],
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style']
        }
      ],

      // General JavaScript rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],

      // Code quality
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'no-else-return': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true
        }
      ]
    }
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      'coverage/**',
      'html/**',
      '.claude/**',
      'docs/**',
      'playwright-report/**',
      'test-results/**',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs'
    ]
  }
]
