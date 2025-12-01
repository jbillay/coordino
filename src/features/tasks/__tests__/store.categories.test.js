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

describe('Task Store - Category Operations', () => {
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

  describe('fetchCategories', () => {
    it('fetches categories successfully', async () => {
      const mockCategories = [{ id: 1, name: 'Personal' }]
      order.mockResolvedValue({ data: mockCategories, error: null })
      const store = useTaskStore()
      await store.fetchCategories()
      expect(store.categories).toEqual(mockCategories)
    })

    it('handles fetch error', async () => {
      const mockError = { message: 'Fetch error' }
      order.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      await store.fetchCategories()
      expect(store.error).toBeDefined()
    })
  })

  describe('createCategory', () => {
    it('creates a category successfully', async () => {
      const newCategory = { name: 'New Category' }
      const createdCategory = { id: 2, ...newCategory }
      single.mockResolvedValue({ data: createdCategory, error: null })
      const store = useTaskStore()
      const result = await store.createCategory(newCategory)
      expect(result.success).toBe(true)
      expect(store.categories).toContainEqual(createdCategory)
    })

    it('handles create error', async () => {
      const mockError = { message: 'Create error' }
      single.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      const result = await store.createCategory({ name: 'New Category' })
      expect(result.success).toBe(false)
    })
  })

  describe('updateCategory', () => {
    it('updates a category successfully', async () => {
      const updatedCategory = { id: 1, name: 'Updated Category' }
      single.mockResolvedValue({ data: updatedCategory, error: null })
      const store = useTaskStore()
      store.categories = [{ id: 1, name: 'Old Category' }]
      const result = await store.updateCategory(1, { name: 'Updated Category' })
      expect(result.success).toBe(true)
      expect(store.categories[0]).toEqual(updatedCategory)
    })

    it('handles update error', async () => {
      const mockError = { message: 'Update error' }
      single.mockResolvedValue({ data: null, error: mockError })
      const store = useTaskStore()
      const result = await store.updateCategory(1, { name: 'Updated Category' })
      expect(result.success).toBe(false)
    })
  })

  describe('deleteCategory', () => {
    it('deletes a category successfully', async () => {
      deleteFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
      const store = useTaskStore()
      store.categories = [{ id: 1, name: 'Category 1' }]
      const result = await store.deleteCategory(1)
      expect(result.success).toBe(true)
      expect(store.categories).toHaveLength(0)
    })

    it('handles delete error', async () => {
      const mockError = { message: 'Delete error' }
      deleteFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: mockError }) })
      const store = useTaskStore()
      const result = await store.deleteCategory(1)
      expect(result.success).toBe(false)
    })
  })
})
