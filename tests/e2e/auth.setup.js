/**
 * Playwright Authentication Setup
 * Saves authentication state for E2E tests
 *
 * PREREQUISITES:
 * - Test users must exist in Supabase before running tests
 * - Create test users manually or via Supabase dashboard:
 *   - newuser@example.com / TestPassword123!
 *   - test@example.com / TestPassword123!
 *
 * This setup runs once before all tests to:
 * 1. Log in via UI as test users
 * 2. Save session state to .auth/ directory
 * 3. Reuse authentication across all tests
 */

import { test as setup, expect } from '@playwright/test'

// Test user credentials (must exist in Supabase)
const TEST_USERS = {
  newuser: {
    email: 'newuser@example.com',
    password: 'TestPassword123!',
    authFile: 'tests/e2e/.auth/newuser.json'
  },
  testuser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    authFile: 'tests/e2e/.auth/testuser.json'
  }
}

/**
 * Setup authenticated state for new user
 */
setup('authenticate as new user', async ({ page }) => {
  const { email, password, authFile } = TEST_USERS.newuser

  // Navigate to login page
  await page.goto('/login')

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Fill in login form
  const emailInput = page.getByLabel(/email/i)
  const passwordInput = page.getByLabel(/password/i)
  const signInButton = page.getByRole('button', { name: /sign in/i })

  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(email)

  await expect(passwordInput).toBeVisible({ timeout: 10000 })
  await passwordInput.fill(password)

  await expect(signInButton).toBeVisible()
  await signInButton.click()

  // Wait for successful login (redirect to dashboard)
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  // Verify user is authenticated
  await expect(page.getByRole('link', { name: /tasks|notes|scheduling/i }).first()).toBeVisible()

  // Save authenticated state
  await page.context().storageState({ path: authFile })

  console.log(`✓ Saved authentication state for ${email}`)
})

/**
 * Setup authenticated state for regular test user
 */
setup('authenticate as test user', async ({ page }) => {
  const { email, password, authFile } = TEST_USERS.testuser

  // Navigate to login page
  await page.goto('/login')

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Fill in login form
  const emailInput = page.getByLabel(/email/i)
  const passwordInput = page.getByLabel(/password/i)
  const signInButton = page.getByRole('button', { name: /sign in/i })

  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(email)

  await expect(passwordInput).toBeVisible({ timeout: 10000 })
  await passwordInput.fill(password)

  await expect(signInButton).toBeVisible()
  await signInButton.click()

  // Wait for successful login
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

  // Save authenticated state
  await page.context().storageState({ path: authFile })

  console.log(`✓ Saved authentication state for ${email}`)
})
