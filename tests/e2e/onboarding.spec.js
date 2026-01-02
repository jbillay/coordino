/**
 * E2E tests for First-Time User Experience (Onboarding)
 * Feature: 001-user-config - User Story 9
 * Success Criteria: SC-013, SC-014 - Empty states and feature tours
 *
 * Test-First Approach: Tests written BEFORE implementation
 */

import { test, expect } from '@playwright/test'

test.describe('Empty States and Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (already authenticated via saved state)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test.describe('Tasks View Empty State', () => {
    test('should display empty state when user has no tasks', async ({ page }) => {
      await test.step('Navigate to Tasks view', async () => {
        await page.getByRole('link', { name: /tasks/i }).click()
        await expect(page).toHaveURL(/\/tasks/)
      })

      await test.step('Verify empty state is displayed', async () => {
        await expect(
          page.getByText(/no tasks yet|get started|create your first task/i)
        ).toBeVisible()
        await expect(
          page.getByRole('button', { name: /create.*first.*task|new task/i })
        ).toBeVisible()
      })

      await test.step('Empty state should have icon and encouraging message', async () => {
        // Icon or illustration should be present
        const emptyStateContainer = page
          .locator('[data-testid="empty-state"]')
          .or(page.locator('text=/no tasks yet/i').locator('..'))
        await expect(emptyStateContainer).toBeVisible()
      })
    })

    test('should allow creating first task from empty state CTA', async ({ page }) => {
      await page.getByRole('link', { name: /tasks/i }).click()
      await expect(page).toHaveURL(/\/tasks/)

      const createButton = page.getByRole('button', { name: /create.*first.*task|new task/i })
      await createButton.click()

      // Task creation dialog should appear
      await expect(page.getByRole('dialog').or(page.getByLabel(/task/i))).toBeVisible()
    })

    test('should show tasks tour for first-time users (SC-013)', async ({ page }) => {
      await page.getByRole('link', { name: /tasks/i }).click()
      await expect(page).toHaveURL(/\/tasks/)

      await test.step('Tour overlay should be visible', async () => {
        await expect(page.getByText(/welcome|let's get started|tour|tutorial/i)).toBeVisible({
          timeout: 2000
        })
      })

      await test.step('Tour should be skippable', async () => {
        const skipButton = page.getByRole('button', { name: /skip|dismiss|close/i })
        await expect(skipButton).toBeVisible()
      })
    })

    test('should not show tour again after completion (SC-014)', async ({ page }) => {
      await page.getByRole('link', { name: /tasks/i }).click()
      await expect(page).toHaveURL(/\/tasks/)

      await test.step('Complete the tour', async () => {
        const tourElement = page.getByText(/welcome|let's get started/i).first()
        if (await tourElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Complete or skip the tour
          const completeButton = page
            .getByRole('button', { name: /got it|next|finish|done/i })
            .last()
          if (await completeButton.isVisible().catch(() => false)) {
            await completeButton.click()
          } else {
            const skipButton = page.getByRole('button', { name: /skip/i })
            await skipButton.click()
          }
        }
      })

      await test.step('Navigate away and back', async () => {
        await page.getByRole('link', { name: /dashboard/i }).click()
        await expect(page).toHaveURL(/\/dashboard/)

        await page.getByRole('link', { name: /tasks/i }).click()
        await expect(page).toHaveURL(/\/tasks/)
      })

      await test.step('Tour should not appear again', async () => {
        await expect(page.getByText(/welcome|let's get started|tour/i)).not.toBeVisible({
          timeout: 2000
        })
      })
    })
  })

  test.describe('Notes View Empty State', () => {
    test('should display empty state when user has no notes', async ({ page }) => {
      await test.step('Navigate to Notes view', async () => {
        await page.getByRole('link', { name: /notes/i }).click()
        await expect(page).toHaveURL(/\/notes/)
      })

      await test.step('Verify empty state is displayed', async () => {
        await expect(page.getByText(/no notes yet|write your first note/i)).toBeVisible()
        await expect(
          page.getByRole('button', { name: /write.*first.*note|new note/i })
        ).toBeVisible()
      })
    })

    test('should allow creating first note from empty state CTA', async ({ page }) => {
      await page.getByRole('link', { name: /notes/i }).click()
      await expect(page).toHaveURL(/\/notes/)

      const createButton = page.getByRole('button', { name: /write.*first.*note|new note/i })
      await createButton.click()

      // Should navigate to note editor or show creation dialog
      await expect(
        page.getByRole('textbox', { name: /note|content/i }).or(page.getByRole('dialog'))
      ).toBeVisible({ timeout: 5000 })
    })

    test('should show notes tour for first-time users', async ({ page }) => {
      await page.getByRole('link', { name: /notes/i }).click()
      await expect(page).toHaveURL(/\/notes/)

      await expect(page.getByText(/welcome|let's get started|tour/i)).toBeVisible({ timeout: 2000 })
    })
  })

  test.describe('Scheduling View Empty State', () => {
    test('should display empty state when user has no meetings', async ({ page }) => {
      await test.step('Navigate to Scheduling view', async () => {
        await page.getByRole('link', { name: /meetings|scheduling/i }).click()
        await expect(page).toHaveURL(/\/scheduling/)
      })

      await test.step('Verify empty state is displayed', async () => {
        await expect(page.getByText(/no meetings|schedule.*first.*meeting/i)).toBeVisible()
        await expect(
          page.getByRole('button', { name: /schedule.*first.*meeting|new meeting/i })
        ).toBeVisible()
      })
    })

    test('should allow scheduling first meeting from empty state CTA', async ({ page }) => {
      await page.getByRole('link', { name: /meetings|scheduling/i }).click()
      await expect(page).toHaveURL(/\/scheduling/)

      const createButton = page.getByRole('button', {
        name: /schedule.*first.*meeting|new meeting/i
      })
      await createButton.click()

      // Meeting creation form should appear
      await expect(page.getByRole('dialog').or(page.getByLabel(/meeting/i))).toBeVisible({
        timeout: 5000
      })
    })

    test('should show scheduling tour for first-time users', async ({ page }) => {
      await page.getByRole('link', { name: /meetings|scheduling/i }).click()
      await expect(page).toHaveURL(/\/scheduling/)

      await expect(page.getByText(/welcome|let's get started|tour/i)).toBeVisible({ timeout: 2000 })
    })
  })

  test.describe('Tour Management', () => {
    test('should allow replaying tours from Settings', async ({ page }) => {
      await test.step('Navigate to Settings', async () => {
        await page.getByRole('link', { name: /settings/i }).click()
        await expect(page).toHaveURL(/\/settings/)
      })

      await test.step('Find Help or Replay Tours option', async () => {
        // Look for Help tab or Replay Tours button
        const helpSection = page
          .getByRole('tab', { name: /help/i })
          .or(page.getByText(/replay.*tours|reset.*tours/i))
        await expect(helpSection).toBeVisible()

        if (
          await page
            .getByRole('tab', { name: /help/i })
            .isVisible()
            .catch(() => false)
        ) {
          await page.getByRole('tab', { name: /help/i }).click()
        }
      })

      await test.step('Verify Replay Tours option exists', async () => {
        await expect(
          page.getByRole('button', { name: /replay.*tours|reset.*tours/i })
        ).toBeVisible()
      })
    })

    test('should reset all tours when replay is clicked', async ({ page }) => {
      // First, complete a tour
      await page.getByRole('link', { name: /tasks/i }).click()
      const tourElement = page.getByText(/welcome|let's get started/i).first()
      if (await tourElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        const skipButton = page.getByRole('button', { name: /skip/i })
        if (await skipButton.isVisible().catch(() => false)) {
          await skipButton.click()
        }
      }

      // Navigate to Settings and replay tours
      await page.getByRole('link', { name: /settings/i }).click()
      const helpTab = page.getByRole('tab', { name: /help/i })
      if (await helpTab.isVisible().catch(() => false)) {
        await helpTab.click()
      }

      const replayButton = page.getByRole('button', { name: /replay.*tours|reset.*tours/i })
      await replayButton.click()

      // Confirm if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|replay/i })
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click()
      }

      // Go back to Tasks and verify tour appears again
      await page.getByRole('link', { name: /tasks/i }).click()
      await expect(page.getByText(/welcome|let's get started|tour/i)).toBeVisible({ timeout: 2000 })
    })
  })

  test.describe('Empty State Accessibility', () => {
    test('should have proper ARIA labels and semantic HTML', async ({ page }) => {
      await page.getByRole('link', { name: /tasks/i }).click()
      await expect(page).toHaveURL(/\/tasks/)

      // Empty state should be in a properly labeled region
      const emptyState = page
        .locator('[data-testid="empty-state"]')
        .or(page.getByRole('region', { name: /empty|no tasks/i }))

      await expect(emptyState).toBeVisible()

      // CTA button should be focusable and have clear label
      const ctaButton = page.getByRole('button', { name: /create.*first.*task/i })
      await expect(ctaButton).toBeVisible()
      await ctaButton.focus()
      await expect(ctaButton).toBeFocused()
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.getByRole('link', { name: /notes/i }).click()
      await expect(page).toHaveURL(/\/notes/)

      // Tab to the CTA button
      await page.keyboard.press('Tab')

      page.getByRole('button', { name: /write.*first.*note/i })

      // Should be able to activate with Enter
      await page.keyboard.press('Enter')

      await expect(page.getByRole('textbox').or(page.getByRole('dialog'))).toBeVisible({
        timeout: 5000
      })
    })
  })

  test.describe('Tour Persistence Across Sessions', () => {
    test('should persist tour completion after page refresh', async ({ page }) => {
      await page.getByRole('link', { name: /tasks/i }).click()

      // Skip tour if visible
      const skipButton = page.getByRole('button', { name: /skip/i })
      if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click()
      }

      // Refresh page
      await page.reload()
      await expect(page).toHaveURL(/\/tasks/)

      // Tour should not reappear
      await expect(page.getByText(/welcome|let's get started|tour/i)).not.toBeVisible({
        timeout: 2000
      })
    })
  })
})
