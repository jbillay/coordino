/**
 * Unit Tests for Task Store
 * Tests state management and computed properties
 * Note: CRUD operations require Supabase integration testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../store'

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true
  }))
}))

// Mock useSupabase
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: vi.fn(() => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve) => resolve({ data: [], error: null, count: 0 }))
      })),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      })),
      removeChannel: vi.fn()
    }
  }))
}))

describe('useTaskStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTaskStore()
  })

  describe('Initial State', () => {
    it('initializes with empty tasks array', () => {
      expect(store.tasks).toEqual([])
    })

    it('initializes with empty statuses array', () => {
      expect(store.statuses).toEqual([])
    })

    it('initializes with empty categories array', () => {
      expect(store.categories).toEqual([])
    })

    it('initializes with loading false', () => {
      expect(store.loading).toBe(false)
    })

    it('initializes with null error', () => {
      expect(store.error).toBe(null)
    })

    it('initializes with correct pagination state', () => {
      expect(store.pageSize).toBe(50)
      expect(store.currentPage).toBe(1)
      expect(store.totalTasks).toBe(0)
      expect(store.hasMore).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      store.tasks = [
        { id: 1, title: 'Active Task 1', completed_at: null },
        { id: 2, title: 'Completed Task', completed_at: '2024-01-01T00:00:00Z' },
        { id: 3, title: 'Active Task 2', completed_at: null },
        { id: 4, title: 'Another Completed', completed_at: '2024-01-02T00:00:00Z' }
      ]
    })

    it('activeTasks returns only non-completed tasks', () => {
      const active = store.activeTasks
      expect(active).toHaveLength(2)
      expect(active.every((t) => !t.completed_at)).toBe(true)
      expect(active.map((t) => t.id)).toEqual([1, 3])
    })

    it('completedTasks returns only completed tasks', () => {
      const completed = store.completedTasks
      expect(completed).toHaveLength(2)
      expect(completed.every((t) => t.completed_at)).toBe(true)
      expect(completed.map((t) => t.id)).toEqual([2, 4])
    })

    it('activeTasks updates when tasks change', () => {
      expect(store.activeTasks).toHaveLength(2)

      // Add a new active task
      store.tasks.push({ id: 5, title: 'New Active', completed_at: null })
      expect(store.activeTasks).toHaveLength(3)
    })

    it('handles empty tasks array', () => {
      store.tasks = []
      expect(store.activeTasks).toHaveLength(0)
      expect(store.completedTasks).toHaveLength(0)
    })
  })

  describe('defaultStatus Computed', () => {
    it('returns the default Open status', () => {
      store.statuses = [
        { id: 1, name: 'In Progress', is_default: false },
        { id: 2, name: 'Open', is_default: true },
        { id: 3, name: 'Done', is_default: false }
      ]

      const { defaultStatus } = store
      expect(defaultStatus).toBeDefined()
      expect(defaultStatus.name).toBe('Open')
      expect(defaultStatus.is_default).toBe(true)
      expect(defaultStatus.id).toBe(2)
    })

    it('returns undefined when no default exists', () => {
      store.statuses = [
        { id: 1, name: 'Open', is_default: false },
        { id: 2, name: 'Done', is_default: false }
      ]

      expect(store.defaultStatus).toBeUndefined()
    })

    it('returns undefined when statuses array is empty', () => {
      store.statuses = []
      expect(store.defaultStatus).toBeUndefined()
    })

    it('returns first default status when multiple defaults exist', () => {
      store.statuses = [
        { id: 1, name: 'Open', is_default: true },
        { id: 2, name: 'Todo', is_default: true }
      ]

      const { defaultStatus } = store
      expect(defaultStatus.id).toBe(1)
    })
  })

  describe('State Mutations', () => {
    it('can directly set tasks', () => {
      const newTasks = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ]
      store.tasks = newTasks
      expect(store.tasks).toEqual(newTasks)
    })

    it('can directly set statuses', () => {
      const newStatuses = [{ id: 1, name: 'Open' }]
      store.statuses = newStatuses
      expect(store.statuses).toEqual(newStatuses)
    })

    it('can directly set categories', () => {
      const newCategories = [{ id: 1, name: 'Work' }]
      store.categories = newCategories
      expect(store.categories).toEqual(newCategories)
    })

    it('can set loading state', () => {
      store.loading = true
      expect(store.loading).toBe(true)

      store.loading = false
      expect(store.loading).toBe(false)
    })

    it('can set error state', () => {
      const error = { message: 'Test error' }
      store.error = error
      expect(store.error).toEqual(error)

      store.error = null
      expect(store.error).toBeNull()
    })

    it('can update pagination state', () => {
      store.currentPage = 2
      store.totalTasks = 100
      store.hasMore = false

      expect(store.currentPage).toBe(2)
      expect(store.totalTasks).toBe(100)
      expect(store.hasMore).toBe(false)
    })
  })
})
