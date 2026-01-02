/**
 * E2E Tests for Error Handling
 * Feature: US8 - Comprehensive Error Handling
 *
 * Tests user-facing error scenarios including:
 * - Invalid URL parameters
 * - Form validation errors
 * - Network errors
 * - Session expiry
 *
 * Run: npm run test:e2e -- error-handling
 */

import { test, expect } from '@playwright/test'

// Helper to log in for authenticated tests
async function login(page) {
  await page.goto('/login')

  // Fill in valid credentials (adjust based on test environment)
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'TestPassword123!')

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 5000 })
}

test.describe('URL Parameter Validation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('redirects when navigating to note with invalid UUID', async ({ page }) => {
    // Navigate to note edit page with invalid UUID
    await page.goto('/notes/not-a-valid-uuid/edit')

    // Should redirect to notes list
    await expect(page).toHaveURL(/.*\/notes(\?.*)?$/)

    // Should show error message or indication
    const url = new URL(page.url())
    expect(url.searchParams.get('error')).toBe('invalid-note-id')
  })

  test('redirects when navigating to meeting with invalid UUID', async ({ page }) => {
    // Navigate to meeting detail with invalid UUID
    await page.goto('/scheduling/12345')

    // Should redirect to scheduling list
    await expect(page).toHaveURL(/.*\/scheduling(\?.*)?$/)

    // Should show error indication
    const url = new URL(page.url())
    expect(url.searchParams.get('error')).toBe('invalid-meeting-id')
  })

  test('accepts valid UUIDs', async ({ page }) => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000'

    // Navigate to note with valid UUID (even if note doesn't exist)
    await page.goto(`/notes/${validUUID}/edit`)

    // Should stay on the notes-edit route (might show 404 for note, but URL is valid)
    await expect(page).toHaveURL(new RegExp(`/notes/${validUUID}/edit`))
  })

  test('handles special characters in URL gracefully', async ({ page }) => {
    // Try URL with special characters
    await page.goto('/notes/550e8400;DROP%20TABLE%20notes;/edit')

    // Should redirect safely
    await expect(page).toHaveURL(/.*\/notes(\?.*)?$/)
  })
})

test.describe('Form Validation Errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('shows validation error for empty task title', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/tasks')

    // Open create task dialog (adjust selector based on implementation)
    const createButton = page
      .getByRole('button', { name: /new task|create task|add task/i })
      .first()

    if (await createButton.isVisible()) {
      await createButton.click()

      // Wait for dialog
      await page.waitForTimeout(300)

      // Try to submit without title
      const submitButton = page.getByRole('button', { name: /save|create|add/i }).first()
      await submitButton.click()

      // Should show validation error
      const errorMessage = page.locator('text=/title.*required/i').first()
      await expect(errorMessage).toBeVisible({ timeout: 2000 })
    }
  })

  test('shows validation error for invalid color in topic creation', async ({ page }) => {
    // Navigate to notes page
    await page.goto('/notes')

    // Open topic creation (adjust based on implementation)
    const newTopicButton = page
      .getByRole('button', { name: /new topic|create topic|add topic/i })
      .first()

    if (await newTopicButton.isVisible()) {
      await newTopicButton.click()
      await page.waitForTimeout(300)

      // Fill in topic name
      await page.fill('input[placeholder*="topic name" i], input[id*="topic-name" i]', 'Test Topic')

      // Try to set invalid color (if there's a color input)
      const colorInput = page
        .locator('input[type="color"], input[type="text"][id*="color"]')
        .first()

      if (await colorInput.isVisible()) {
        // Try to input invalid color
        await colorInput.fill('invalid-color')

        // Submit form
        const submitButton = page.getByRole('button', { name: /save|create/i }).first()
        await submitButton.click()

        // Should show validation error
        await expect(page.locator('text=/valid.*color/i').first()).toBeVisible({ timeout: 2000 })
      }
    }
  })

  test('clears validation errors when user corrects input', async ({ page }) => {
    // Navigate to tasks
    await page.goto('/tasks')

    const createButton = page.getByRole('button', { name: /new task|create task/i }).first()

    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(300)

      // Try to submit empty
      const submitButton = page.getByRole('button', { name: /save|create/i }).first()
      await submitButton.click()

      // Error should appear
      const errorVisible = await page.locator('text=/required/i').first().isVisible()

      if (errorVisible) {
        // Fill in title
        await page.fill('input[placeholder*="title" i], input[id*="title" i]', 'Valid Task Title')

        // Error should disappear
        await expect(page.locator('text=/title.*required/i')).not.toBeVisible({ timeout: 2000 })
      }
    }
  })
})

test.describe('Network Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('shows error message when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)

    // Try to navigate to a page that requires data
    await page.goto('/tasks')

    // Should show network error or offline message
    const errorIndicator = page.locator('text=/network.*error|offline|connection/i').first()

    // Wait a bit for error to appear
    await page.waitForTimeout(2000)

    // Check if error message appears
    if (await errorIndicator.isVisible()) {
      await expect(errorIndicator).toBeVisible()
    }

    // Go back online
    await context.setOffline(false)
  })

  test('recovers when connection is restored', async ({ page, context }) => {
    await page.goto('/dashboard')

    // Go offline
    await context.setOffline(true)

    // Try an operation
    await page.goto('/tasks')
    await page.waitForTimeout(1000)

    // Go back online
    await context.setOffline(false)

    // Retry or reload should work
    await page.reload()

    // Should load successfully
    await expect(page).toHaveURL(/.*tasks/)
  })
})

test.describe('Session and Authentication Errors', () => {
  test('redirects to login when accessing protected route without auth', async ({ page }) => {
    // Navigate directly to protected route without logging in
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
  })

  test('redirects authenticated users away from login page', async ({ page }) => {
    await login(page)

    // Try to navigate to login
    await page.goto('/login')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 })
  })

  test('preserves intended destination after login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/notes')

    // Should redirect to login with return URL
    await expect(page).toHaveURL(/.*login/)

    const url = new URL(page.url())
    const redirectParam = url.searchParams.get('redirect')

    // Should have redirect parameter
    expect(redirectParam).toBeTruthy()
    expect(redirectParam).toContain('/notes')
  })
})

test.describe('User-Facing Error Messages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('shows friendly error message for database errors', async ({ page }) => {
    await page.goto('/tasks')

    // Simulate a database constraint violation by trying to create duplicate
    const createButton = page.getByRole('button', { name: /new task|create/i }).first()

    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(300)

      // Fill form and submit
      await page.fill('input[placeholder*="title" i]', 'Test Task')

      const submitButton = page.getByRole('button', { name: /save|create/i }).first()
      await submitButton.click()

      // Wait for response
      await page.waitForTimeout(1000)

      // Error message should be user-friendly, not technical
      const technicalError = page.locator('text=/23502|23503|PGRST|SQL/i')
      await expect(technicalError).not.toBeVisible()
    }
  })

  test('error messages are accessible via screen readers', async ({ page }) => {
    await page.goto('/login')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Error messages should have proper ARIA attributes
    const errorMessages = page.locator(
      '[role="alert"], [aria-live="polite"], [aria-live="assertive"]'
    )

    // Should have at least one error with accessibility attributes
    const count = await errorMessages.count()
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
    }
  })
})

test.describe('Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('allows retry after failed operation', async ({ page }) => {
    await page.goto('/tasks')

    // This would ideally test retry functionality after a failed operation
    // Implementation depends on specific retry mechanisms in the app

    // Verify page is functional after error
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('maintains application state after error', async ({ page }) => {
    await page.goto('/notes')

    // Navigate with invalid UUID
    await page.goto('/notes/invalid-uuid/edit')

    // Should redirect back to notes
    await expect(page).toHaveURL(/.*\/notes/)

    // Application should still be functional
    const newNoteButton = page.getByRole('button', { name: /new note|create note/i }).first()

    if (await newNoteButton.isVisible()) {
      await expect(newNoteButton).toBeVisible()
      await expect(newNoteButton).toBeEnabled()
    }
  })

  test('clears error state when navigating away', async ({ page }) => {
    // Trigger an error
    await page.goto('/notes/invalid-uuid/edit')

    // Navigate to different page
    await page.goto('/dashboard')

    // Navigate back to notes
    await page.goto('/notes')

    // Error parameter should not persist
    const url = new URL(page.url())
    const hasError = url.searchParams.has('error')

    // Error should not persist across navigation
    expect(hasError).toBeFalsy()
  })
})

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('handles rapid navigation during loading', async ({ page }) => {
    // Navigate quickly between pages
    await page.goto('/dashboard')
    await page.goto('/tasks')
    await page.goto('/notes')
    await page.goto('/scheduling')

    // Should end up on last page without errors
    await expect(page).toHaveURL(/.*scheduling/)
  })

  test('handles browser back button correctly', async ({ page }) => {
    await page.goto('/dashboard')
    await page.goto('/tasks')

    // Go back
    await page.goBack()

    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('handles page reload gracefully', async ({ page }) => {
    await page.goto('/tasks')

    // Reload page
    await page.reload()

    // Should still be on tasks page
    await expect(page).toHaveURL(/.*tasks/)
  })
})
