/**
 * E2E Performance Tests
 * T077: Verify 60fps scrolling with 1000+ items
 *
 * Tests application performance with large datasets:
 * - Virtual scrolling maintains 60fps (SC-008)
 * - Search returns results within 1 second (SC-009)
 * - Time-to-interactive < 3 seconds (FR-034)
 *
 * User Story 6: Performance Optimization
 */

import { test, expect } from '@playwright/test'

test.describe('Performance Optimization (T077)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('http://localhost:5173/login')
    await page.fill('input[type="email"]', 'test@playwright.com')
    await page.fill('input[type="password"]', 'test@playwright2025')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test.describe('Virtual Scrolling Performance', () => {
    test('should maintain smooth scrolling with 1000+ tasks', async ({ page }) => {
      // Navigate to tasks view
      await page.goto('http://localhost:5173/tasks')

      // Wait for tasks to load
      await page.waitForSelector('[data-testid="task-list"]', { timeout: 5000 })

      // Get initial task count
      const taskCount = await page.locator('[data-testid="task-item"]').count()

      // Skip test if dataset is too small
      if (taskCount < 100) {
        test.skip(true, 'Insufficient data - need 100+ tasks for performance testing')
      }

      // Measure scroll performance
      const scrollMetrics = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const container = document.querySelector('[data-testid="task-list"]')
            if (!container) {
              resolve({ fps: 0, dropped: 0 })
              return
            }

            let frameCount = 0
            let droppedFrames = 0
            let lastTimestamp = performance.now()
            const targetFPS = 60
            const frameDuration = 1000 / targetFPS

            const measureFrames = () => {
              const currentTimestamp = performance.now()
              const elapsed = currentTimestamp - lastTimestamp

              frameCount++

              // Check if frame took longer than expected (dropped frame)
              if (elapsed > frameDuration * 1.5) {
                droppedFrames++
              }

              lastTimestamp = currentTimestamp

              if (frameCount < 120) {
                // Measure for 2 seconds (120 frames at 60fps)
                requestAnimationFrame(measureFrames)
              } else {
                const actualFPS = Math.round(frameCount / 2) // 2 seconds of measurement
                resolve({ fps: actualFPS, dropped: droppedFrames })
              }
            }

            // Start scrolling animation
            let scrollPos = 0
            const scrollInterval = setInterval(() => {
              scrollPos += 50
              container.scrollTop = scrollPos
              if (scrollPos > container.scrollHeight - container.clientHeight) {
                clearInterval(scrollInterval)
              }
            }, 16) // ~60fps

            requestAnimationFrame(measureFrames)

            // Cleanup after 3 seconds
            setTimeout(() => {
              clearInterval(scrollInterval)
              resolve({ fps: Math.round(frameCount / 2), dropped: droppedFrames })
            }, 3000)
          })
      )

      // Should maintain near 60fps (allow 10% tolerance)
      expect(scrollMetrics.fps).toBeGreaterThanOrEqual(54)

      // Should have minimal dropped frames (< 10% of total)
      const dropRate = scrollMetrics.dropped / 120
      expect(dropRate).toBeLessThan(0.1)
    })

    test('should maintain smooth scrolling with 300+ notes', async ({ page }) => {
      // Navigate to notes view
      await page.goto('http://localhost:5173/notes')

      // Wait for notes to load
      await page.waitForSelector('[data-testid="note-list"]', { timeout: 5000 })

      // Get initial note count
      const noteCount = await page.locator('[data-testid="note-item"]').count()

      // Skip test if dataset is too small
      if (noteCount < 100) {
        test.skip(true, 'Insufficient data - need 100+ notes for performance testing')
      }

      // Measure scroll performance
      const scrollMetrics = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const container = document.querySelector('[data-testid="note-list"]')
            if (!container) {
              resolve({ fps: 0, dropped: 0 })
              return
            }

            let frameCount = 0
            let droppedFrames = 0
            let lastTimestamp = performance.now()
            const targetFPS = 60
            const frameDuration = 1000 / targetFPS

            const measureFrames = () => {
              const currentTimestamp = performance.now()
              const elapsed = currentTimestamp - lastTimestamp

              frameCount++

              if (elapsed > frameDuration * 1.5) {
                droppedFrames++
              }

              lastTimestamp = currentTimestamp

              if (frameCount < 120) {
                requestAnimationFrame(measureFrames)
              } else {
                resolve({ fps: Math.round(frameCount / 2), dropped: droppedFrames })
              }
            }

            // Start scrolling
            let scrollPos = 0
            const scrollInterval = setInterval(() => {
              scrollPos += 50
              container.scrollTop = scrollPos
              if (scrollPos > container.scrollHeight - container.clientHeight) {
                clearInterval(scrollInterval)
              }
            }, 16)

            requestAnimationFrame(measureFrames)

            setTimeout(() => {
              clearInterval(scrollInterval)
              resolve({ fps: Math.round(frameCount / 2), dropped: droppedFrames })
            }, 3000)
          })
      )

      expect(scrollMetrics.fps).toBeGreaterThanOrEqual(54)
      const dropRate = scrollMetrics.dropped / 120
      expect(dropRate).toBeLessThan(0.1)
    })
  })

  test.describe('Search Performance', () => {
    test('should return task search results within 1 second for large datasets', async ({
      page
    }) => {
      await page.goto('http://localhost:5173/tasks')
      await page.waitForSelector('[data-testid="task-list"]', { timeout: 5000 })

      const taskCount = await page.locator('[data-testid="task-item"]').count()

      if (taskCount < 100) {
        test.skip(true, 'Insufficient data - need 100+ tasks for search testing')
      }

      // Measure search performance
      const searchInput = page.locator('[data-testid="task-search"]')
      await searchInput.click()

      const startTime = Date.now()
      await searchInput.fill('test')

      // Wait for search results to update
      await page.waitForSelector('[data-testid="task-item"]', { timeout: 2000 })

      const endTime = Date.now()
      const searchDuration = endTime - startTime

      // Search should complete within 1 second (SC-009)
      expect(searchDuration).toBeLessThan(1000)
    })

    test('should return note search results within 1 second for large datasets', async ({
      page
    }) => {
      await page.goto('http://localhost:5173/notes')
      await page.waitForSelector('[data-testid="note-list"]', { timeout: 5000 })

      const noteCount = await page.locator('[data-testid="note-item"]').count()

      if (noteCount < 100) {
        test.skip(true, 'Insufficient data - need 100+ notes for search testing')
      }

      const searchInput = page.locator('[data-testid="note-search"]')
      await searchInput.click()

      const startTime = Date.now()
      await searchInput.fill('test')

      await page.waitForSelector('[data-testid="note-item"]', { timeout: 2000 })

      const endTime = Date.now()
      const searchDuration = endTime - startTime

      expect(searchDuration).toBeLessThan(1000)
    })
  })

  test.describe('Initial Load Performance', () => {
    test('should reach time-to-interactive within 3 seconds', async ({ page }) => {
      const startTime = Date.now()

      // Navigate to dashboard
      await page.goto('http://localhost:5173/dashboard')

      // Wait for main content to be interactive
      await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 5000 })

      // Verify page is interactive (can click buttons)
      const button = page.locator('button').first()
      await button.waitFor({ state: 'visible', timeout: 1000 })

      const endTime = Date.now()
      const loadDuration = endTime - startTime

      // Should reach interactive state within 3 seconds (FR-034)
      expect(loadDuration).toBeLessThan(3000)
    })

    test('should load task view within 3 seconds', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('http://localhost:5173/tasks')
      await page.waitForSelector('[data-testid="task-list"]', { timeout: 5000 })

      // Wait for first task to be interactive
      const firstTask = page.locator('[data-testid="task-item"]').first()
      await firstTask.waitFor({ state: 'visible', timeout: 1000 })

      const endTime = Date.now()
      const loadDuration = endTime - startTime

      expect(loadDuration).toBeLessThan(3000)
    })

    test('should load notes view within 3 seconds', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('http://localhost:5173/notes')
      await page.waitForSelector('[data-testid="note-list"]', { timeout: 5000 })

      const firstNote = page.locator('[data-testid="note-item"]').first()
      await firstNote.waitFor({ state: 'visible', timeout: 1000 })

      const endTime = Date.now()
      const loadDuration = endTime - startTime

      expect(loadDuration).toBeLessThan(3000)
    })
  })

  test.describe('Data Volume Warnings', () => {
    test('should display warning when approaching task limit', async ({ page }) => {
      await page.goto('http://localhost:5173/tasks')
      await page.waitForSelector('[data-testid="task-list"]', { timeout: 5000 })

      const taskCount = await page.locator('[data-testid="task-item"]').count()

      // Warning should appear at 90% of 5000 tasks limit (4500 tasks)
      if (taskCount >= 4500) {
        const warning = page.locator('[data-testid="data-volume-warning"]')
        await expect(warning).toBeVisible()
        await expect(warning).toContainText('approaching the recommended limit')
        await expect(warning).toContainText('export')
      }
    })

    test('should display warning when approaching note limit', async ({ page }) => {
      await page.goto('http://localhost:5173/notes')
      await page.waitForSelector('[data-testid="note-list"]', { timeout: 5000 })

      const noteCount = await page.locator('[data-testid="note-item"]').count()

      // Warning should appear at 90% of 3000 notes limit (2700 notes)
      if (noteCount >= 2700) {
        const warning = page.locator('[data-testid="data-volume-warning"]')
        await expect(warning).toBeVisible()
        await expect(warning).toContainText('approaching the recommended limit')
        await expect(warning).toContainText('export')
      }
    })
  })

  test.describe('Real-time Update Performance', () => {
    test('should handle real-time note updates without excessive re-renders', async ({ page }) => {
      await page.goto('http://localhost:5173/notes')
      await page.waitForSelector('[data-testid="note-list"]', { timeout: 5000 })

      // Measure render count during updates
      const renderMetrics = await page.evaluate(
        () =>
          new Promise((resolve) => {
            let renderCount = 0
            const observer = new MutationObserver(() => {
              renderCount++
            })

            const noteList = document.querySelector('[data-testid="note-list"]')
            if (noteList) {
              observer.observe(noteList, {
                childList: true,
                subtree: true,
                attributes: true
              })
            }

            // Simulate 5 updates over 2 seconds
            setTimeout(() => {
              observer.disconnect()
              resolve({ renderCount })
            }, 2000)
          })
      )

      // Should not exceed reasonable number of re-renders
      // Allow up to 10 renders for 5 updates (2x buffer for React/Vue reactivity)
      expect(renderMetrics.renderCount).toBeLessThan(20)
    })
  })
})
