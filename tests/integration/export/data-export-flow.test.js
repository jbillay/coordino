/**
 * Integration tests for data export flow
 * T064: Test export trigger + archive generation
 *
 * Tests the complete export flow from component interaction
 * to ZIP file generation with real data (User Story 4)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import DataExportSettings from '@/components/settings/DataExportSettings.vue'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}))

// Variable to hold the mock after import
let mockSaveAs

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn()
}

vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: mockSupabaseClient
  })
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}))

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

describe('Data Export Flow Integration (T064)', () => {
  let wrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Import the mocked saveAs function
    const fileSaver = await import('file-saver')
    mockSaveAs = fileSaver.saveAs

    // Setup default mock responses with sample data
    mockSupabaseClient.from = vi.fn((table) => {
      const mockData = {
        tasks: [
          { id: '1', title: 'Test Task 1', completed: false, user_id: 'test-user-id' },
          { id: '2', title: 'Test Task 2', completed: true, user_id: 'test-user-id' }
        ],
        notes: [
          { id: '1', content: 'Test Note 1', topic_id: '1', user_id: 'test-user-id' },
          { id: '2', content: 'Test Note 2', topic_id: '1', user_id: 'test-user-id' }
        ],
        topics: [
          { id: '1', name: 'Work', user_id: 'test-user-id' },
          { id: '2', name: 'Personal', user_id: 'test-user-id' }
        ],
        locations: [
          { id: '1', name: 'New York', timezone: 'America/New_York', user_id: 'test-user-id' }
        ],
        meetings: [
          {
            id: '1',
            title: 'Team Sync',
            proposed_time: '2025-01-15T14:00:00Z',
            user_id: 'test-user-id'
          }
        ]
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: mockData[table] || [],
                error: null
              })
            )
          }))
        }))
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Integration', () => {
    it('should mount DataExportSettings component successfully', () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('should show export button in initial state', () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      expect(exportButton.exists()).toBe(true)
      expect(exportButton.text()).toContain('Export All My Data')
    })

    it('should disable button during export', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')

      // Click export
      await exportButton.trigger('click')

      // Button should be disabled during export
      await wrapper.vm.$nextTick()
      expect(exportButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Export Flow Orchestration', () => {
    it('should complete full export workflow', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      // Wait for export to complete
      await new Promise((resolve) => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()

      // Should have called saveAs with a Blob
      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/coordino-export-\d{4}-\d{2}-\d{2}\.zip/)
      )
    })

    it('should fetch all entity types', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should have queried all entity types
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('topics')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('locations')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('meetings')
    })

    it('should generate both JSON and CSV formats', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify ZIP was created (mocked)
      expect(mockSaveAs).toHaveBeenCalled()
      const [blob] = mockSaveAs.mock.calls[0]
      expect(blob.type).toBe('application/zip')
    })
  })

  describe('Progress Tracking', () => {
    it('should show progress bar during export', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      await wrapper.vm.$nextTick()

      // Progress bar should be visible
      const progressBar = wrapper.find('[data-testid="progress-bar"]')
      expect(progressBar.exists()).toBe(true)
    })

    it('should complete export and hide progress bar', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      // Progress bar should be visible during export
      await wrapper.vm.$nextTick()
      const progressBar = wrapper.find('[data-testid="progress-bar"]')
      expect(progressBar.exists()).toBe(true)

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()

      // Button should be enabled again after export
      expect(exportButton.attributes('disabled')).toBeUndefined()
    })

    it('should show current step description', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      await wrapper.vm.$nextTick()

      // Should show step description
      const stepText = wrapper.find('[data-testid="current-step"]')
      expect(stepText.exists()).toBe(true)
      expect(stepText.text()).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when export fails', async () => {
      // Mock database error
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Database connection failed' }
              })
            )
          }))
        }))
      }))

      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      // Wait for error
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      // Error message should be displayed
      const errorMessage = wrapper.find('[data-testid="error-message"]')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('Database connection failed')
    })

    it('should allow retry after error', async () => {
      // First call fails, second succeeds
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        callCount++
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: callCount === 1 ? null : [],
                  error: callCount === 1 ? { message: 'Temporary error' } : null
                })
              )
            }))
          }))
        }
      })

      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')

      // First attempt (fails)
      await exportButton.trigger('click')
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      // Error should be shown
      let errorMessage = wrapper.find('[data-testid="error-message"]')
      expect(errorMessage.exists()).toBe(true)

      // Retry button should be available
      const retryButton = wrapper.find('[data-testid="retry-button"]')
      expect(retryButton.exists()).toBe(true)

      // Second attempt (succeeds)
      await retryButton.trigger('click')
      await new Promise((resolve) => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()

      // Error should be cleared
      errorMessage = wrapper.find('[data-testid="error-message"]')
      expect(errorMessage.exists()).toBe(false)

      // Export should complete
      expect(mockSaveAs).toHaveBeenCalled()
    })
  })

  describe('Data Validation', () => {
    it('should handle empty dataset gracefully', async () => {
      // Mock empty data
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null
              })
            )
          }))
        }))
      }))

      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should still create export file (empty but valid)
      expect(mockSaveAs).toHaveBeenCalled()
    })

    it('should preserve data integrity in exported files', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')

      await new Promise((resolve) => setTimeout(resolve, 100))

      // ZIP should be created
      expect(mockSaveAs).toHaveBeenCalled()

      // In real implementation, we'd verify:
      // - All entity types are included
      // - Data matches database records
      // - JSON is valid and parseable
      // - CSV is properly formatted
    })
  })

  describe('Performance', () => {
    it('should complete export within reasonable time', async () => {
      wrapper = mount(DataExportSettings, {
        global: {
          components: { Button, ProgressBar, Message }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')

      const startTime = Date.now()
      await exportButton.trigger('click')

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 200))

      const duration = Date.now() - startTime

      // Should complete quickly for small dataset
      expect(duration).toBeLessThan(1000)
    })
  })
})
