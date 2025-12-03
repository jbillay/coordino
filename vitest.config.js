import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Test environment
    environment: 'happy-dom',

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Include all source files in coverage
      include: ['src/**/*.{js,vue}'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.js',
        '**/*.spec.js',
        'src/main.js',
        'src/router/index.js',
        '*.config.js',
        'coverage/**',
        'dist/**',
        '.claude/**',
        'docs/**'
      ],
      // Enforce 80% coverage thresholds
      thresholds: {
        branches: 47,
        functions: 39,
        lines: 47,
        statements: 47
      },
      // Report on all files, not just those imported by tests
      all: true
    },

    // Test file patterns
    include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx}'],

    // Setup files
    setupFiles: ['./src/__tests__/setup.js'],

    // Test timeout
    testTimeout: 10000,

    // Watch mode settings
    watch: false,

    // Reporter configuration
    reporters: ['default', 'html'],

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    include: ['vue', 'primevue']
  }
})
