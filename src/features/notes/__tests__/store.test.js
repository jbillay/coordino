import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '../store'

// Mock Supabase
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          is: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        })),
        order: vi.fn(() => ({
          data: [],
          error: null
        })),
        is: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '123',
              title: 'Test Note',
              content: 'Content',
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: '123', title: 'Updated Note' },
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  })
}))

describe('Notes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initial State', () => {
    it('should have empty notes array', () => {
      const store = useNotesStore()
      expect(store.notes).toEqual([])
    })

    it('should have empty topics array', () => {
      const store = useNotesStore()
      expect(store.topics).toEqual([])
    })

    it('should not be loading initially', () => {
      const store = useNotesStore()
      expect(store.loading).toBe(false)
    })

    it('should have no error initially', () => {
      const store = useNotesStore()
      expect(store.error).toBeNull()
    })

    it('should have no selected topic', () => {
      const store = useNotesStore()
      expect(store.selectedTopicId).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should return filtered notes when no topic is selected', () => {
      const store = useNotesStore()
      store.notes = [
        { id: '1', title: 'Note 1', archived_at: null },
        { id: '2', title: 'Note 2', archived_at: new Date().toISOString() }
      ]

      expect(store.filteredNotes).toHaveLength(1)
      expect(store.filteredNotes[0].id).toBe('1')
    })

    it('should return pinned notes', () => {
      const store = useNotesStore()
      store.notes = [
        { id: '1', title: 'Note 1', is_pinned: true, archived_at: null },
        { id: '2', title: 'Note 2', is_pinned: false, archived_at: null }
      ]

      expect(store.pinnedNotes).toHaveLength(1)
      expect(store.pinnedNotes[0].id).toBe('1')
    })

    it('should return recent notes sorted by updated_at', () => {
      const store = useNotesStore()
      const now = new Date()
      const earlier = new Date(now.getTime() - 1000 * 60 * 60)

      store.notes = [
        { id: '1', title: 'Old Note', updated_at: earlier.toISOString(), archived_at: null },
        { id: '2', title: 'New Note', updated_at: now.toISOString(), archived_at: null }
      ]

      const recent = store.recentNotes
      expect(recent[0].id).toBe('2')
      expect(recent[1].id).toBe('1')
    })

    it('should count active notes correctly', () => {
      const store = useNotesStore()
      store.notes = [
        { id: '1', archived_at: null },
        { id: '2', archived_at: null },
        { id: '3', archived_at: new Date().toISOString() }
      ]

      expect(store.activeNotesCount).toBe(2)
    })
  })
})
