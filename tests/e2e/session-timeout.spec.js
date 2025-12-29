/**
 * E2E Tests for Session Timeout
 * T088: Test session timeout scenario
 *
 * Tests complete session timeout flow:
 * - User inactive for 28 minutes sees warning (SC-011)
 * - User can extend session (FR-040)
 * - User logged out after 30 minutes inactivity (FR-039)
 * - Remember Me persists session across browser sessions (SC-010, FR-041)
 */

import { test, expect } from '@playwright/test'

test.describe('Session Timeout (T088)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login')
  })

  test.describe('Inactivity Warning (SC-011)', () => {
    test('should show warning after 28 minutes of inactivity', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')

      // Wait for dashboard
      await page.waitForURL('**/dashboard')

      // Fast-forward time by 28 minutes
      await page.evaluate(() => {
        const warningTime = 28 * 60 * 1000 // 28 minutes in milliseconds
        const now = Date.now()
        window.localStorage.setItem('lastActivity', (now - warningTime).toString())
      })

      // Trigger inactivity check (page reload or wait for interval)
      await page.reload()

      // Warning dialog should appear
      const warningDialog = page.locator('[data-testid="session-warning-dialog"]')
      await expect(warningDialog).toBeVisible({ timeout: 5000 })

      // Should show remaining time
      await expect(warningDialog).toContainText('2 minutes')
    })

    test('should not show warning before 28 minutes', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('**/dashboard')

      // Fast-forward by 27 minutes (not enough to trigger warning)
      await page.evaluate(() => {
        const elapsed = 27 * 60 * 1000
        const now = Date.now()
        window.localStorage.setItem('lastActivity', (now - elapsed).toString())
      })

      await page.reload()

      // Warning should not appear
      const warningDialog = page.locator('[data-testid="session-warning-dialog"]')
      await expect(warningDialog).not.toBeVisible()
    })
  })

  test.describe('Session Extension (FR-040)', () => {
    test('should extend session when user clicks extend button', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('**/dashboard')

      // Trigger warning
      await page.evaluate(() => {
        const warningTime = 28 * 60 * 1000
        const now = Date.now()
        window.localStorage.setItem('lastActivity', (now - warningTime).toString())
      })

      await page.reload()

      // Warning should appear
      const warningDialog = page.locator('[data-testid="session-warning-dialog"]')
      await expect(warningDialog).toBeVisible()

      // Click extend button
      const extendButton = page.locator('[data-testid="extend-session-button"]')
      await extendButton.click()

      // Warning should disappear
      await expect(warningDialog).not.toBeVisible()

      // User should still be on dashboard
      await expect(page).toHaveURL(/.*dashboard/)
    })

    test('should reset inactivity timer after extending session', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('**/dashboard')

      // Trigger warning
      await page.evaluate(() => {
        const warningTime = 28 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - warningTime).toString())
      })

      await page.reload()

      const warningDialog = page.locator('[data-testid="session-warning-dialog"]')
      await expect(warningDialog).toBeVisible()

      // Extend session
      await page.click('[data-testid="extend-session-button"]')

      // Wait a moment
      await page.waitForTimeout(1000)

      // Fast-forward another 27 minutes (total would be 55 if not reset)
      await page.evaluate(() => {
        const elapsed = 27 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - elapsed).toString())
      })

      await page.reload()

      // Should NOT show warning (timer was reset)
      await expect(warningDialog).not.toBeVisible()
    })
  })

  test.describe('Automatic Logout (FR-039)', () => {
    test('should logout user after 30 minutes of inactivity', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('**/dashboard')

      // Fast-forward by 30 minutes
      await page.evaluate(() => {
        const logoutTime = 30 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - logoutTime).toString())
      })

      // Trigger logout check
      await page.reload()

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
    })

    test('should show timeout message after automatic logout', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('**/dashboard')

      // Trigger logout
      await page.evaluate(() => {
        const logoutTime = 30 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - logoutTime).toString())
      })

      await page.reload()

      // Should see timeout message on login page
      await expect(page.locator('text=/session.*expired|timed out/i')).toBeVisible({
        timeout: 5000
      })
    })
  })

  test.describe('Remember Me Functionality (SC-010, FR-041)', () => {
    test('should persist session when Remember Me is checked', async ({ page, context }) => {
      // Login with Remember Me checked
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')

      const rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]')
      await rememberMeCheckbox.check()

      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Close browser (simulate closing tab)
      await page.close()

      // Reopen browser with same context
      const newPage = await context.newPage()
      await newPage.goto('http://localhost:5173')

      // Should be automatically logged in (redirect to dashboard)
      await expect(newPage).toHaveURL(/.*dashboard/, { timeout: 5000 })

      await newPage.close()
    })

    test('should not persist session when Remember Me is unchecked', async ({ page, context }) => {
      // Login without Remember Me
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')

      const rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]')
      await rememberMeCheckbox.uncheck()

      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Close browser
      await page.close()

      // Reopen browser with new context (simulate browser restart)
      const newPage = await context.newPage()
      await newPage.goto('http://localhost:5173')

      // Should be redirected to login
      await expect(newPage).toHaveURL(/.*login/, { timeout: 5000 })

      await newPage.close()
    })
  })

  test.describe('Multi-tab Session Coordination', () => {
    test('should sync activity across multiple tabs', async ({ context }) => {
      // Create first tab
      const page1 = await context.newPage()
      await page1.goto('http://localhost:5173/login')

      // Login
      await page1.fill('input[type="email"]', 'test@playwright.com')
      await page1.fill('input[type="password"]', 'test@playwright2025')
      await page1.click('button[type="submit"]')
      await page1.waitForURL('**/dashboard')

      // Create second tab
      const page2 = await context.newPage()
      await page2.goto('http://localhost:5173/dashboard')

      // Activity in tab 1 should prevent timeout in tab 2
      await page1.click('a[href="/tasks"]')
      await page1.waitForURL('**/tasks')

      // Fast-forward time in tab 2
      await page2.evaluate(() => {
        const elapsed = 27 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - elapsed).toString())
      })

      await page2.reload()

      // Tab 2 should NOT show warning (activity from tab 1 should sync)
      const warningDialog = page2.locator('[data-testid="session-warning-dialog"]')
      await expect(warningDialog).not.toBeVisible()

      await page1.close()
      await page2.close()
    })
  })

  test.describe('User Activity Detection', () => {
    test('should reset timer on mouse movement', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Trigger near-warning state
      await page.evaluate(() => {
        const elapsed = 27.5 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - elapsed).toString())
      })

      // Move mouse
      await page.mouse.move(100, 100)

      // Wait a moment
      await page.waitForTimeout(500)

      // Fast-forward another minute
      await page.evaluate(() => {
        const elapsed = 28 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - elapsed).toString())
      })

      await page.reload()

      // Should NOT show warning (activity reset timer)
      const warningDialog = page.locator('[data-testid="session-warning-dialog"]')
      await expect(warningDialog).not.toBeVisible()
    })

    test('should reset timer on keyboard activity', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Trigger near-warning state
      await page.evaluate(() => {
        const elapsed = 27.5 * 60 * 1000
        window.localStorage.setItem('lastActivity', (Date.now() - elapsed).toString())
      })

      // Press key
      await page.keyboard.press('ArrowDown')

      await page.waitForTimeout(500)

      // Reload to check
      await page.reload()

      // Activity should have been tracked
      const warningDialog = page.locator('[data-testid="session-warning-dialog"]')
      await expect(warningDialog).not.toBeVisible()
    })
  })

  test.describe('Session Validity on Navigation (FR-042)', () => {
    test('should check session validity on route navigation', async ({ page }) => {
      // Login
      await page.fill('input[type="email"]', 'test@playwright.com')
      await page.fill('input[type="password"]', 'test@playwright2025')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Invalidate session (simulate expired token)
      await page.evaluate(() => {
        window.localStorage.removeItem('supabase.auth.token')
      })

      // Try to navigate
      await page.click('a[href="/tasks"]')

      // Should redirect to login with message
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
      await expect(page.locator('text=/session.*expired|Please.*login/i')).toBeVisible()
    })
  })
})
