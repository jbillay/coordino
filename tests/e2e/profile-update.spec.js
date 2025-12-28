/**
 * E2E tests for Profile Update journey
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 * Success Criteria: SC-003 - Changes reflected throughout app within 5 seconds
 *
 * Test-First Approach: Tests written BEFORE implementation
 */

import { test, expect } from '@playwright/test'

test.describe('Profile Update Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and sign in
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('TestPassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('should complete profile update journey within 5 seconds (SC-003)', async ({ page }) => {
    const startTime = Date.now()

    // Step 1: Navigate to Settings
    await test.step('Navigate to Settings page', async () => {
      const settingsLink = page.getByRole('link', { name: /settings/i })
      await expect(settingsLink).toBeVisible()
      await settingsLink.click()

      await expect(page).toHaveURL(/\/settings/, { timeout: 5000 })
      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
    })

    // Step 2: Navigate to Profile tab
    await test.step('Open Profile settings tab', async () => {
      const profileTab = page.getByRole('tab', { name: /profile/i })
      await expect(profileTab).toBeVisible()
      await profileTab.click()

      await expect(page.getByText(/display name/i)).toBeVisible()
    })

    // Step 3: Update display name
    await test.step('Update display name', async () => {
      const displayNameInput = page.getByLabel(/display name/i)
      await displayNameInput.fill('Updated Test User')

      const saveButton = page.getByRole('button', { name: /save.*changes|update.*profile/i })
      await saveButton.click()

      // Should show success message
      await expect(page.getByText(/profile.*updated|changes.*saved/i)).toBeVisible({
        timeout: 5000
      })
    })

    // Step 4: Verify changes reflected in navigation
    await test.step('Verify changes reflected in UI', async () => {
      // Navigate away and back to verify persistence
      await page.getByRole('link', { name: /dashboard/i }).click()
      await expect(page).toHaveURL(/\/dashboard/)

      // Display name should be updated in header/navigation
      await expect(page.getByText('Updated Test User')).toBeVisible({ timeout: 5000 })
    })

    // Verify completion time (SC-003: within 5 seconds)
    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(5000) // 5 seconds
  })

  test('should update timezone preference and reflect in scheduling', async ({ page }) => {
    await test.step('Navigate to Preferences tab', async () => {
      await page.getByRole('link', { name: /settings/i }).click()
      await expect(page).toHaveURL(/\/settings/)

      const preferencesTab = page.getByRole('tab', { name: /preferences/i })
      await preferencesTab.click()

      await expect(page.getByText(/timezone/i)).toBeVisible()
    })

    await test.step('Change timezone', async () => {
      const timezoneSelect = page.getByLabel(/timezone/i)
      await timezoneSelect.selectOption('America/New_York')

      const saveButton = page.getByRole('button', { name: /save.*changes/i })
      await saveButton.click()

      await expect(page.getByText(/preferences.*updated/i)).toBeVisible({ timeout: 5000 })
    })

    await test.step('Verify timezone reflected in scheduling', async () => {
      await page.getByRole('link', { name: /meetings|scheduling/i }).click()
      await expect(page).toHaveURL(/\/scheduling/)

      // Time displays should show in selected timezone
      await expect(page.getByText(/EST|EDT/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test('should toggle theme and persist preference', async ({ page }) => {
    await test.step('Navigate to Preferences tab', async () => {
      await page.getByRole('link', { name: /settings/i }).click()
      const preferencesTab = page.getByRole('tab', { name: /preferences/i })
      await preferencesTab.click()
    })

    await test.step('Toggle theme to dark mode', async () => {
      const themeToggle = page.getByLabel(/theme|dark mode/i)
      await themeToggle.click()

      // Document should have dark class
      const html = page.locator('html')
      await expect(html).toHaveClass(/dark/)
    })

    await test.step('Verify theme persists after page reload', async () => {
      await page.reload()

      const html = page.locator('html')
      await expect(html).toHaveClass(/dark/)
    })
  })

  test('should change email with re-authentication', async ({ page }) => {
    await test.step('Navigate to Account tab', async () => {
      await page.getByRole('link', { name: /settings/i }).click()
      const accountTab = page.getByRole('tab', { name: /account/i })
      await accountTab.click()

      await expect(page.getByText(/change email/i)).toBeVisible()
    })

    await test.step('Attempt email change', async () => {
      const changeEmailButton = page.getByRole('button', { name: /change email/i })
      await changeEmailButton.click()

      // Should show re-authentication dialog
      await expect(page.getByText(/current password/i)).toBeVisible()
    })

    await test.step('Enter current password and new email', async () => {
      const currentPasswordInput = page.getByLabel(/current password/i)
      await currentPasswordInput.fill('TestPassword123!')

      const newEmailInput = page.getByLabel(/new email/i)
      await newEmailInput.fill('newemail@example.com')

      const confirmButton = page.getByRole('button', { name: /confirm|update/i })
      await confirmButton.click()

      // Should show success message about verification email
      await expect(page.getByText(/verification email/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test('should change password with re-authentication', async ({ page }) => {
    await test.step('Navigate to Account tab', async () => {
      await page.getByRole('link', { name: /settings/i }).click()
      const accountTab = page.getByRole('tab', { name: /account/i })
      await accountTab.click()
    })

    await test.step('Open change password dialog', async () => {
      const changePasswordButton = page.getByRole('button', { name: /change password/i })
      await changePasswordButton.click()

      await expect(page.getByLabel(/current password/i)).toBeVisible()
    })

    await test.step('Enter passwords', async () => {
      await page.getByLabel(/current password/i).fill('TestPassword123!')
      await page.getByLabel(/new password/i).fill('NewSecurePass123!')
      await page.getByLabel(/confirm.*password/i).fill('NewSecurePass123!')

      // Should show password strength indicator
      await expect(page.getByText(/strong password/i)).toBeVisible()

      const confirmButton = page.getByRole('button', { name: /confirm|update/i })
      await confirmButton.click()

      await expect(page.getByText(/password.*updated/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test('should validate display name length', async ({ page }) => {
    await page.getByRole('link', { name: /settings/i }).click()
    const profileTab = page.getByRole('tab', { name: /profile/i })
    await profileTab.click()

    // Try to enter name longer than 100 characters
    const displayNameInput = page.getByLabel(/display name/i)
    const longName = 'A'.repeat(101)
    await displayNameInput.fill(longName)

    const saveButton = page.getByRole('button', { name: /save.*changes/i })
    await saveButton.click()

    // Should show validation error
    await expect(page.getByText(/100 characters/i)).toBeVisible()
  })

  test('should show loading state during profile update', async ({ page }) => {
    await page.getByRole('link', { name: /settings/i }).click()
    const profileTab = page.getByRole('tab', { name: /profile/i })
    await profileTab.click()

    const displayNameInput = page.getByLabel(/display name/i)
    await displayNameInput.fill('Test User')

    const saveButton = page.getByRole('button', { name: /save.*changes/i })
    await saveButton.click()

    // Should show loading indicator
    await expect(saveButton).toBeDisabled()
    await expect(page.getByRole('progressbar').or(page.getByText(/saving|updating/i))).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page, context }) => {
    await page.getByRole('link', { name: /settings/i }).click()
    const profileTab = page.getByRole('tab', { name: /profile/i })
    await profileTab.click()

    // Simulate offline mode
    await context.setOffline(true)

    const displayNameInput = page.getByLabel(/display name/i)
    await displayNameInput.fill('Test User')

    const saveButton = page.getByRole('button', { name: /save.*changes/i })
    await saveButton.click()

    // Should show error message
    await expect(page.getByText(/network|connection|offline/i)).toBeVisible({ timeout: 5000 })

    // Restore connection and retry
    await context.setOffline(false)
    await saveButton.click()

    // Should succeed after retry
    await expect(page.getByText(/profile.*updated/i)).toBeVisible({ timeout: 5000 })
  })

  test('should preserve unsaved changes warning', async ({ page }) => {
    await page.getByRole('link', { name: /settings/i }).click()
    const profileTab = page.getByRole('tab', { name: /profile/i })
    await profileTab.click()

    // Make changes without saving
    const displayNameInput = page.getByLabel(/display name/i)
    await displayNameInput.fill('Unsaved Name')

    // Try to navigate away
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('unsaved')
      dialog.dismiss()
    })

    await page.getByRole('link', { name: /dashboard/i }).click()

    // Should still be on settings page
    await expect(page).toHaveURL(/\/settings/)
  })

  test('should allow date format preference selection', async ({ page }) => {
    await page.getByRole('link', { name: /settings/i }).click()
    const preferencesTab = page.getByRole('tab', { name: /preferences/i })
    await preferencesTab.click()

    const dateFormatSelect = page.getByLabel(/date format/i)
    await dateFormatSelect.selectOption('DD/MM/YYYY')

    const saveButton = page.getByRole('button', { name: /save.*changes/i })
    await saveButton.click()

    await expect(page.getByText(/preferences.*updated/i)).toBeVisible({ timeout: 5000 })

    // Navigate to tasks to verify format
    await page.getByRole('link', { name: /tasks/i }).click()

    // Dates should be displayed in DD/MM/YYYY format
    // (This assumes tasks have dates displayed)
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/
    await expect(page.locator('text=' + dateRegex)).toBeVisible({ timeout: 5000 })
  })
})
