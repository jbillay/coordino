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

describe('Task Store - Pagination Operations', () => {
  let from, select, order, range

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    range = vi.fn()
    order = vi.fn(() => ({ range }))
    select = vi.fn(() => ({ order }))
    from = vi.fn(() => ({ select }))
    mockSupabase.from = from
  })

  describe('loadMoreTasks', () => {
    it('does not fetch if already loading', async () => {
      const store = useTaskStore()
      store.loading = true
      await store.loadMoreTasks()
      expect(range).not.toHaveBeenCalled()
    })

    it('does not fetch if there are no more tasks', async () => {
      const store = useTaskStore()
      store.hasMore = false
      await store.loadMoreTasks()
      expect(range).not.toHaveBeenCalled()
    })

    it('fetches the next page of tasks', async () => {
      const store = useTaskStore()
      store.currentPage = 1
      store.hasMore = true
      range.mockResolvedValue({ data: [], error: null, count: 100 })
      await store.loadMoreTasks()
      expect(range).toHaveBeenCalledWith(50, 99)
    })
  })

  describe('resetPagination', () => {
    it('resets pagination and fetches the first page', async () => {
      const store = useTaskStore()
      store.currentPage = 3
      range.mockResolvedValue({ data: [], error: null, count: 100 })
      await store.resetPagination()
      expect(store.currentPage).toBe(1)
      expect(range).toHaveBeenCalledWith(0, 49)
    })
  })
})
