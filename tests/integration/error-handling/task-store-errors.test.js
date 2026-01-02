/**
 * Integration tests for Task Store Error Handling
 * Feature: US8 - Comprehensive Error Handling
 *
 * Tests error handling in task operations including:
 * - Database constraint violations (23502, 23503, PGRST116)
 * - Network errors
 * - Permission errors
 * - Validation errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../../../src/features/tasks/store.js'
import { TASK_ERRORS } from '../../../src/utils/errors.js'

// Mock Supabase composable
let mockFromReturn = null

const mockSupabase = {
  from: vi.fn(() => {
    if (mockFromReturn) {
      return mockFromReturn
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))
    }
  })
}

const setMockFromReturn = (returnValue) => {
  mockFromReturn = returnValue
}

const resetMockFromReturn = () => {
  mockFromReturn = null
}

vi.mock('../../../src/composables/useSupabase.js', () => ({
  useSupabase: () => ({ supabase: mockSupabase })
}))

vi.mock('../../../src/stores/auth.js', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-123' }
  }))
}))

describe('Task Store Error Handling Integration', () => {
  let taskStore

  beforeEach(() => {
    setActivePinia(createPinia())
    taskStore = useTaskStore()
    resetMockFromReturn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchTasks - Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      setMockFromReturn({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn().mockRejectedValue(new Error('Network request failed'))
          }))
        }))
      })

      await taskStore.fetchTasks()

      expect(taskStore.error).toBe(TASK_ERRORS.NETWORK_ERROR)
    })

    it('should handle permission denied errors', async () => {
      setMockFromReturn({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'permission denied for table tasks' }
            })
          }))
        }))
      })

      await taskStore.fetchTasks()

      expect(taskStore.error).toBe(TASK_ERRORS.FETCH_PERMISSION_DENIED)
    })

    it('should handle generic fetch errors', async () => {
      setMockFromReturn({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Unknown database error' }
            })
          }))
        }))
      })

      await taskStore.fetchTasks()

      expect(taskStore.error).toBe(TASK_ERRORS.FETCH_FAILED)
    })
  })

  describe('createTask - Error Handling', () => {
    it('should handle missing title (23502 - null constraint)', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23502',
                message: 'null value in column "title" violates not-null constraint'
              }
            })
          }))
        }))
      })

      const result = await taskStore.createTask({ description: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.CREATE_MISSING_TITLE)
    })

    it('should handle invalid status reference (23503 - foreign key)', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23503',
                message:
                  'insert or update on table "tasks" violates foreign key constraint "tasks_status_id_fkey"'
              }
            })
          }))
        }))
      })

      const result = await taskStore.createTask({
        title: 'Test Task',
        status_id: 'invalid-uuid'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.CREATE_INVALID_STATUS)
    })

    it('should handle invalid category reference (23503 - foreign key)', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23503',
                message:
                  'insert or update on table "tasks" violates foreign key constraint "tasks_category_id_fkey"'
              }
            })
          }))
        }))
      })

      const result = await taskStore.createTask({
        title: 'Test Task',
        category_id: 'invalid-uuid'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.CREATE_INVALID_CATEGORY)
    })

    it('should handle permission denied errors', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'permission denied for table tasks' }
            })
          }))
        }))
      })

      const result = await taskStore.createTask({ title: 'Test Task' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.CREATE_PERMISSION_DENIED)
    })

    it('should increment totalTasks on successful creation', async () => {
      const initialCount = taskStore.totalTasks

      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'task-1',
                title: 'Test Task',
                user_id: 'user-123',
                created_at: new Date().toISOString()
              },
              error: null
            })
          }))
        }))
      })

      const result = await taskStore.createTask({ title: 'Test Task' })

      expect(result.success).toBe(true)
      expect(taskStore.totalTasks).toBe(initialCount + 1)
    })
  })

  describe('updateTask - Error Handling', () => {
    it('should handle task not found (PGRST116)', async () => {
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            }))
          }))
        }))
      })

      const result = await taskStore.updateTask('non-existent-id', { title: 'Updated' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.UPDATE_NOT_FOUND)
    })

    it('should handle constraint violations during update', async () => {
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '23503',
                  message: 'violates foreign key constraint "tasks_status_id_fkey"'
                }
              })
            }))
          }))
        }))
      })

      const result = await taskStore.updateTask('task-1', { status_id: 'invalid' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.UPDATE_INVALID_STATUS)
    })

    it('should handle network errors during update', async () => {
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockRejectedValue(new Error('Network timeout'))
            }))
          }))
        }))
      })

      const result = await taskStore.updateTask('task-1', { title: 'Updated' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.NETWORK_ERROR)
    })
  })

  describe('deleteTask - Error Handling', () => {
    beforeEach(() => {
      taskStore.tasks = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' }
      ]
      taskStore.totalTasks = 2
    })

    it('should handle task not found during deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'PGRST116' }
          })
        }))
      })

      const result = await taskStore.deleteTask('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.DELETE_NOT_FOUND)
    })

    it('should handle permission denied during deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'permission denied' }
          })
        }))
      })

      const result = await taskStore.deleteTask('task-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.DELETE_PERMISSION_DENIED)
    })

    it('should decrement totalTasks on successful deletion', async () => {
      const initialCount = taskStore.totalTasks

      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })

      const result = await taskStore.deleteTask('task-1')

      expect(result.success).toBe(true)
      expect(taskStore.totalTasks).toBe(initialCount - 1)
      expect(taskStore.tasks.find((t) => t.id === 'task-1')).toBeUndefined()
    })

    it('should handle network errors during deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockRejectedValue(new Error('Network error'))
        }))
      })

      const result = await taskStore.deleteTask('task-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe(TASK_ERRORS.NETWORK_ERROR)
    })
  })

  describe('Error Recovery', () => {
    it('should maintain store consistency after failed operations', async () => {
      const initialTasks = [...taskStore.tasks]
      const initialCount = taskStore.totalTasks

      // Attempt failed creation
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23502' }
            })
          }))
        }))
      })

      await taskStore.createTask({ description: 'Missing title' })

      // Store should remain unchanged
      expect(taskStore.tasks).toEqual(initialTasks)
      expect(taskStore.totalTasks).toBe(initialCount)
    })

    it('should handle multiple sequential operations correctly', async () => {
      const initialTasks = [...taskStore.tasks]

      // First operation fails
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Error' }
            })
          }))
        }))
      })

      const createResult = await taskStore.createTask({ title: 'Test' })
      expect(createResult.success).toBe(false)

      // Tasks should remain unchanged after failed create
      expect(taskStore.tasks).toEqual(initialTasks)

      // Second operation succeeds
      resetMockFromReturn()
      const newTask = { id: 'task-2', title: 'New Task' }
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: newTask,
              error: null
            })
          }))
        }))
      })

      const createResult2 = await taskStore.createTask({ title: 'New Task' })
      // Should succeed
      expect(createResult2.success).toBe(true)
      expect(taskStore.tasks[0]).toEqual(newTask)
    })
  })
})
