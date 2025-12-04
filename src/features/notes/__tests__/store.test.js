import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '../store'
import { useAuthStore } from '@/stores/auth'

// Mock Supabase and logger
const from = vi.fn()
const mockSupabase = { from }

vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({ supabase: mockSupabase })
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

describe('Notes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const authStore = useAuthStore()
    authStore.user = { id: 'user-123' }
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

  describe('Actions', () => {
    describe('fetchTopics', () => {
      it('should fetch topics and update state on success', async () => {
        const store = useNotesStore()
        const mockTopics = [{ id: 't1', name: 'Topic 1', notes: [1, 2] }]
        const order = vi.fn().mockResolvedValue({ data: mockTopics, error: null })
        const select = vi.fn(() => ({ order }))
        from.mockReturnValue({ select })

        await store.fetchTopics()

        expect(store.loading).toBe(false)
        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].name).toBe('Topic 1')
        expect(store.topics[0].note_count).toBe(2)
      })

      it('should set error state on fetch failure', async () => {
        const store = useNotesStore()
        const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } })
        const select = vi.fn(() => ({ order }))
        from.mockReturnValue({ select })

        await store.fetchTopics()

        expect(store.loading).toBe(false)
        expect(store.error).toBe('Fetch error')
        expect(store.topics).toEqual([])
      })
    })

    describe('createTopic', () => {
      it('should create a topic and add it to the store', async () => {
        const store = useNotesStore()
        const newTopic = { name: 'New Topic', color: '#ff0000' }
        const mockTopic = { id: 't2', ...newTopic }
        const single = vi.fn().mockResolvedValue({ data: mockTopic, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        from.mockReturnValue({ insert })

        const result = await store.createTopic(newTopic)

        expect(result.success).toBe(true)
        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].name).toBe('New Topic')
      })

      it('should return error on create failure', async () => {
        const store = useNotesStore()
        const newTopic = { name: 'New Topic' }
        const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Create error' } })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        from.mockReturnValue({ insert })

        const result = await store.createTopic(newTopic)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Create error')
        expect(store.topics).toHaveLength(0)
      })
    })

    describe('updateTopic', () => {
      it('should update a topic in the store', async () => {
        const store = useNotesStore()
        store.topics = [{ id: 't1', name: 'Original Topic' }]
        const updatedTopic = { name: 'Updated Topic' }
        const single = vi
          .fn()
          .mockResolvedValue({ data: { id: 't1', ...updatedTopic }, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        from.mockReturnValue({ update })

        const result = await store.updateTopic('t1', updatedTopic)

        expect(result.success).toBe(true)
        expect(store.topics[0].name).toBe('Updated Topic')
      })
    })

    describe('deleteTopic', () => {
      it('should delete a topic and associated notes from the store', async () => {
        const store = useNotesStore()
        store.topics = [{ id: 't1', name: 'Topic 1' }]
        store.notes = [
          { id: 'n1', topic_id: 't1' },
          { id: 'n2', topic_id: 't2' }
        ]
        store.selectedTopicId = 't1'
        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        from.mockReturnValue({ delete: del })

        const result = await store.deleteTopic('t1')

        expect(result.success).toBe(true)
        expect(store.topics).toHaveLength(0)
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].topic_id).toBe('t2')
        expect(store.selectedTopicId).toBeNull()
      })
    })

    describe('fetchNotes', () => {
      it('should fetch notes and update state on success', async () => {
        const store = useNotesStore()
        const mockNotes = [{ id: 'n1', title: 'Note 1' }]
        const query = { data: mockNotes, error: null }
        const order = vi.fn().mockResolvedValue(query)
        const select = vi.fn(() => ({ order }))
        from.mockReturnValue({ select })

        await store.fetchNotes()

        expect(store.loading).toBe(false)
        expect(store.notes).toEqual(mockNotes)
      })
    })

    describe('createNote', () => {
      it('should create a note and add it to the store', async () => {
        const store = useNotesStore()
        const newNote = { title: 'New Note', content: 'Content', topic_id: 't1' }
        const single = vi.fn().mockResolvedValue({ data: { id: 'n1', ...newNote }, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        from.mockReturnValue({ insert })

        const result = await store.createNote(newNote)

        expect(result.success).toBe(true)
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].title).toBe('New Note')
      })
    })

    describe('updateNote', () => {
      it('should update a note in the store', async () => {
        const store = useNotesStore()
        store.notes = [{ id: 'n1', title: 'Original Note' }]
        const updatedNote = { title: 'Updated Note' }
        const single = vi
          .fn()
          .mockResolvedValue({ data: { id: 'n1', ...updatedNote }, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        from.mockReturnValue({ update })

        const result = await store.updateNote('n1', updatedNote)

        expect(result.success).toBe(true)
        expect(store.notes[0].title).toBe('Updated Note')
      })
    })

    describe('deleteNote', () => {
      it('should delete a note from the store', async () => {
        const store = useNotesStore()
        store.notes = [{ id: 'n1', title: 'Note 1' }]
        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        from.mockReturnValue({ delete: del })

        const result = await store.deleteNote('n1')

        expect(result.success).toBe(true)
        expect(store.notes).toHaveLength(0)
      })
    })

    describe('togglePin', () => {
      it('should toggle the pinned status of a note', async () => {
        const store = useNotesStore()
        store.notes = [{ id: 'n1', title: 'Note 1', is_pinned: false }]
        const single = vi
          .fn()
          .mockResolvedValue({ data: { id: 'n1', is_pinned: true }, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        from.mockReturnValue({ update })

        const result = await store.togglePin('n1')

        expect(result.success).toBe(true)
        expect(store.notes[0].is_pinned).toBe(true)
      })
    })

    describe('toggleArchive', () => {
      it('should toggle the archived status of a note', async () => {
        const store = useNotesStore()
        store.notes = [{ id: 'n1', title: 'Note 1', archived_at: null }]
        const single = vi.fn().mockResolvedValue({
          data: { id: 'n1', archived_at: new Date().toISOString() },
          error: null
        })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        from.mockReturnValue({ update })

        const result = await store.toggleArchive('n1')

        expect(result.success).toBe(true)
        expect(store.notes[0].archived_at).not.toBeNull()
      })
    })

    describe('searchNotes', () => {
      it('should search for notes', async () => {
        const store = useNotesStore()
        const mockNotes = [{ id: 'n1', title: 'Searched Note' }]
        const limit = vi.fn().mockResolvedValue({ data: mockNotes, error: null })
        const is = vi.fn(() => ({ limit }))
        const textSearch = vi.fn(() => ({ is }))
        const select = vi.fn(() => ({ textSearch }))
        from.mockReturnValue({ select })

        const result = await store.searchNotes('Searched')

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockNotes)
      })
    })
  })
})
