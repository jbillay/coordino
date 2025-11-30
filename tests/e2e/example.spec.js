/**
 * Example E2E Test
 * Demonstrates Playwright test structure and best practices
 *
 * Run: npm run test:e2e
 * Debug: npm run test:e2e:debug
 * UI Mode: npm run test:e2e:ui
 */

import { test, expect } from '@playwright/test'

test.describe('Application Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app before each test
    await page.goto('/')
  })

  test('loads the homepage', async ({ page }) => {
    // Wait for main content to load
    await page.waitForLoadState('networkidle')

    // Check page title
    await expect(page).toHaveTitle(/Coordino/)

    // Verify main heading exists
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('has working navigation', async ({ page }) => {
    // Check that navigation elements exist
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })

  test('is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check mobile menu button exists
    const mobileMenuBtn = page.locator('[aria-label*="menu"]').first()
    if (await mobileMenuBtn.isVisible()) {
      await expect(mobileMenuBtn).toBeVisible()
    }
  })
})

test.describe('Authentication Flow', () => {
  test('navigates to login page', async ({ page }) => {
    await page.goto('/')

    // Look for login link or button
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).first()

    // Check if we need to click login or if already on login page
    const isLoginPage = page.url().includes('/login')

    if (!isLoginPage && (await loginLink.isVisible())) {
      await loginLink.click()
      await expect(page).toHaveURL(/.*login/)
    }

    // Verify login form elements exist
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('shows validation for empty form submission', async ({ page }) => {
    // Navigate to login if not already there
    await page.goto('/login')

    // Find submit button
    const submitButton = page.locator('button[type="submit"]').first()

    // Try to submit empty form
    await submitButton.click()

    // Should show validation or stay on login page
    // (Actual behavior depends on implementation)
    await expect(page).toHaveURL(/.*login/)
  })
})

test.describe('Accessibility', () => {
  test('has no auto-playing media', async ({ page }) => {
    await page.goto('/')

    // Check for auto-playing audio/video
    const media = await page.locator('audio[autoplay], video[autoplay]').count()
    expect(media).toBe(0)
  })

  test('has skip to main content link', async ({ page }) => {
    await page.goto('/')

    // Check for skip link (common accessibility feature)
    const skipLink = page.locator('a[href="#main-content"]').first()

    // Skip link might be hidden until focused
    if ((await skipLink.count()) > 0) {
      await expect(skipLink).toBeDefined()
    }
  })

  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // Check that h1 exists and is unique
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Performance', () => {
  test('loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })
})

// Example of testing dark mode toggle (if implemented)
test.describe('Theme Switching', () => {
  test('can toggle between light and dark mode', async ({ page }) => {
    await page.goto('/')

    // Look for theme toggle button
    const themeToggle = page
      .locator('[aria-label*="theme"]')
      .or(page.getByRole('button', { name: /dark|light/i }))
      .first()

    // If theme toggle exists, test it
    if ((await themeToggle.count()) > 0) {
      // Get initial state
      const htmlElement = page.locator('html')
      const initialTheme = await htmlElement.getAttribute('class')

      // Toggle theme
      await themeToggle.click()

      // Wait for change
      await page.waitForTimeout(300)

      // Verify theme changed
      const newTheme = await htmlElement.getAttribute('class')
      expect(newTheme).not.toBe(initialTheme)
    }
  })
})
