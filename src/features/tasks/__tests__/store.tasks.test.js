import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../store'
import { mapSupabaseError } from '@/utils/errors'

// Mock dependencies
const mockSupabase = {
  from: vi.fn()
}
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({ supabase: mockSupabase })
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '123' }
  }))
}))

describe('Task Store - Task Operations', () => {
  let from, select, order, range, insert, update, deleteFn, single

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    deleteFn = vi.fn()
    single = vi.fn()
    range = vi.fn()
    order = vi.fn(() => ({ range }))
    update = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single })) })) }))
    insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }))
    select = vi.fn(() => ({ order }))
    from = vi.fn(() => ({ select, insert, update, delete: deleteFn }))
    mockSupabase.from = from
  })

  describe('fetchTasks', () => {
    it('fetches tasks successfully', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }]
      range.mockResolvedValue({ data: mockTasks, error: null, count: 1 })
      const store = useTaskStore()
      await store.fetchTasks()
      expect(store.tasks).toEqual(mockTasks)
      expect(store.totalTasks).toBe(1)
    })

    it('handles fetch error', async () => {
      const mockError = { message: 'Fetch error' }
      range.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      await store.fetchTasks()
      expect(store.error).toBe(mapSupabaseError(mockError, 'tasks'))
    })
  })

  describe('createTask', () => {
    it('creates a task successfully', async () => {
      const newTask = { title: 'New Task' }
      const createdTask = { id: 2, ...newTask }
      single.mockResolvedValue({ data: createdTask, error: null })
      const store = useTaskStore()
      const result = await store.createTask(newTask)
      expect(result.success).toBe(true)
      expect(store.tasks[0]).toEqual(createdTask)
    })

    it('handles create error', async () => {
      const mockError = { message: 'Create error' }
      single.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      const result = await store.createTask({ title: 'New Task' })
      expect(result.success).toBe(false)
    })
  })

  describe('updateTask', () => {
    it('updates a task successfully', async () => {
      const updatedTask = { id: 1, title: 'Updated Task' }
      single.mockResolvedValue({ data: updatedTask, error: null })
      const store = useTaskStore()
      store.tasks = [{ id: 1, title: 'Task 1' }]
      const result = await store.updateTask(1, { title: 'Updated Task' })
      expect(result.success).toBe(true)
      expect(store.tasks[0]).toEqual(updatedTask)
    })

    it('handles update error', async () => {
      const mockError = { message: 'Update error' }
      single.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      const result = await store.updateTask(1, { title: 'Updated Task' })
      expect(result.success).toBe(false)
    })
  })

  describe('completeTask and reopenTask', () => {
    it('completes a task', async () => {
      single.mockResolvedValue({ data: {}, error: null })
      const store = useTaskStore()
      await store.completeTask(1)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ completed_at: expect.any(String) })
      )
    })

    it('reopens a task', async () => {
      single.mockResolvedValue({ data: {}, error: null })
      const store = useTaskStore()
      await store.reopenTask(1)
      expect(update).toHaveBeenCalledWith({ completed_at: null })
    })
  })

  describe('deleteTask', () => {
    it('deletes a task successfully', async () => {
      deleteFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
      const store = useTaskStore()
      store.tasks = [{ id: 1, title: 'Task 1' }]
      const result = await store.deleteTask(1)
      expect(result.success).toBe(true)
      expect(store.tasks).toHaveLength(0)
    })

    it('handles delete error', async () => {
      const mockError = { message: 'Delete error' }
      deleteFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: mockError }) })
      const store = useTaskStore()
      const result = await store.deleteTask(1)
      expect(result.success).toBe(false)
    })
  })
})
