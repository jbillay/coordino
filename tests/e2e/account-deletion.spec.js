/**
 * Account Deletion E2E Tests
 * Feature: 001-user-config - User Story 3 (Account Deletion)
 *
 * Tests the complete account deletion workflow:
 * - Navigate to Account Management
 * - Initiate deletion
 * - Complete multi-step confirmation
 * - Verify logout and redirect
 * - Verify inability to log in with deleted credentials
 *
 * Success Criteria SC-004: Account deletion completes within 10 seconds
 */

import { test, expect } from '@playwright/test'

test.describe('Account Deletion Workflow', () => {
  const testUser = {
    email: 'delete-test@example.com',
    password: 'DeleteTest123!',
    displayName: 'Delete Test User'
  }

  test.beforeEach(async ({ page }) => {
    // Create a test user for deletion
    await page.goto('/signup')
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.fill('input[name="displayName"]', testUser.displayName)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('should complete full account deletion workflow within 10 seconds', async ({ page }) => {
    const startTime = Date.now()

    // Navigate to Settings > Account tab
    await page.goto('/settings')
    await page.click('button[aria-label="Account security settings"]')

    // Click Delete Account button
    await page.click('button:has-text("Delete Account")')

    // Step 1: See warning about data loss
    await expect(page.locator('text=Warning: Account Deletion')).toBeVisible()
    await expect(page.locator('text=This action is irreversible')).toBeVisible()
    await expect(page.locator('text=All your data will be permanently deleted')).toBeVisible()

    // Step 2: Type "DELETE" to confirm
    await page.fill('input[placeholder*="DELETE"]', 'DELETE')
    await page.click('button:has-text("Continue")')

    // Step 3: Final confirmation (re-enter password)
    await page.fill('input[type="password"][placeholder*="password"]', testUser.password)
    await page.click('button:has-text("Permanently Delete Account")')

    // Wait for deletion to complete and redirect to login
    await page.waitForURL('/login', { timeout: 10000 })

    const endTime = Date.now()
    const duration = endTime - startTime

    // Verify deletion completed within 10 seconds (SC-004)
    expect(duration).toBeLessThan(10000)

    // Verify success message is shown
    await expect(page.locator('text=Account deleted successfully')).toBeVisible()
  })

  test('should prevent login with deleted account credentials', async ({ page }) => {
    // First, delete the account
    await page.goto('/settings')
    await page.click('button[aria-label="Account security settings"]')
    await page.click('button:has-text("Delete Account")')

    // Complete confirmation flow
    await page.fill('input[placeholder*="DELETE"]', 'DELETE')
    await page.click('button:has-text("Continue")')
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button:has-text("Permanently Delete Account")')

    // Wait for redirect to login
    await page.waitForURL('/login')

    // Attempt to log in with deleted credentials
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')

    // Verify error message that account doesn't exist
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
    // Should remain on login page
    await expect(page).toHaveURL('/login')
  })

  test('should cancel deletion on "Cancel" button click', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Account security settings"]')
    await page.click('button:has-text("Delete Account")')

    // Click Cancel in warning dialog
    await page.click('button:has-text("Cancel")')

    // Verify still on settings page
    await expect(page).toHaveURL('/settings')
    // Verify user is still logged in
    await expect(page.locator(`text=${testUser.displayName}`)).toBeVisible()
  })

  test('should cancel deletion if "DELETE" is not typed correctly', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Account security settings"]')
    await page.click('button:has-text("Delete Account")')

    // Type incorrect confirmation text
    await page.fill('input[placeholder*="DELETE"]', 'delete') // wrong case

    // Continue button should be disabled
    const continueButton = page.locator('button:has-text("Continue")')
    await expect(continueButton).toBeDisabled()
  })

  test('should show error if password is incorrect in final confirmation', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Account security settings"]')
    await page.click('button:has-text("Delete Account")')

    await page.fill('input[placeholder*="DELETE"]', 'DELETE')
    await page.click('button:has-text("Continue")')

    // Enter wrong password
    await page.fill('input[type="password"]', 'WrongPassword123!')
    await page.click('button:has-text("Permanently Delete Account")')

    // Verify error message
    await expect(page.locator('text=Incorrect password')).toBeVisible()
    // Should remain on confirmation dialog
    await expect(page.locator('text=Final Confirmation')).toBeVisible()
  })

  test('should handle deletion failures gracefully with retry option', async ({ page: _page }) => {
    // This test would require mocking a server error
    // For now, it documents the requirement
    // TODO: Mock Supabase to return error during deletion
    // Verify error message is shown
    // Verify "Retry" button is available
    // Verify clicking "Retry" attempts deletion again
  })
})

test.describe('Account Deletion - Data Cascade Verification', () => {
  test('should delete all user data when account is deleted', async ({ page: _page }) => {
    // This test verifies that CASCADE delete removes all related data
    // In a real test environment, this would:
    // 1. Create test tasks, notes, meetings for the user
    // 2. Delete the account
    // 3. Query the database to verify all related data is gone
    // This is documented as a requirement for implementation
    // Actual verification requires database access in test environment
  })
})
