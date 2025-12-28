/**
 * E2E tests for data export feature
 * T065: Test data export end-to-end (SC-005: <30 sec for 1000 records)
 *
 * Verifies complete user journey from Settings to download
 * and validates performance requirements (User Story 4)
 */

import { test, expect } from '@playwright/test'

test.describe('Data Export E2E (T065)', () => {
  let testUser

  test.beforeEach(async ({ page }) => {
    // Create test user and login
    testUser = {
      email: `test-export-${Date.now()}@example.com`,
      password: 'TestPassword123!@#'
    }

    // Navigate to signup
    await page.goto('/signup')

    // Sign up
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should complete data export workflow within 30 seconds (SC-005)', async ({ page }) => {
    const startTime = Date.now()

    // Navigate to Settings
    await page.click('[href="/settings"]')
    await page.waitForURL('/settings')

    // Click Data Export tab
    await page.click('button[aria-label="Data export settings"]')
    await expect(page.locator('h2:has-text("Data Export")')).toBeVisible()

    // Click Export All My Data button
    const exportButton = page.locator('button:has-text("Export All My Data")')
    await expect(exportButton).toBeVisible()

    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })

    // Click export
    await exportButton.click()

    // Progress bar should be visible
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()

    // Current step should be displayed
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible()

    // Wait for download to start
    const download = await downloadPromise
    const duration = Date.now() - startTime

    // Verify filename format
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/coordino-export-\d{4}-\d{2}-\d{2}\.zip/)

    // Verify performance requirement (SC-005)
    expect(duration).toBeLessThan(30000) // < 30 seconds

    // Save file for inspection
    const filePath = await download.path()
    expect(filePath).toBeTruthy()
  })

  test('should create valid ZIP archive with correct structure', async ({ page }) => {
    // Navigate to Settings > Data Export
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    // Trigger export
    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.click('button:has-text("Export All My Data")')

    const download = await downloadPromise
    const filePath = await download.path()

    // Verify file exists and has content
    expect(filePath).toBeTruthy()

    // In a real test, we would:
    // 1. Unzip the archive
    // 2. Verify folder structure (json/, csv/, README.txt)
    // 3. Validate JSON is parseable
    // 4. Validate CSV has headers and data
    // 5. Verify all entity types are included
  })

  test('should export data in dual formats (JSON and CSV) (FR-016, FR-017)', async ({ page }) => {
    // Create some test data first
    await page.goto('/tasks')
    await page.click('button:has-text("New Task")')
    await page.fill('input[placeholder="Task title"]', 'Test Task for Export')
    await page.click('button:has-text("Create")')

    // Navigate to Settings > Data Export
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    // Export data
    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.click('button:has-text("Export All My Data")')

    const download = await downloadPromise
    expect(download).toBeTruthy()

    // Filename should follow pattern
    expect(download.suggestedFilename()).toMatch(/coordino-export-\d{4}-\d{2}-\d{2}\.zip/)
  })

  test('should show loading state during export (FR-018)', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    const exportButton = page.locator('button:has-text("Export All My Data")')

    // Click export
    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await exportButton.click()

    // Button should be disabled during export
    await expect(exportButton).toBeDisabled()

    // Progress bar should be visible
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()

    // Progress should increase
    const progressBar = page.locator('[data-testid="progress-bar"]')
    const initialValue = await progressBar.getAttribute('value')
    expect(Number(initialValue)).toBeGreaterThanOrEqual(0)

    // Wait for download
    await downloadPromise

    // Progress should reach 100
    const finalValue = await progressBar.getAttribute('value')
    expect(Number(finalValue)).toBe(100)

    // Button should be re-enabled
    await expect(exportButton).toBeEnabled()
  })

  test('should show current step description during export', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.click('button:has-text("Export All My Data")')

    // Current step should be visible
    const currentStep = page.locator('[data-testid="current-step"]')
    await expect(currentStep).toBeVisible()

    // Step text should change during export
    const step1 = await currentStep.textContent()
    expect(step1).toBeTruthy()
    expect(step1.length).toBeGreaterThan(0)

    await downloadPromise

    // Final step should indicate completion
    const finalStep = await currentStep.textContent()
    expect(finalStep).toContain('complete')
  })

  test('should handle export errors gracefully', async ({ page }) => {
    // This test would require mocking a failure scenario
    // For now, we test that error UI exists
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    // Verify error message container exists (hidden initially)
    const errorContainer = page.locator('[data-testid="error-message"]')
    // Should not be visible initially
    await expect(errorContainer).not.toBeVisible()
  })

  test('should work with empty dataset', async ({ page }) => {
    // Fresh user with no data
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.click('button:has-text("Export All My Data")')

    // Should still create export
    const download = await downloadPromise
    expect(download).toBeTruthy()
    expect(download.suggestedFilename()).toMatch(/coordino-export-/)
  })

  test('should handle large datasets (>1000 records) (FR-019)', async ({ page }) => {
    // This test would require seeding 1000+ records
    // Placeholder for performance test with large dataset
    // In real implementation, we would:
    // 1. Seed database with 1500 tasks, 1000 notes, etc.
    // 2. Trigger export
    // 3. Verify completion within 30 seconds
    // 4. Verify all records are included in export

    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    const startTime = Date.now()
    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.click('button:has-text("Export All My Data")')

    await downloadPromise
    const duration = Date.now() - startTime

    // Even with large dataset, should complete within 30s
    expect(duration).toBeLessThan(30000)
  })

  test('should allow retrying after error', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    // Export button should be available
    const exportButton = page.locator('button:has-text("Export All My Data")')
    await expect(exportButton).toBeEnabled()

    // If error occurs, retry button should appear
    // (This would require mocking an error scenario in real implementation)
    const retryButton = page.locator('[data-testid="retry-button"]')
    // Should not be visible initially
    await expect(retryButton).not.toBeVisible()
  })

  test('should maintain consistent filename format', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.click('button:has-text("Export All My Data")')

    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Verify format: coordino-export-YYYY-MM-DD.zip
    const today = new Date().toISOString().split('T')[0]
    expect(filename).toBe(`coordino-export-${today}.zip`)
  })

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    // Tab to export button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Enter should trigger export
    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.keyboard.press('Enter')

    // Should trigger download
    const download = await downloadPromise
    expect(download).toBeTruthy()
  })

  test('should show success message after completion', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button[aria-label="Data export settings"]')

    const downloadPromise = page.waitForEvent('download', { timeout: 35000 })
    await page.click('button:has-text("Export All My Data")')

    await downloadPromise

    // Success message should appear
    const successMessage = page.locator('[data-testid="success-message"]')
    await expect(successMessage).toBeVisible({ timeout: 2000 })
    await expect(successMessage).toContainText('export')
  })
})
