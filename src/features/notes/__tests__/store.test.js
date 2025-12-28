import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '../store'
import { useAuthStore } from '@/stores/auth'

// Mock logger first before other mocks
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

import { logger } from '@/utils/logger'

// Mock sanitizeHTML utility
vi.mock('../utils', () => ({
  sanitizeHTML: vi.fn((content) => content)
}))

// Mock Supabase
const mockFrom = vi.fn()
const mockUnsubscribe = vi.fn()
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe })
const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
const mockChannel = vi.fn().mockReturnValue({ on: mockOn, subscribe: mockSubscribe })
const mockRemoveChannel = vi.fn()

const mockSupabase = {
  from: mockFrom,
  channel: mockChannel,
  removeChannel: mockRemoveChannel
}

vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({ supabase: mockSupabase })
}))

describe('Notes Store', () => {
  let store
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Re-establish mock chain after clearAllMocks
    mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe })
    mockOn.mockReturnValue({ subscribe: mockSubscribe })
    mockChannel.mockReturnValue({ on: mockOn, subscribe: mockSubscribe })

    authStore = useAuthStore()
    authStore.user = { id: 'user-123' }

    store = useNotesStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have empty notes array', () => {
      expect(store.notes).toEqual([])
    })

    it('should have empty topics array', () => {
      expect(store.topics).toEqual([])
    })

    it('should not be loading initially', () => {
      expect(store.loading).toBe(false)
    })

    it('should have no error initially', () => {
      expect(store.error).toBeNull()
    })

    it('should have no selected topic', () => {
      expect(store.selectedTopicId).toBeNull()
    })

    it('should have empty search query', () => {
      expect(store.searchQuery).toBe('')
    })

    it('should not show archived notes by default', () => {
      expect(store.showArchived).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    describe('selectedTopic', () => {
      it('should return null when no topic is selected', () => {
        expect(store.selectedTopic).toBeNull()
      })

      it('should return the selected topic when one is selected', () => {
        store.topics = [
          { id: 't1', name: 'Topic 1' },
          { id: 't2', name: 'Topic 2' }
        ]
        store.selectedTopicId = 't2'

        expect(store.selectedTopic).toEqual({ id: 't2', name: 'Topic 2' })
      })

      it('should return undefined when selected topic does not exist', () => {
        store.topics = [{ id: 't1', name: 'Topic 1' }]
        store.selectedTopicId = 'nonexistent'

        expect(store.selectedTopic).toBeUndefined()
      })
    })

    describe('filteredNotes', () => {
      const now = new Date('2025-01-15T12:00:00Z')
      const earlier = new Date('2025-01-14T12:00:00Z')
      const middle = new Date('2025-01-14T18:00:00Z')

      beforeEach(() => {
        store.notes = [
          {
            id: 'n1',
            title: 'Note 1',
            topic_id: 't1',
            archived_at: null,
            is_pinned: false,
            updated_at: earlier.toISOString()
          },
          {
            id: 'n2',
            title: 'Note 2',
            topic_id: 't1',
            archived_at: now.toISOString(),
            is_pinned: false,
            updated_at: now.toISOString()
          },
          {
            id: 'n3',
            title: 'Note 3',
            topic_id: 't2',
            archived_at: null,
            is_pinned: true,
            updated_at: now.toISOString()
          },
          {
            id: 'n4',
            title: 'Note 4',
            topic_id: 't2',
            archived_at: null,
            is_pinned: false,
            updated_at: middle.toISOString()
          }
        ]
      })

      it('should filter out archived notes by default', () => {
        const filtered = store.filteredNotes
        expect(filtered).toHaveLength(3)
        expect(filtered.find((n) => n.id === 'n2')).toBeUndefined()
      })

      it('should include archived notes when showArchived is true', () => {
        store.showArchived = true
        const filtered = store.filteredNotes
        expect(filtered).toHaveLength(4)
        expect(filtered.find((n) => n.id === 'n2')).toBeDefined()
      })

      it('should filter by selected topic', () => {
        store.selectedTopicId = 't1'
        const filtered = store.filteredNotes
        expect(filtered).toHaveLength(1)
        expect(filtered[0].id).toBe('n1')
      })

      it('should sort pinned notes first', () => {
        const filtered = store.filteredNotes
        expect(filtered[0].is_pinned).toBe(true)
        expect(filtered[0].id).toBe('n3')
      })

      it('should sort by updated_at descending within pinned/unpinned groups', () => {
        const filtered = store.filteredNotes
        // First should be pinned note
        expect(filtered[0].id).toBe('n3')
        // Then unpinned notes by updated_at desc
        expect(filtered[1].id).toBe('n4') // Earlier date
        expect(filtered[2].id).toBe('n1') // Earlier date
      })

      it('should filter by topic and exclude archived', () => {
        store.selectedTopicId = 't1'
        store.showArchived = false
        const filtered = store.filteredNotes
        expect(filtered).toHaveLength(1)
        expect(filtered[0].id).toBe('n1')
      })
    })

    describe('pinnedNotes', () => {
      it('should return only pinned and non-archived notes', () => {
        const now = new Date()
        store.notes = [
          { id: 'n1', is_pinned: true, archived_at: null, updated_at: now.toISOString() },
          { id: 'n2', is_pinned: false, archived_at: null, updated_at: now.toISOString() },
          {
            id: 'n3',
            is_pinned: true,
            archived_at: now.toISOString(),
            updated_at: now.toISOString()
          },
          { id: 'n4', is_pinned: true, archived_at: null, updated_at: now.toISOString() }
        ]

        const pinned = store.pinnedNotes
        expect(pinned).toHaveLength(2)
        expect(pinned.every((n) => n.is_pinned)).toBe(true)
        expect(pinned.every((n) => !n.archived_at)).toBe(true)
      })

      it('should sort pinned notes by updated_at descending', () => {
        const now = new Date()
        const earlier = new Date(now.getTime() - 1000 * 60 * 60)

        store.notes = [
          { id: 'n1', is_pinned: true, archived_at: null, updated_at: earlier.toISOString() },
          { id: 'n2', is_pinned: true, archived_at: null, updated_at: now.toISOString() }
        ]

        const pinned = store.pinnedNotes
        expect(pinned[0].id).toBe('n2')
        expect(pinned[1].id).toBe('n1')
      })

      it('should limit to 5 pinned notes', () => {
        const now = new Date()
        store.notes = Array.from({ length: 10 }, (_, i) => ({
          id: `n${i}`,
          is_pinned: true,
          archived_at: null,
          updated_at: now.toISOString()
        }))

        expect(store.pinnedNotes).toHaveLength(5)
      })
    })

    describe('recentNotes', () => {
      it('should return only non-archived notes', () => {
        const now = new Date()
        store.notes = [
          { id: 'n1', archived_at: null, updated_at: now.toISOString() },
          { id: 'n2', archived_at: now.toISOString(), updated_at: now.toISOString() },
          { id: 'n3', archived_at: null, updated_at: now.toISOString() }
        ]

        const recent = store.recentNotes
        expect(recent).toHaveLength(2)
        expect(recent.every((n) => !n.archived_at)).toBe(true)
      })

      it('should sort by updated_at descending', () => {
        const now = new Date()
        const earlier = new Date(now.getTime() - 1000 * 60 * 60)

        store.notes = [
          { id: 'n1', archived_at: null, updated_at: earlier.toISOString() },
          { id: 'n2', archived_at: null, updated_at: now.toISOString() }
        ]

        const recent = store.recentNotes
        expect(recent[0].id).toBe('n2')
        expect(recent[1].id).toBe('n1')
      })

      it('should limit to 5 recent notes', () => {
        const now = new Date()
        store.notes = Array.from({ length: 10 }, (_, i) => ({
          id: `n${i}`,
          archived_at: null,
          updated_at: now.toISOString()
        }))

        expect(store.recentNotes).toHaveLength(5)
      })
    })

    describe('activeNotesCount', () => {
      it('should count only non-archived notes', () => {
        const now = new Date()
        store.notes = [
          { id: 'n1', archived_at: null },
          { id: 'n2', archived_at: null },
          { id: 'n3', archived_at: now.toISOString() }
        ]

        expect(store.activeNotesCount).toBe(2)
      })

      it('should return 0 when all notes are archived', () => {
        const now = new Date()
        store.notes = [
          { id: 'n1', archived_at: now.toISOString() },
          { id: 'n2', archived_at: now.toISOString() }
        ]

        expect(store.activeNotesCount).toBe(0)
      })

      it('should return 0 when there are no notes', () => {
        store.notes = []
        expect(store.activeNotesCount).toBe(0)
      })
    })
  })

  describe('Topic Actions', () => {
    describe('fetchTopics', () => {
      it('should fetch topics successfully', async () => {
        const mockTopics = [
          { id: 't1', name: 'Topic 1', display_order: 0, notes: [{}, {}] },
          { id: 't2', name: 'Topic 2', display_order: 1, notes: [{}] }
        ]

        const order = vi.fn().mockResolvedValue({ data: mockTopics, error: null })
        const select = vi.fn(() => ({ order }))
        mockFrom.mockReturnValue({ select })

        await store.fetchTopics()

        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
        expect(store.topics).toHaveLength(2)
        expect(store.topics[0].note_count).toBe(2)
        expect(store.topics[1].note_count).toBe(1)
        expect(store.topics[0].notes).toBeUndefined()
      })

      it('should handle topics with no notes', async () => {
        const mockTopics = [{ id: 't1', name: 'Topic 1', display_order: 0, notes: null }]

        const order = vi.fn().mockResolvedValue({ data: mockTopics, error: null })
        const select = vi.fn(() => ({ order }))
        mockFrom.mockReturnValue({ select })

        await store.fetchTopics()

        expect(store.topics[0].note_count).toBe(0)
      })

      it('should set error state on fetch failure', async () => {
        const order = vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Database error' } })
        const select = vi.fn(() => ({ order }))
        mockFrom.mockReturnValue({ select })

        await store.fetchTopics()

        expect(store.loading).toBe(false)
        expect(store.error).toBe('Database error')
        expect(store.topics).toEqual([])
        expect(logger.error).toHaveBeenCalledWith('Error fetching topics:', expect.any(Object))
      })

      it('should set loading state correctly during fetch', async () => {
        let resolvePromise
        const promise = new Promise((resolve) => {
          resolvePromise = resolve
        })

        const order = vi.fn(() => promise)
        const select = vi.fn(() => ({ order }))
        mockFrom.mockReturnValue({ select })

        const fetchPromise = store.fetchTopics()
        expect(store.loading).toBe(true)

        resolvePromise({ data: [], error: null })
        await fetchPromise

        expect(store.loading).toBe(false)
      })
    })

    describe('createTopic', () => {
      it('should create a topic successfully', async () => {
        const newTopic = { name: 'New Topic', color: '#ff0000' }
        const createdTopic = { id: 't1', ...newTopic, display_order: 1 }

        const single = vi.fn().mockResolvedValue({ data: createdTopic, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        const result = await store.createTopic(newTopic)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(createdTopic)
        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].name).toBe('New Topic')
        expect(store.topics[0].note_count).toBe(0)
        expect(insert).toHaveBeenCalledWith({
          user_id: 'user-123',
          display_order: 1,
          ...newTopic
        })
      })

      it('should calculate correct display_order for new topic', async () => {
        store.topics = [
          { id: 't1', display_order: 0 },
          { id: 't2', display_order: 5 },
          { id: 't3', display_order: 3 }
        ]

        const newTopic = { name: 'New Topic' }
        const createdTopic = { id: 't4', ...newTopic, display_order: 6 }

        const single = vi.fn().mockResolvedValue({ data: createdTopic, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        await store.createTopic(newTopic)

        expect(insert).toHaveBeenCalledWith({
          user_id: 'user-123',
          display_order: 6,
          ...newTopic
        })
      })

      it('should handle topics with null or undefined display_order', async () => {
        store.topics = [{ id: 't1', display_order: null }, { id: 't2' }]

        const newTopic = { name: 'New Topic' }
        const createdTopic = { id: 't3', ...newTopic, display_order: 1 }

        const single = vi.fn().mockResolvedValue({ data: createdTopic, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        await store.createTopic(newTopic)

        expect(insert).toHaveBeenCalledWith({
          user_id: 'user-123',
          display_order: 1,
          ...newTopic
        })
      })

      it('should return error on create failure', async () => {
        const newTopic = { name: 'New Topic' }
        const single = vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Create failed' } })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        const result = await store.createTopic(newTopic)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Create failed')
        expect(store.topics).toHaveLength(0)
      })

      it('should handle exception during create', async () => {
        const newTopic = { name: 'New Topic' }
        const insert = vi.fn(() => {
          throw new Error('Network error')
        })
        mockFrom.mockReturnValue({ insert })

        const result = await store.createTopic(newTopic)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Network error')
      })
    })

    describe('updateTopic', () => {
      it('should update a topic successfully', async () => {
        store.topics = [
          { id: 't1', name: 'Original Topic', color: '#ff0000' },
          { id: 't2', name: 'Topic 2' }
        ]

        const updates = { name: 'Updated Topic', color: '#00ff00' }
        const updatedTopic = { id: 't1', ...updates }

        const single = vi.fn().mockResolvedValue({ data: updatedTopic, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.updateTopic('t1', updates)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(updatedTopic)
        expect(store.topics[0].name).toBe('Updated Topic')
        expect(store.topics[0].color).toBe('#00ff00')
      })

      it('should preserve existing topic properties when updating', async () => {
        store.topics = [{ id: 't1', name: 'Original Topic', color: '#ff0000', note_count: 5 }]

        const updates = { name: 'Updated Topic' }
        const updatedTopic = { id: 't1', name: 'Updated Topic' }

        const single = vi.fn().mockResolvedValue({ data: updatedTopic, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        await store.updateTopic('t1', updates)

        expect(store.topics[0].note_count).toBe(5)
        expect(store.topics[0].color).toBe('#ff0000')
      })

      it('should handle update when topic not found in local state', async () => {
        store.topics = [{ id: 't1', name: 'Topic 1' }]

        const updates = { name: 'Updated Topic' }
        const updatedTopic = { id: 't2', ...updates }

        const single = vi.fn().mockResolvedValue({ data: updatedTopic, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.updateTopic('t2', updates)

        expect(result.success).toBe(true)
        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].id).toBe('t1')
      })

      it('should return error on update failure', async () => {
        store.topics = [{ id: 't1', name: 'Topic 1' }]

        const single = vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Update failed' } })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.updateTopic('t1', { name: 'Updated' })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Update failed')
      })
    })

    describe('deleteTopic', () => {
      it('should delete a topic and its notes successfully', async () => {
        store.topics = [
          { id: 't1', name: 'Topic 1' },
          { id: 't2', name: 'Topic 2' }
        ]
        store.notes = [
          { id: 'n1', topic_id: 't1' },
          { id: 'n2', topic_id: 't1' },
          { id: 'n3', topic_id: 't2' }
        ]

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        const result = await store.deleteTopic('t1')

        expect(result.success).toBe(true)
        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].id).toBe('t2')
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].topic_id).toBe('t2')
      })

      it('should clear selectedTopicId if deleted topic was selected', async () => {
        store.topics = [{ id: 't1', name: 'Topic 1' }]
        store.selectedTopicId = 't1'

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        await store.deleteTopic('t1')

        expect(store.selectedTopicId).toBeNull()
      })

      it('should not clear selectedTopicId if different topic was deleted', async () => {
        store.topics = [
          { id: 't1', name: 'Topic 1' },
          { id: 't2', name: 'Topic 2' }
        ]
        store.selectedTopicId = 't2'

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        await store.deleteTopic('t1')

        expect(store.selectedTopicId).toBe('t2')
      })

      it('should return error on delete failure', async () => {
        store.topics = [{ id: 't1', name: 'Topic 1' }]

        const eq = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        const result = await store.deleteTopic('t1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Delete failed')
        expect(store.topics).toHaveLength(1)
      })
    })

    describe('reorderTopics', () => {
      it('should reorder topics successfully', async () => {
        const originalTopics = [
          { id: 't1', name: 'Topic 1', display_order: 0 },
          { id: 't2', name: 'Topic 2', display_order: 1 },
          { id: 't3', name: 'Topic 3', display_order: 2 }
        ]

        const newOrder = [originalTopics[2], originalTopics[0], originalTopics[1]]

        // Mock RPC call for batch update (FR-032)
        const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })
        mockSupabase.rpc = mockRpc

        const result = await store.reorderTopics(newOrder)

        expect(result.success).toBe(true)
        expect(mockRpc).toHaveBeenCalledTimes(1)
        expect(mockRpc).toHaveBeenCalledWith('batch_update_topic_order', {
          topic_updates: [
            { id: 't3', display_order: 0 },
            { id: 't1', display_order: 1 },
            { id: 't2', display_order: 2 }
          ]
        })
        expect(store.topics).toEqual(newOrder)
      })

      it('should return error on reorder failure', async () => {
        const topics = [{ id: 't1', name: 'Topic 1' }]

        // Mock RPC call failure
        const mockRpc = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
        mockSupabase.rpc = mockRpc

        const result = await store.reorderTopics(topics)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Update failed')
      })
    })
  })

  describe('Note Actions', () => {
    describe('fetchNotes', () => {
      it('should fetch all notes successfully', async () => {
        const mockNotes = [
          { id: 'n1', title: 'Note 1', topic: { id: 't1', name: 'Topic 1' } },
          { id: 'n2', title: 'Note 2', topic: { id: 't2', name: 'Topic 2' } }
        ]

        const query = Promise.resolve({ data: mockNotes, error: null })
        const order = vi.fn(() => query)
        const select = vi.fn(() => ({ order }))
        mockFrom.mockReturnValue({ select })

        await store.fetchNotes()

        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
        expect(store.notes).toEqual(mockNotes)
      })

      it('should fetch notes for specific topic', async () => {
        const mockNotes = [{ id: 'n1', title: 'Note 1', topic_id: 't1' }]

        const query = Promise.resolve({ data: mockNotes, error: null })
        const eq = vi.fn(() => query)
        const order = vi.fn(() => ({ eq }))
        const select = vi.fn(() => ({ order }))
        mockFrom.mockReturnValue({ select })

        await store.fetchNotes('t1')

        expect(store.notes).toEqual(mockNotes)
        expect(eq).toHaveBeenCalledWith('topic_id', 't1')
      })

      it('should set error state on fetch failure', async () => {
        const query = Promise.resolve({ data: null, error: { message: 'Fetch error' } })
        const order = vi.fn(() => query)
        const select = vi.fn(() => ({ order }))
        mockFrom.mockReturnValue({ select })

        await store.fetchNotes()

        expect(store.loading).toBe(false)
        expect(store.error).toBe('Fetch error')
        expect(logger.error).toHaveBeenCalledWith('Error fetching notes:', expect.any(Object))
      })
    })

    describe('createNote', () => {
      it('should create a note successfully', async () => {
        const newNote = { title: 'New Note', content: '<p>Content</p>', topic_id: 't1' }
        const createdNote = { id: 'n1', ...newNote, topic: { id: 't1', name: 'Topic 1' } }

        store.topics = [{ id: 't1', name: 'Topic 1', note_count: 0 }]

        const single = vi.fn().mockResolvedValue({ data: createdNote, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        const result = await store.createNote(newNote)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(createdNote)
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0]).toEqual(createdNote)
        expect(insert).toHaveBeenCalledWith({
          user_id: 'user-123',
          ...newNote
        })
      })

      it('should increment topic note count on create', async () => {
        const newNote = { title: 'New Note', content: 'Content', topic_id: 't1' }
        const createdNote = { id: 'n1', ...newNote, topic: { id: 't1', name: 'Topic 1' } }

        store.topics = [{ id: 't1', name: 'Topic 1', note_count: 5 }]

        const single = vi.fn().mockResolvedValue({ data: createdNote, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        await store.createNote(newNote)

        expect(store.topics[0].note_count).toBe(6)
      })

      it('should handle creating note without topic', async () => {
        const newNote = { title: 'New Note', content: 'Content' }
        const createdNote = { id: 'n1', ...newNote, topic: null }

        const single = vi.fn().mockResolvedValue({ data: createdNote, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        const result = await store.createNote(newNote)

        expect(result.success).toBe(true)
      })

      it('should sanitize HTML content before creating', async () => {
        const { sanitizeHTML } = await import('../utils')
        const newNote = { title: 'New Note', content: '<script>alert("xss")</script><p>Safe</p>' }
        const createdNote = { id: 'n1', ...newNote }

        const single = vi.fn().mockResolvedValue({ data: createdNote, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        await store.createNote(newNote)

        expect(sanitizeHTML).toHaveBeenCalledWith(newNote.content)
      })

      it('should handle empty content', async () => {
        const { sanitizeHTML } = await import('../utils')
        const newNote = { title: 'New Note' }
        const createdNote = { id: 'n1', ...newNote }

        const single = vi.fn().mockResolvedValue({ data: createdNote, error: null })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        await store.createNote(newNote)

        expect(sanitizeHTML).not.toHaveBeenCalled()
      })

      it('should return error on create failure', async () => {
        const newNote = { title: 'New Note', content: 'Content' }
        const single = vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Create failed' } })
        const select = vi.fn(() => ({ single }))
        const insert = vi.fn(() => ({ select }))
        mockFrom.mockReturnValue({ insert })

        const result = await store.createNote(newNote)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Create failed')
        expect(store.notes).toHaveLength(0)
      })
    })

    describe('updateNote', () => {
      it('should update a note successfully', async () => {
        store.notes = [{ id: 'n1', title: 'Original Note', content: 'Original' }]

        const updates = { title: 'Updated Note', content: '<p>Updated</p>' }
        const updatedNote = { id: 'n1', ...updates }

        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.updateNote('n1', updates)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(updatedNote)
        expect(store.notes[0]).toEqual(updatedNote)
      })

      it('should sanitize HTML content when updating', async () => {
        const { sanitizeHTML } = await import('../utils')
        store.notes = [{ id: 'n1', title: 'Note', content: 'Original' }]

        const updates = { content: '<script>alert("xss")</script><p>Safe</p>' }
        const updatedNote = { id: 'n1', title: 'Note', content: updates.content }

        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        await store.updateNote('n1', updates)

        expect(sanitizeHTML).toHaveBeenCalledWith(updates.content)
      })

      it('should not sanitize when no content in updates', async () => {
        const { sanitizeHTML } = await import('../utils')
        sanitizeHTML.mockClear()

        store.notes = [{ id: 'n1', title: 'Note', content: 'Original' }]

        const updates = { title: 'Updated Title' }
        const updatedNote = { id: 'n1', ...updates, content: 'Original' }

        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        await store.updateNote('n1', updates)

        expect(sanitizeHTML).not.toHaveBeenCalled()
      })

      it('should handle update when note not found in local state', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1' }]

        const updates = { title: 'Updated Note' }
        const updatedNote = { id: 'n2', ...updates }

        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.updateNote('n2', updates)

        expect(result.success).toBe(true)
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].id).toBe('n1')
      })

      it('should return error on update failure', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1' }]

        const single = vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Update failed' } })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.updateNote('n1', { title: 'Updated' })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Update failed')
      })
    })

    describe('deleteNote', () => {
      it('should delete a note successfully', async () => {
        store.notes = [
          { id: 'n1', title: 'Note 1', topic_id: 't1' },
          { id: 'n2', title: 'Note 2', topic_id: 't1' }
        ]
        store.topics = [{ id: 't1', note_count: 2 }]

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        const result = await store.deleteNote('n1')

        expect(result.success).toBe(true)
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].id).toBe('n2')
      })

      it('should decrement topic note count on delete', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1', topic_id: 't1' }]
        store.topics = [{ id: 't1', note_count: 5 }]

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        await store.deleteNote('n1')

        expect(store.topics[0].note_count).toBe(4)
      })

      it('should not decrement note count below 0', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1', topic_id: 't1' }]
        store.topics = [{ id: 't1', note_count: 0 }]

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        await store.deleteNote('n1')

        expect(store.topics[0].note_count).toBe(0)
      })

      it('should handle deleting note without topic', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1', topic_id: null }]

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        const result = await store.deleteNote('n1')

        expect(result.success).toBe(true)
        expect(store.notes).toHaveLength(0)
      })

      it('should handle deleting note when topic not found', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1', topic_id: 't999' }]
        store.topics = [{ id: 't1', note_count: 5 }]

        const eq = vi.fn().mockResolvedValue({ error: null })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        const result = await store.deleteNote('n1')

        expect(result.success).toBe(true)
        expect(store.topics[0].note_count).toBe(5)
      })

      it('should return error on delete failure', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1' }]

        const eq = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
        const del = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ delete: del })

        const result = await store.deleteNote('n1')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Delete failed')
        expect(store.notes).toHaveLength(1)
      })
    })
  })

  describe('Pin/Archive Actions', () => {
    describe('togglePin', () => {
      it('should pin an unpinned note', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1', is_pinned: false }]

        const updatedNote = { id: 'n1', title: 'Note 1', is_pinned: true }
        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.togglePin('n1')

        expect(result.success).toBe(true)
        expect(update).toHaveBeenCalledWith({ is_pinned: true })
      })

      it('should unpin a pinned note', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1', is_pinned: true }]

        const updatedNote = { id: 'n1', title: 'Note 1', is_pinned: false }
        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.togglePin('n1')

        expect(result.success).toBe(true)
        expect(update).toHaveBeenCalledWith({ is_pinned: false })
      })

      it('should return error when note not found', async () => {
        store.notes = []

        const result = await store.togglePin('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Note not found')
      })
    })

    describe('toggleArchive', () => {
      it('should archive an unarchived note', async () => {
        vi.useFakeTimers()
        const mockDate = new Date('2025-01-15T12:00:00Z')
        vi.setSystemTime(mockDate)

        store.notes = [{ id: 'n1', title: 'Note 1', archived_at: null }]

        const updatedNote = { id: 'n1', title: 'Note 1', archived_at: mockDate.toISOString() }
        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.toggleArchive('n1')

        expect(result.success).toBe(true)
        expect(update).toHaveBeenCalledWith({ archived_at: mockDate.toISOString() })

        vi.useRealTimers()
      })

      it('should unarchive an archived note', async () => {
        const archivedDate = new Date('2025-01-10T12:00:00Z')
        store.notes = [{ id: 'n1', title: 'Note 1', archived_at: archivedDate.toISOString() }]

        const updatedNote = { id: 'n1', title: 'Note 1', archived_at: null }
        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const select = vi.fn(() => ({ single }))
        const eq = vi.fn(() => ({ select }))
        const update = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ update })

        const result = await store.toggleArchive('n1')

        expect(result.success).toBe(true)
        expect(update).toHaveBeenCalledWith({ archived_at: null })
      })

      it('should return error when note not found', async () => {
        store.notes = []

        const result = await store.toggleArchive('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Note not found')
      })
    })
  })

  describe('Search Action', () => {
    describe('searchNotes', () => {
      it('should search notes successfully', async () => {
        const mockResults = [
          { id: 'n1', title: 'Search Result 1' },
          { id: 'n2', title: 'Search Result 2' }
        ]

        const limit = vi.fn().mockResolvedValue({ data: mockResults, error: null })
        const is = vi.fn(() => ({ limit }))
        const textSearch = vi.fn(() => ({ is }))
        const select = vi.fn(() => ({ textSearch }))
        mockFrom.mockReturnValue({ select })

        const result = await store.searchNotes('query')

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockResults)
        expect(textSearch).toHaveBeenCalledWith('search_vector', 'query', {
          type: 'websearch',
          config: 'english'
        })
        expect(is).toHaveBeenCalledWith('archived_at', null)
        expect(limit).toHaveBeenCalledWith(50)
      })

      it('should return empty array for empty query', async () => {
        const result = await store.searchNotes('')

        expect(result.success).toBe(true)
        expect(result.data).toEqual([])
        expect(mockFrom).not.toHaveBeenCalled()
      })

      it('should return empty array for whitespace-only query', async () => {
        const result = await store.searchNotes('   ')

        expect(result.success).toBe(true)
        expect(result.data).toEqual([])
        expect(mockFrom).not.toHaveBeenCalled()
      })

      it('should return empty array for null query', async () => {
        const result = await store.searchNotes(null)

        expect(result.success).toBe(true)
        expect(result.data).toEqual([])
        expect(mockFrom).not.toHaveBeenCalled()
      })

      it('should handle search error', async () => {
        const limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'Search error' } })
        const is = vi.fn(() => ({ limit }))
        const textSearch = vi.fn(() => ({ is }))
        const select = vi.fn(() => ({ textSearch }))
        mockFrom.mockReturnValue({ select })

        const result = await store.searchNotes('query')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Search error')
        expect(result.data).toEqual([])
        expect(store.error).toBe('Search error')
        expect(logger.error).toHaveBeenCalledWith('Error searching notes:', expect.any(Object))
      })

      it('should set loading state during search', async () => {
        let resolvePromise
        const promise = new Promise((resolve) => {
          resolvePromise = resolve
        })

        const limit = vi.fn(() => promise)
        const is = vi.fn(() => ({ limit }))
        const textSearch = vi.fn(() => ({ is }))
        const select = vi.fn(() => ({ textSearch }))
        mockFrom.mockReturnValue({ select })

        const searchPromise = store.searchNotes('query')
        expect(store.loading).toBe(true)

        resolvePromise({ data: [], error: null })
        await searchPromise

        expect(store.loading).toBe(false)
      })
    })
  })

  describe('Real-time Subscriptions', () => {
    describe('setupRealtimeSubscriptions', () => {
      it('should set up subscriptions when user is authenticated', () => {
        const mockSubscribe = vi.fn()
        const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
        const mockChannelInstance = { on: mockOn }
        mockChannel.mockReturnValue(mockChannelInstance)

        store.setupRealtimeSubscriptions()

        expect(mockChannel).toHaveBeenCalledWith('topics_changes')
        expect(mockChannel).toHaveBeenCalledWith('notes_changes')
        expect(mockOn).toHaveBeenCalledTimes(2)
        expect(mockSubscribe).toHaveBeenCalledTimes(2)
      })

      it('should not set up subscriptions when user is not authenticated', () => {
        authStore.user = null

        store.setupRealtimeSubscriptions()

        expect(mockChannel).not.toHaveBeenCalled()
      })

      it('should subscribe to topics changes with correct filter', () => {
        const mockSubscribe = vi.fn()
        const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
        const mockChannelInstance = { on: mockOn }
        mockChannel.mockReturnValue(mockChannelInstance)

        store.setupRealtimeSubscriptions()

        expect(mockOn).toHaveBeenCalledWith(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'topics',
            filter: 'user_id=eq.user-123'
          },
          expect.any(Function)
        )
      })

      it('should subscribe to notes changes with correct filter', () => {
        const mockSubscribe = vi.fn()
        const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
        const mockChannelInstance = { on: mockOn }
        mockChannel.mockReturnValue(mockChannelInstance)

        store.setupRealtimeSubscriptions()

        expect(mockOn).toHaveBeenCalledWith(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes',
            filter: 'user_id=eq.user-123'
          },
          expect.any(Function)
        )
      })
    })

    describe('handleTopicChange', () => {
      it('should handle INSERT event', () => {
        const payload = {
          eventType: 'INSERT',
          new: { id: 't1', name: 'New Topic', display_order: 0 },
          old: null
        }

        store.handleTopicChange(payload)

        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].id).toBe('t1')
        expect(store.topics[0].note_count).toBe(0)
      })

      it('should not duplicate topic on INSERT if already exists', () => {
        store.topics = [{ id: 't1', name: 'Existing Topic', note_count: 5 }]

        const payload = {
          eventType: 'INSERT',
          new: { id: 't1', name: 'New Topic', display_order: 0 },
          old: null
        }

        store.handleTopicChange(payload)

        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].name).toBe('Existing Topic')
      })

      it('should handle UPDATE event', () => {
        store.topics = [{ id: 't1', name: 'Original Topic', note_count: 5 }]

        const payload = {
          eventType: 'UPDATE',
          new: { id: 't1', name: 'Updated Topic', display_order: 0 },
          old: { id: 't1', name: 'Original Topic' }
        }

        store.handleTopicChange(payload)

        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].name).toBe('Updated Topic')
        expect(store.topics[0].note_count).toBe(5)
      })

      it('should handle UPDATE event when topic not found', () => {
        store.topics = [{ id: 't1', name: 'Topic 1' }]

        const payload = {
          eventType: 'UPDATE',
          new: { id: 't2', name: 'Updated Topic' },
          old: { id: 't2', name: 'Original Topic' }
        }

        store.handleTopicChange(payload)

        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].id).toBe('t1')
      })

      it('should handle DELETE event', () => {
        store.topics = [
          { id: 't1', name: 'Topic 1' },
          { id: 't2', name: 'Topic 2' }
        ]
        store.notes = [
          { id: 'n1', topic_id: 't1' },
          { id: 'n2', topic_id: 't2' }
        ]

        const payload = {
          eventType: 'DELETE',
          new: null,
          old: { id: 't1' }
        }

        store.handleTopicChange(payload)

        expect(store.topics).toHaveLength(1)
        expect(store.topics[0].id).toBe('t2')
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].topic_id).toBe('t2')
      })

      it('should clear selectedTopicId on DELETE if deleted topic was selected', () => {
        store.topics = [{ id: 't1', name: 'Topic 1' }]
        store.selectedTopicId = 't1'

        const payload = {
          eventType: 'DELETE',
          new: null,
          old: { id: 't1' }
        }

        store.handleTopicChange(payload)

        expect(store.selectedTopicId).toBeNull()
      })
    })

    describe('handleNoteChange', () => {
      it('should handle INSERT event by fetching note with topic info', async () => {
        store.topics = [{ id: 't1', name: 'Topic 1', note_count: 0 }]

        const newNote = {
          id: 'n1',
          title: 'New Note',
          topic_id: 't1',
          topic: { id: 't1', name: 'Topic 1' }
        }

        const single = vi.fn().mockResolvedValue({ data: newNote, error: null })
        const eq = vi.fn(() => ({ single }))
        const select = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ select })

        const payload = {
          eventType: 'INSERT',
          new: { id: 'n1', title: 'New Note', topic_id: 't1' },
          old: null
        }

        await store.handleNoteChange(payload)

        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].id).toBe('n1')
        expect(store.topics[0].note_count).toBe(1)
      })

      it('should not duplicate note on INSERT if already exists', async () => {
        store.notes = [{ id: 'n1', title: 'Existing Note' }]

        const payload = {
          eventType: 'INSERT',
          new: { id: 'n1', title: 'New Note' },
          old: null
        }

        await store.handleNoteChange(payload)

        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].title).toBe('Existing Note')
      })

      it('should handle INSERT when note has no topic_id', async () => {
        // With optimized real-time (FR-033), we use local cache instead of database fetch
        const payload = {
          eventType: 'INSERT',
          new: { id: 'n1', title: 'New Note', topic_id: null },
          old: null
        }

        await store.handleNoteChange(payload)

        // Note should be added without topic info
        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].title).toBe('New Note')
        expect(store.notes[0].topic).toBeUndefined()
      })

      it('should handle INSERT when topic not found in local cache', async () => {
        // With optimized real-time (FR-033), topic info from local cache
        // If topic not in cache, note is added without topic info
        const payload = {
          eventType: 'INSERT',
          new: { id: 'n1', title: 'New Note', topic_id: 't999' },
          old: null
        }

        await store.handleNoteChange(payload)

        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].title).toBe('New Note')
        expect(store.notes[0].topic).toBeUndefined()
      })

      it('should handle UPDATE event using local topic cache', async () => {
        // Set up local state with note and topic (FR-033)
        store.notes = [{ id: 'n1', title: 'Original Note', topic_id: 't1' }]
        store.topics = [{ id: 't1', name: 'Topic 1', color: '#3b82f6' }]

        const payload = {
          eventType: 'UPDATE',
          new: { id: 'n1', title: 'Updated Note', topic_id: 't1' },
          old: { id: 'n1', title: 'Original Note' }
        }

        await store.handleNoteChange(payload)

        expect(store.notes[0].title).toBe('Updated Note')
        expect(store.notes[0].topic).toEqual({
          id: 't1',
          name: 'Topic 1',
          color: '#3b82f6'
        })
      })

      it('should handle UPDATE when note not found in local state', async () => {
        store.notes = [{ id: 'n1', title: 'Note 1' }]

        const updatedNote = { id: 'n2', title: 'Updated Note' }

        const single = vi.fn().mockResolvedValue({ data: updatedNote, error: null })
        const eq = vi.fn(() => ({ single }))
        const select = vi.fn(() => ({ eq }))
        mockFrom.mockReturnValue({ select })

        const payload = {
          eventType: 'UPDATE',
          new: { id: 'n2', title: 'Updated Note' },
          old: { id: 'n2', title: 'Original Note' }
        }

        await store.handleNoteChange(payload)

        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].id).toBe('n1')
      })

      it('should handle UPDATE when topic not in local cache', async () => {
        // With optimized real-time (FR-033), if topic not in cache, note updated without topic info
        store.notes = [{ id: 'n1', title: 'Note 1', topic_id: 't1' }]
        store.topics = [] // No topics in cache

        const payload = {
          eventType: 'UPDATE',
          new: { id: 'n1', title: 'Updated Note', topic_id: 't1' },
          old: { id: 'n1', title: 'Original Note' }
        }

        await store.handleNoteChange(payload)

        expect(store.notes[0].title).toBe('Updated Note')
        expect(store.notes[0].topic).toBeUndefined()
      })

      it('should handle DELETE event and update topic count', () => {
        store.notes = [
          { id: 'n1', topic_id: 't1' },
          { id: 'n2', topic_id: 't2' }
        ]
        store.topics = [{ id: 't1', note_count: 5 }]

        const payload = {
          eventType: 'DELETE',
          new: null,
          old: { id: 'n1' }
        }

        store.handleNoteChange(payload)

        expect(store.notes).toHaveLength(1)
        expect(store.notes[0].id).toBe('n2')
        expect(store.topics[0].note_count).toBe(4)
      })

      it('should handle DELETE when topic not found', () => {
        store.notes = [{ id: 'n1', topic_id: 't999' }]
        store.topics = [{ id: 't1', note_count: 5 }]

        const payload = {
          eventType: 'DELETE',
          new: null,
          old: { id: 'n1' }
        }

        store.handleNoteChange(payload)

        expect(store.notes).toHaveLength(0)
        expect(store.topics[0].note_count).toBe(5)
      })

      it('should handle DELETE when note has no topic', () => {
        store.notes = [{ id: 'n1', topic_id: null }]

        const payload = {
          eventType: 'DELETE',
          new: null,
          old: { id: 'n1' }
        }

        store.handleNoteChange(payload)

        expect(store.notes).toHaveLength(0)
      })

      it('should not decrement topic count below 0 on DELETE', () => {
        store.notes = [{ id: 'n1', topic_id: 't1' }]
        store.topics = [{ id: 't1', note_count: 0 }]

        const payload = {
          eventType: 'DELETE',
          new: null,
          old: { id: 'n1' }
        }

        store.handleNoteChange(payload)

        expect(store.topics[0].note_count).toBe(0)
      })
    })

    describe('cleanupRealtimeSubscriptions', () => {
      it('should remove topics channel when it exists', () => {
        // Set up channels by calling setupRealtimeSubscriptions
        store.setupRealtimeSubscriptions()

        // Cleanup should remove the channels
        store.cleanupRealtimeSubscriptions()

        expect(mockRemoveChannel).toHaveBeenCalled()
      })

      it('should handle cleanup when channels do not exist', () => {
        // Cleanup when no channels exist should not throw
        expect(() => store.cleanupRealtimeSubscriptions()).not.toThrow()

        // removeChannel should NOT be called since there are no channels
        expect(mockRemoveChannel).not.toHaveBeenCalled()
      })
    })
  })

  describe('Initialize', () => {
    it('should fetch topics and notes, then set up subscriptions', async () => {
      const mockTopics = [{ id: 't1', name: 'Topic 1', notes: [] }]
      const mockNotes = [{ id: 'n1', title: 'Note 1' }]

      const topicsQuery = Promise.resolve({ data: mockTopics, error: null })
      const topicsOrder = vi.fn(() => topicsQuery)
      const topicsSelect = vi.fn(() => ({ order: topicsOrder }))

      const notesQuery = Promise.resolve({ data: mockNotes, error: null })
      const notesOrder = vi.fn(() => notesQuery)
      const notesSelect = vi.fn(() => ({ order: notesOrder }))

      mockFrom
        .mockReturnValueOnce({ select: topicsSelect })
        .mockReturnValueOnce({ select: notesSelect })

      const mockSubscribe = vi.fn()
      const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      const mockChannelInstance = { on: mockOn }
      mockChannel.mockReturnValue(mockChannelInstance)

      await store.initialize()

      expect(store.topics).toEqual([{ id: 't1', name: 'Topic 1', note_count: 0 }])
      expect(store.notes).toEqual(mockNotes)
      expect(mockChannel).toHaveBeenCalledWith('topics_changes')
      expect(mockChannel).toHaveBeenCalledWith('notes_changes')
      expect(mockSubscribe).toHaveBeenCalledTimes(2)
    })

    it('should handle errors during initialization', async () => {
      const topicsOrder = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Topics error' } })
      const topicsSelect = vi.fn(() => ({ order: topicsOrder }))

      const notesQuery = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Notes error' } })
      const notesOrder = vi.fn(() => notesQuery)
      const notesSelect = vi.fn(() => ({ order: notesOrder }))

      mockFrom
        .mockReturnValueOnce({ select: topicsSelect })
        .mockReturnValueOnce({ select: notesSelect })

      const mockSubscribe = vi.fn()
      const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      const mockChannelInstance = { on: mockOn }
      mockChannel.mockReturnValue(mockChannelInstance)

      await store.initialize()

      // Both should still attempt to complete, and subscriptions should still be set up
      expect(mockSubscribe).toHaveBeenCalledTimes(2)
    })
  })
})
