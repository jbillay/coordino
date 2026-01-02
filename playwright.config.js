import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Workers: parallel test execution
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',

    // Emulate timezone
    timezoneId: 'America/Los_Angeles',

    // Emulate locale
    locale: 'en-US'
  },

  // Configure projects for major browsers
  projects: [
    // Setup project - runs first to authenticate test users
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use saved authentication state
        storageState: 'tests/e2e/.auth/newuser.json'
      },
      dependencies: ['setup']
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/.auth/newuser.json'
      },
      dependencies: ['setup']
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/.auth/newuser.json'
      },
      dependencies: ['setup']
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/.auth/newuser.json'
      },
      dependencies: ['setup']
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/e2e/.auth/newuser.json'
      },
      dependencies: ['setup']
    }
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
})
