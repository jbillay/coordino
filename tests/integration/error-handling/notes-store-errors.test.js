/**
 * Integration tests for Notes Store Error Handling
 * Feature: US8 - Comprehensive Error Handling
 *
 * Tests error handling in notes and topics operations including:
 * - Duplicate topic names (23505 unique constraint)
 * - Missing required fields (23502 not-null constraint)
 * - Foreign key violations (23503)
 * - Network errors
 * - Permission errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '../../../src/features/notes/store.js'
import { NOTE_ERRORS } from '../../../src/utils/errors.js'

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

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
            returns: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        })),
        order: vi.fn(() => ({
          returns: vi.fn().mockResolvedValue({ data: [], error: null })
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
  }),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn()
  }))
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

describe('Notes Store Error Handling Integration', () => {
  let notesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    notesStore = useNotesStore()
    resetMockFromReturn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Topic Creation - Error Handling', () => {
    it('should handle duplicate topic name (23505 unique constraint)', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "topics_user_id_name_key"'
              }
            })
          }))
        }))
      })

      const result = await notesStore.createTopic({
        name: 'Work',
        color: '#3B82F6'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.TOPIC_CREATE_DUPLICATE)
    })

    it('should handle missing topic name (23502 not-null)', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23502',
                message: 'null value in column "name" violates not-null constraint'
              }
            })
          }))
        }))
      })

      const result = await notesStore.createTopic({
        color: '#3B82F6'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.TOPIC_CREATE_MISSING_NAME)
    })

    it('should handle permission denied errors', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'permission denied for table topics' }
            })
          }))
        }))
      })

      const result = await notesStore.createTopic({
        name: 'Work',
        color: '#3B82F6'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.CREATE_PERMISSION_DENIED)
    })

    it('should handle network errors', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(new Error('Network request failed'))
          }))
        }))
      })

      const result = await notesStore.createTopic({
        name: 'Work',
        color: '#3B82F6'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.NETWORK_ERROR)
    })
  })

  describe('Topic Update - Error Handling', () => {
    beforeEach(() => {
      notesStore.topics = [
        { id: 'topic-1', name: 'Work', color: '#3B82F6' },
        { id: 'topic-2', name: 'Personal', color: '#10B981' }
      ]
    })

    it('should handle duplicate name during update', async () => {
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint'
                }
              })
            }))
          }))
        }))
      })

      const result = await notesStore.updateTopic('topic-1', { name: 'Personal' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.TOPIC_UPDATE_DUPLICATE)
    })

    it('should handle topic not found (PGRST116)', async () => {
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

      const result = await notesStore.updateTopic('non-existent', { name: 'Updated' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.TOPIC_UPDATE_NOT_FOUND)
    })
  })

  describe('Topic Deletion - Error Handling', () => {
    beforeEach(() => {
      notesStore.topics = [{ id: 'topic-1', name: 'Work', color: '#3B82F6', note_count: 5 }]
    })

    it('should handle deletion of topic with notes (23503 foreign key)', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: {
              code: '23503',
              message: 'update or delete on table "topics" violates foreign key constraint'
            }
          })
        }))
      })

      const result = await notesStore.deleteTopic('topic-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.TOPIC_DELETE_HAS_NOTES)
    })

    it('should handle topic not found during deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'PGRST116' }
          })
        }))
      })

      const result = await notesStore.deleteTopic('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.TOPIC_DELETE_NOT_FOUND)
    })

    it('should remove topic from store on successful deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })

      const result = await notesStore.deleteTopic('topic-1')

      expect(result.success).toBe(true)
      expect(notesStore.topics.find((t) => t.id === 'topic-1')).toBeUndefined()
    })
  })

  describe('Note Creation - Error Handling', () => {
    it('should handle missing required fields', async () => {
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

      const result = await notesStore.createNote({
        content: 'Test content'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.CREATE_MISSING_TITLE)
    })

    it('should handle invalid topic reference (23503)', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23503',
                message:
                  'insert or update on table "notes" violates foreign key constraint "notes_topic_id_fkey"'
              }
            })
          }))
        }))
      })

      const result = await notesStore.createNote({
        title: 'Test Note',
        topic_id: 'invalid-uuid'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.CREATE_INVALID_TOPIC)
    })

    it('should handle permission denied', async () => {
      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'permission denied for table notes' }
            })
          }))
        }))
      })

      const result = await notesStore.createNote({
        title: 'Test Note',
        content: 'Content'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.CREATE_PERMISSION_DENIED)
    })
  })

  describe('Note Update - Error Handling', () => {
    beforeEach(() => {
      notesStore.notes = [
        {
          id: 'note-1',
          title: 'Original',
          content: 'Content',
          topic_id: 'topic-1'
        }
      ]
    })

    it('should handle note not found (PGRST116)', async () => {
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

      const result = await notesStore.updateNote('non-existent', { title: 'Updated' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.UPDATE_NOT_FOUND)
    })

    it('should handle invalid topic reference during update', async () => {
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '23503',
                  message: 'violates foreign key constraint "notes_topic_id_fkey"'
                }
              })
            }))
          }))
        }))
      })

      const result = await notesStore.updateNote('note-1', { topic_id: 'invalid' })

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.UPDATE_INVALID_TOPIC)
    })
  })

  describe('Note Deletion - Error Handling', () => {
    beforeEach(() => {
      notesStore.notes = [
        { id: 'note-1', title: 'Note 1' },
        { id: 'note-2', title: 'Note 2' }
      ]
    })

    it('should handle note not found during deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'PGRST116' }
          })
        }))
      })

      const result = await notesStore.deleteNote('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.DELETE_NOT_FOUND)
    })

    it('should handle permission denied during deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'permission denied' }
          })
        }))
      })

      const result = await notesStore.deleteNote('note-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.DELETE_PERMISSION_DENIED)
    })

    it('should remove note from store on successful deletion', async () => {
      setMockFromReturn({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })

      const result = await notesStore.deleteNote('note-1')

      expect(result.success).toBe(true)
      expect(notesStore.notes.find((n) => n.id === 'note-1')).toBeUndefined()
    })
  })

  describe('Toggle Operations - Error Handling', () => {
    beforeEach(() => {
      notesStore.notes = [{ id: 'note-1', title: 'Test', is_pinned: false, archived_at: null }]
    })

    it('should handle errors in togglePin', async () => {
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

      const result = await notesStore.togglePin('note-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.UPDATE_NOT_FOUND)
    })

    it('should handle errors in toggleArchive', async () => {
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            }))
          }))
        }))
      })

      const result = await notesStore.toggleArchive('note-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe(NOTE_ERRORS.UPDATE_FAILED)
    })
  })

  describe('Error Recovery and Consistency', () => {
    it('should maintain topic list consistency after failed creation', async () => {
      const initialTopics = [...notesStore.topics]

      setMockFromReturn({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505' }
            })
          }))
        }))
      })

      await notesStore.createTopic({ name: 'Duplicate', color: '#000' })

      expect(notesStore.topics).toEqual(initialTopics)
    })

    it('should maintain notes list consistency after failed creation', async () => {
      const initialNotes = [...notesStore.notes]

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

      await notesStore.createNote({ content: 'Missing title' })

      expect(notesStore.notes).toEqual(initialNotes)
    })

    it('should not update store state on failed updates', async () => {
      notesStore.notes = [{ id: 'note-1', title: 'Original', is_pinned: false }]

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

      await notesStore.togglePin('note-1')

      // Note should remain unchanged
      expect(notesStore.notes[0].is_pinned).toBe(false)
    })
  })
})
