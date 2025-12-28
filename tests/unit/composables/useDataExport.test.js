/**
 * Unit tests for useDataExport composable
 * T063: Test export orchestration with progress tracking
 *
 * Tests data fetching, progress tracking, export generation,
 * and download triggering for the data export feature (User Story 4)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataExport } from '@/composables/useDataExport'

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}))

// Mock export utilities
vi.mock('@/utils/export', () => ({
  generateJSON: vi.fn((data) => JSON.stringify({ data, metadata: {} })),
  generateCSV: vi.fn((_type, _data) => `id,title\n1,Test`),
  createZipArchive: vi.fn(async () => new Blob(['mock zip'], { type: 'application/zip' })),
  generateReadme: vi.fn(() => 'Mock README content')
}))

// Mock Supabase
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

describe('useDataExport Composable (T063)', () => {
  let exportComposable

  beforeEach(() => {
    setActivePinia(createPinia())

    // Reset all mocks
    vi.clearAllMocks()

    // Setup default mock responses
    mockSupabaseClient.from = vi.fn((_table) => ({
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

    exportComposable = useDataExport()
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      expect(exportComposable.isExporting.value).toBe(false)
      expect(exportComposable.progress.value).toBe(0)
      expect(exportComposable.currentStep.value).toBe('')
      expect(exportComposable.error.value).toBeNull()
    })
  })

  describe('fetchAllData', () => {
    it('should fetch all entity types from database', async () => {
      const mockData = {
        tasks: [{ id: '1', title: 'Task 1' }],
        notes: [{ id: '2', content: 'Note 1' }],
        topics: [{ id: '3', name: 'Topic 1' }]
      }

      mockSupabaseClient.from = vi.fn((table) => ({
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
      }))

      const result = await exportComposable.fetchAllData()

      expect(result).toHaveProperty('tasks')
      expect(result).toHaveProperty('notes')
      expect(result).toHaveProperty('topics')
      expect(result).toHaveProperty('meetings')
      expect(result).toHaveProperty('locations')
    })

    it('should update progress during data fetching', async () => {
      const progressUpdates = []

      // Capture progress updates
      vi.spyOn(exportComposable.progress, 'value', 'set').mockImplementation((val) => {
        progressUpdates.push(val)
      })

      await exportComposable.fetchAllData()

      // Progress should increase as entities are fetched
      expect(progressUpdates.length).toBeGreaterThan(0)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Database error' }
              })
            )
          }))
        }))
      }))

      await expect(exportComposable.fetchAllData()).rejects.toThrow('Database error')
    })

    it('should filter out null or undefined entities', async () => {
      mockSupabaseClient.from = vi.fn((table) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: table === 'tasks' ? [{ id: '1' }] : null,
                error: null
              })
            )
          }))
        }))
      }))

      const result = await exportComposable.fetchAllData()

      // Should only include tasks, others should be empty arrays
      expect(result.tasks).toHaveLength(1)
      expect(result.notes).toEqual([])
      expect(result.topics).toEqual([])
    })
  })

  describe('exportData', () => {
    it('should orchestrate complete export workflow', async () => {
      const { saveAs } = await import('file-saver')

      await exportComposable.exportData()

      expect(exportComposable.isExporting.value).toBe(false)
      expect(exportComposable.progress.value).toBe(100)
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/coordino-export-\d{4}-\d{2}-\d{2}\.zip/)
      )
    })

    it('should update current step throughout export', async () => {
      const steps = []

      Object.defineProperty(exportComposable.currentStep, 'value', {
        set: (val) => {
          steps.push(val)
        },
        get: () => steps[steps.length - 1] || ''
      })

      await exportComposable.exportData()

      expect(steps).toContain('Fetching data...')
      expect(steps).toContain('Generating JSON...')
      expect(steps).toContain('Generating CSV files...')
      expect(steps).toContain('Creating archive...')
      expect(steps).toContain('Export complete')
    })

    it('should reset isExporting flag after export completes', async () => {
      await exportComposable.exportData()

      // After export completes, flag should be false
      expect(exportComposable.isExporting.value).toBe(false)
    })

    it('should handle export errors and update error state', async () => {
      // Mock an error during ZIP creation
      const { createZipArchive } = await import('@/utils/export')
      createZipArchive.mockRejectedValueOnce(new Error('ZIP creation failed'))

      await expect(exportComposable.exportData()).rejects.toThrow()

      expect(exportComposable.error.value).toBeTruthy()
      expect(exportComposable.error.value).toContain('ZIP creation failed')
      expect(exportComposable.isExporting.value).toBe(false)
    })

    it('should generate filename with current date', async () => {
      const { saveAs } = await import('file-saver')

      const today = new Date().toISOString().split('T')[0]

      await exportComposable.exportData()

      expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), `coordino-export-${today}.zip`)
    })
  })

  describe('Progress Tracking', () => {
    it('should track progress from 0 to 100', async () => {
      const progressValues = []

      // Mock progress updates
      Object.defineProperty(exportComposable.progress, 'value', {
        set: (val) => {
          progressValues.push(val)
        },
        get: () => progressValues[progressValues.length - 1] || 0
      })

      await exportComposable.exportData()

      expect(Math.min(...progressValues)).toBe(0)
      expect(Math.max(...progressValues)).toBe(100)
    })

    it('should update progress incrementally', async () => {
      const progressValues = []

      Object.defineProperty(exportComposable.progress, 'value', {
        set: (val) => {
          progressValues.push(val)
        },
        get: () => progressValues[progressValues.length - 1] || 0
      })

      await exportComposable.exportData()

      // Progress should increase monotonically
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1])
      }
    })
  })

  describe('Large Dataset Handling (FR-019)', () => {
    it('should handle datasets with >1000 records', async () => {
      // Create large dataset
      const largeTasks = Array.from({ length: 1500 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`
      }))

      mockSupabaseClient.from = vi.fn((table) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: table === 'tasks' ? largeTasks : [],
                error: null
              })
            )
          }))
        }))
      }))

      const startTime = Date.now()
      await exportComposable.exportData()
      const duration = Date.now() - startTime

      // Should complete within reasonable time (< 30 seconds as per SC-005)
      expect(duration).toBeLessThan(30000)
    })

    it('should chunk large datasets for processing', async () => {
      const largeTasks = Array.from({ length: 2000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`
      }))

      mockSupabaseClient.from = vi.fn((table) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: table === 'tasks' ? largeTasks : [],
                error: null
              })
            )
          }))
        }))
      }))

      // Should not throw or timeout
      await expect(exportComposable.exportData()).resolves.not.toThrow()
    })
  })

  describe('resetState', () => {
    it('should reset all state to initial values', () => {
      exportComposable.isExporting.value = true
      exportComposable.progress.value = 50
      exportComposable.currentStep.value = 'Processing...'
      exportComposable.error.value = 'Error'

      exportComposable.resetState()

      expect(exportComposable.isExporting.value).toBe(false)
      expect(exportComposable.progress.value).toBe(0)
      expect(exportComposable.currentStep.value).toBe('')
      expect(exportComposable.error.value).toBeNull()
    })
  })

  describe('Error Recovery', () => {
    it('should allow retry after error', async () => {
      const { createZipArchive } = await import('@/utils/export')

      // Fail first, succeed second
      createZipArchive
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Blob(['success'], { type: 'application/zip' }))

      // First attempt fails
      await expect(exportComposable.exportData()).rejects.toThrow()
      expect(exportComposable.error.value).toBeTruthy()

      // Reset and retry
      exportComposable.resetState()

      // Second attempt succeeds
      await expect(exportComposable.exportData()).resolves.not.toThrow()
      expect(exportComposable.error.value).toBeNull()
    })
  })
})
