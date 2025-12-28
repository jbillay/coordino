/**
 * E2E tests for complete password reset journey
 * Feature: 001-user-config - User Story 1 (Password Reset)
 * Success Criteria: SC-001 - Complete password reset flow in under 3 minutes
 *
 * Test-First Approach: Tests written BEFORE implementation
 */

import { test, expect } from '@playwright/test'

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login')
  })

  test('should complete full password reset journey successfully (SC-001)', async ({ page }) => {
    const startTime = Date.now()

    // Step 1: Click "Forgot Password" link on login page (FR-001)
    await test.step('Navigate to password reset', async () => {
      const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
      await expect(forgotPasswordLink).toBeVisible()
      await forgotPasswordLink.click()

      // Should navigate to password reset request page or show modal
      await expect(
        page.getByRole('heading', { name: /reset password|forgot password/i })
      ).toBeVisible()
    })

    // Step 2: Enter email and request reset (FR-002)
    await test.step('Request password reset email', async () => {
      const emailInput = page.getByLabel(/email/i)
      await emailInput.fill('test@example.com')

      const submitButton = page.getByRole('button', { name: /send reset link|reset password/i })
      await submitButton.click()

      // Should show success message (FR-002: email sent confirmation)
      await expect(page.getByText(/check your email|reset link sent/i)).toBeVisible({
        timeout: 5000
      })
    })

    // Step 3: Navigate to reset password page (simulating email click)
    // Note: In real E2E, would need email testing service or mock
    await test.step('Navigate to reset password page with token', async () => {
      // Simulate clicking reset link from email with token
      await page.goto('/reset-password?token=test-token-123&type=recovery')

      await expect(page.getByRole('heading', { name: /set new password/i })).toBeVisible()
    })

    // Step 4: Enter new password with validation (FR-003)
    await test.step('Enter valid new password', async () => {
      const passwordInput = page.getByLabel(/new password|password/i).first()
      const confirmPasswordInput = page.getByLabel(/confirm password/i)

      // Test password strength validation
      await passwordInput.fill('weak')
      await expect(page.getByText(/at least 8 characters/i)).toBeVisible()

      // Enter strong password
      await passwordInput.fill('SecurePassword123!')
      await confirmPasswordInput.fill('SecurePassword123!')

      // Validation feedback should show success
      await expect(page.getByText(/password strength.*strong/i)).toBeVisible()
    })

    // Step 5: Submit new password (FR-003, FR-004)
    await test.step('Submit password reset', async () => {
      const submitButton = page.getByRole('button', { name: /update password|set password/i })
      await submitButton.click()

      // Should show success message
      await expect(page.getByText(/password (updated|changed) successfully/i)).toBeVisible({
        timeout: 5000
      })
    })

    // Step 6: Verify redirect to login and session invalidation (FR-004)
    await test.step('Verify redirect and login with new password', async () => {
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

      // Login with new password
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('SecurePassword123!')
      await page.getByRole('button', { name: /log in|sign in/i }).click()

      // Should successfully log in and redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    })

    // Verify completion time (SC-001: under 3 minutes)
    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(180000) // 3 minutes = 180,000ms
  })

  test('should handle expired reset token gracefully (FR-005)', async ({ page }) => {
    // Navigate with expired token
    await page.goto('/reset-password?token=expired-token&type=recovery')

    const passwordInput = page.getByLabel(/new password/i).first()
    const submitButton = page.getByRole('button', { name: /update password/i })

    await passwordInput.fill('SecurePassword123!')
    await submitButton.click()

    // Should show error about expired token
    await expect(page.getByText(/expired|invalid.*link/i)).toBeVisible({ timeout: 5000 })

    // Should offer retry option
    const retryLink = page.getByRole('link', { name: /request new link|try again/i })
    await expect(retryLink).toBeVisible()
  })

  test('should handle invalid reset token (FR-005)', async ({ page }) => {
    // Navigate with invalid/malformed token
    await page.goto('/reset-password?token=invalid-format')

    // Should show error message
    await expect(page.getByText(/invalid.*link|unable to verify/i)).toBeVisible({
      timeout: 5000
    })

    // Should provide clear next steps
    await expect(page.getByText(/request.*new.*link/i)).toBeVisible()
  })

  test('should validate password strength in real-time (FR-003)', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token&type=recovery')

    const passwordInput = page.getByLabel(/new password/i).first()

    // Test too short
    await passwordInput.fill('Short1!')
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()

    // Test missing uppercase
    await passwordInput.fill('lowercase123!')
    await expect(page.getByText(/uppercase/i)).toBeVisible()

    // Test missing lowercase
    await passwordInput.fill('UPPERCASE123!')
    await expect(page.getByText(/lowercase/i)).toBeVisible()

    // Test missing number
    await passwordInput.fill('NoNumbers!')
    await expect(page.getByText(/number/i)).toBeVisible()

    // Test missing special character
    await passwordInput.fill('NoSpecial123')
    await expect(page.getByText(/special character/i)).toBeVisible()

    // Test strong password
    await passwordInput.fill('SecurePassword123!')
    await expect(page.getByText(/password.*strong|meets.*requirements/i)).toBeVisible()
  })

  test('should prevent submission with weak password', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token&type=recovery')

    const passwordInput = page.getByLabel(/new password/i).first()
    const submitButton = page.getByRole('button', { name: /update password/i })

    await passwordInput.fill('weak')

    // Submit button should be disabled or show validation error
    const isDisabled = await submitButton.isDisabled()
    if (!isDisabled) {
      await submitButton.click()
      await expect(page.getByText(/password.*requirements/i)).toBeVisible()
    } else {
      expect(isDisabled).toBe(true)
    }
  })

  test('should not reveal whether email exists (FR-001)', async ({ page }) => {
    await page.goto('/login')

    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
    await forgotPasswordLink.click()

    // Try with non-existent email
    const emailInput = page.getByLabel(/email/i)
    await emailInput.fill('nonexistent@example.com')

    const submitButton = page.getByRole('button', { name: /send reset link/i })
    await submitButton.click()

    // Should show generic success message (not revealing if email exists)
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 5000 })

    // Should NOT show "email not found" or similar
    await expect(page.getByText(/not found|doesn't exist/i)).not.toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true)

    await page.goto('/login')
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
    await forgotPasswordLink.click()

    const emailInput = page.getByLabel(/email/i)
    await emailInput.fill('test@example.com')

    const submitButton = page.getByRole('button', { name: /send reset link/i })
    await submitButton.click()

    // Should show network error message
    await expect(page.getByText(/connection|network|offline/i)).toBeVisible({ timeout: 5000 })

    // Should offer retry option
    await context.setOffline(false)
    await submitButton.click()

    // Should succeed after retry
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 5000 })
  })

  test('should show loading state during email send', async ({ page }) => {
    await page.goto('/login')

    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
    await forgotPasswordLink.click()

    const emailInput = page.getByLabel(/email/i)
    await emailInput.fill('test@example.com')

    const submitButton = page.getByRole('button', { name: /send reset link/i })
    await submitButton.click()

    // Should show loading indicator
    await expect(submitButton).toBeDisabled()
    await expect(page.getByRole('progressbar').or(page.getByText(/sending/i))).toBeVisible()
  })

  test('should confirm password matches before submission', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token&type=recovery')

    const passwordInput = page.getByLabel(/new password/i).first()
    const confirmInput = page.getByLabel(/confirm password/i)
    const submitButton = page.getByRole('button', { name: /update password/i })

    await passwordInput.fill('SecurePassword123!')
    await confirmInput.fill('DifferentPassword123!')

    await submitButton.click()

    // Should show mismatch error
    await expect(page.getByText(/passwords.*match/i)).toBeVisible()
  })
})
