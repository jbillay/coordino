import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../store'

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

describe('Task Store - Status Operations', () => {
  let from, select, order, insert, update, deleteFn, single

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    deleteFn = vi.fn()
    single = vi.fn()
    order = vi.fn()
    update = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single })) })) }))
    insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }))
    select = vi.fn(() => ({ order }))
    from = vi.fn(() => ({ select, insert, update, delete: deleteFn }))
    mockSupabase.from = from
  })

  describe('fetchStatuses', () => {
    it('fetches statuses successfully', async () => {
      const mockStatuses = [{ id: 1, name: 'Open' }]
      order.mockResolvedValue({ data: mockStatuses, error: null })
      const store = useTaskStore()
      await store.fetchStatuses()
      expect(store.statuses).toEqual(mockStatuses)
    })

    it('handles fetch error', async () => {
      const mockError = { message: 'Fetch error' }
      order.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      await store.fetchStatuses()
      expect(store.error).toBeDefined()
    })
  })

  describe('createStatus', () => {
    it('creates a status successfully', async () => {
      const newStatus = { name: 'New Status' }
      const createdStatus = { id: 2, ...newStatus }
      single.mockResolvedValue({ data: createdStatus, error: null })
      const store = useTaskStore()
      const result = await store.createStatus(newStatus)
      expect(result.success).toBe(true)
      expect(store.statuses).toContainEqual(createdStatus)
    })

    it('handles create error', async () => {
      const mockError = { message: 'Create error' }
      single.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      const result = await store.createStatus({ name: 'New Status' })
      expect(result.success).toBe(false)
    })
  })

  describe('updateStatus', () => {
    it('updates a status successfully', async () => {
      const updatedStatus = { id: 1, name: 'Updated Status' }
      single.mockResolvedValue({ data: updatedStatus, error: null })
      const store = useTaskStore()
      store.statuses = [{ id: 1, name: 'Old Status' }]
      const result = await store.updateStatus(1, { name: 'Updated Status' })
      expect(result.success).toBe(true)
      expect(store.statuses[0]).toEqual(updatedStatus)
    })

    it('handles update error', async () => {
      const mockError = { message: 'Update error' }
      single.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      const result = await store.updateStatus(1, { name: 'Updated Status' })
      expect(result.success).toBe(false)
    })
  })

  describe('deleteStatus', () => {
    it('deletes a status successfully', async () => {
      deleteFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
      const store = useTaskStore()
      store.statuses = [{ id: 1, name: 'Status 1' }]
      const result = await store.deleteStatus(1)
      expect(result.success).toBe(true)
      expect(store.statuses).toHaveLength(0)
    })

    it('handles delete error', async () => {
      const mockError = { message: 'Delete error' }
      deleteFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: mockError }) })
      const store = useTaskStore()
      const result = await store.deleteStatus(1)
      expect(result.success).toBe(false)
    })
  })
})
