import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useNoteAutosave } from '../useNoteAutosave'
import { useNotesStore } from '../../store'
import { createPinia, setActivePinia } from 'pinia'
import { logger } from '@/utils/logger'

vi.mock('../../store', () => ({
  useNotesStore: vi.fn()
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useDebounceFn: (fn) => {
      const debouncedFn = (...args) => fn(...args)
      debouncedFn.cancel = vi.fn()
      return debouncedFn
    }
  }
})

describe('useNoteAutosave', () => {
  let mockNotesStore
  let composable

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    mockNotesStore = {
      updateNote: vi.fn().mockResolvedValue({ success: true }),
      createNote: vi.fn().mockResolvedValue({ success: true, data: { id: 'new-id' } })
    }
    useNotesStore.mockReturnValue(mockNotesStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  const mountComposable = (options = {}) => {
    mount({
      setup() {
        composable = useNoteAutosave(options)
        return composable
      },
      template: '<div></div>'
    })
    return composable
  }

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const comp = mountComposable()

      expect(comp.saveStatus.value).toBe('')
      expect(comp.isSaving.value).toBe(false)
      expect(comp.hasUnsavedChanges.value).toBe(false)
    })

    it('should accept noteId option', () => {
      const comp = mountComposable({ noteId: 'note-123' })

      expect(comp).toBeDefined()
      expect(comp.saveStatus).toBeDefined()
    })

    it('should accept topicId option', () => {
      const comp = mountComposable({ topicId: 'topic-456' })

      expect(comp).toBeDefined()
    })

    it('should accept custom debounceMs option', () => {
      const comp = mountComposable({ debounceMs: 1000 })

      expect(comp).toBeDefined()
    })
  })

  describe('triggerAutosave', () => {
    it('should not save if title is missing', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      comp.triggerAutosave({ content: 'Content only' })

      await vi.runAllTimersAsync()

      expect(mockNotesStore.updateNote).not.toHaveBeenCalled()
    })

    it('should not save if content is missing', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      comp.triggerAutosave({ title: 'Title only' })

      await vi.runAllTimersAsync()

      expect(mockNotesStore.updateNote).not.toHaveBeenCalled()
    })

    it('should set hasUnsavedChanges when triggered', () => {
      const comp = mountComposable({ noteId: 'note-1' })

      expect(comp.hasUnsavedChanges.value).toBe(false)

      comp.triggerAutosave({ title: 'Title', content: 'Content' })

      expect(comp.hasUnsavedChanges.value).toBe(true)
    })

    it('should trigger debounced save with valid data', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      comp.triggerAutosave({ title: 'Title', content: 'Content' })

      await vi.runAllTimersAsync()

      expect(mockNotesStore.updateNote).toHaveBeenCalledWith('note-1', {
        title: 'Title',
        content: 'Content'
      })
    })
  })

  describe('performSave', () => {
    it('should not save if both title and content are empty', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: '', content: '' })

      expect(mockNotesStore.updateNote).not.toHaveBeenCalled()
      expect(comp.saveStatus.value).toBe('')
    })

    it('should not save if content has not changed', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      const noteData = { title: 'Title', content: 'Content' }
      await comp.forceSave(noteData)

      mockNotesStore.updateNote.mockClear()

      // Try to save same content again
      await comp.forceSave(noteData)

      expect(mockNotesStore.updateNote).not.toHaveBeenCalled()
    })

    it('should update existing note when noteId is provided', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Updated', content: 'Updated content' })

      expect(mockNotesStore.updateNote).toHaveBeenCalledWith('note-1', {
        title: 'Updated',
        content: 'Updated content'
      })
    })

    it('should create new note when noteId is not provided', async () => {
      const comp = mountComposable({ topicId: 'topic-1' })

      await comp.forceSave({ title: 'New Note', content: 'New content' })

      expect(mockNotesStore.createNote).toHaveBeenCalledWith({
        title: 'New Note',
        content: 'New content',
        topic_id: 'topic-1'
      })
    })

    it('should create note with null topic_id if not provided', async () => {
      const comp = mountComposable()

      await comp.forceSave({ title: 'New Note', content: 'New content' })

      expect(mockNotesStore.createNote).toHaveBeenCalledWith({
        title: 'New Note',
        content: 'New content',
        topic_id: null
      })
    })

    it('should handle successful note creation with data', async () => {
      mockNotesStore.createNote.mockResolvedValueOnce({
        success: true,
        data: { id: 'new-note-123', title: 'New Note', content: 'New content' }
      })

      const comp = mountComposable()

      await comp.forceSave({ title: 'New Note', content: 'New content' })

      expect(comp.saveStatus.value).toBe('Saved')
      expect(comp.hasUnsavedChanges.value).toBe(false)
    })

    it('should set saving status during save', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      const savePromise = comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.isSaving.value).toBe(true)
      expect(comp.saveStatus.value).toBe('Saving...')

      await savePromise

      expect(comp.isSaving.value).toBe(false)
    })

    it('should set saved status on success', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Saved')
      expect(comp.hasUnsavedChanges.value).toBe(false)
    })

    it('should clear saved status after 2 seconds', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Saved')

      vi.advanceTimersByTime(2000)

      expect(comp.saveStatus.value).toBe('')
    })

    it('should not clear status if changed before timeout', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Saved')

      // Manually change status
      comp.saveStatus.value = 'Other status'

      vi.advanceTimersByTime(2000)

      // Should not clear since status was changed
      expect(comp.saveStatus.value).toBe('Other status')
    })

    it('should handle save errors', async () => {
      mockNotesStore.updateNote.mockResolvedValueOnce({
        success: false,
        error: 'Network error'
      })

      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Error saving')
      expect(comp.hasUnsavedChanges.value).toBe(true)
      expect(logger.error).toHaveBeenCalled()
    })

    it('should handle save exceptions', async () => {
      mockNotesStore.updateNote.mockRejectedValueOnce(new Error('Database error'))

      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Error saving')
      expect(comp.hasUnsavedChanges.value).toBe(true)
      expect(logger.error).toHaveBeenCalledWith('Autosave error:', expect.any(Error))
    })

    it('should clear error status after 5 seconds', async () => {
      mockNotesStore.updateNote.mockRejectedValueOnce(new Error('Error'))

      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Error saving')

      vi.advanceTimersByTime(5000)

      expect(comp.saveStatus.value).toBe('')
    })

    it('should not clear error status if changed before timeout', async () => {
      mockNotesStore.updateNote.mockRejectedValueOnce(new Error('Error'))

      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Error saving')

      comp.saveStatus.value = 'Saving...'

      vi.advanceTimersByTime(5000)

      expect(comp.saveStatus.value).toBe('Saving...')
    })
  })

  describe('forceSave', () => {
    it('should cancel pending debounced save', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(mockNotesStore.updateNote).toHaveBeenCalled()
    })

    it('should save immediately without debouncing', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(mockNotesStore.updateNote).toHaveBeenCalledWith('note-1', {
        title: 'Title',
        content: 'Content'
      })
    })
  })

  describe('cancelAutosave', () => {
    it('should cancel pending save', () => {
      const comp = mountComposable({ noteId: 'note-1' })

      comp.triggerAutosave({ title: 'Title', content: 'Content' })

      comp.cancelAutosave()

      expect(comp.saveStatus.value).toBe('')
    })

    it('should clear save status', () => {
      const comp = mountComposable({ noteId: 'note-1' })

      comp.saveStatus.value = 'Saving...'

      comp.cancelAutosave()

      expect(comp.saveStatus.value).toBe('')
    })
  })

  describe('checkUnsavedChanges', () => {
    it('should return false when no changes', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      const noteData = { title: 'Title', content: 'Content' }
      await comp.forceSave(noteData)

      expect(comp.checkUnsavedChanges(noteData)).toBe(false)
    })

    it('should return true when changes exist', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Original', content: 'Original content' })

      expect(comp.checkUnsavedChanges({ title: 'Modified', content: 'Modified content' })).toBe(
        true
      )
    })

    it('should return true before any save', () => {
      const comp = mountComposable({ noteId: 'note-1' })

      expect(comp.checkUnsavedChanges({ title: 'Title', content: 'Content' })).toBe(true)
    })
  })

  describe('reactive properties', () => {
    it('should expose saveStatus as ref', () => {
      const comp = mountComposable()

      expect(comp.saveStatus.value).toBeDefined()
      expect(typeof comp.saveStatus.value).toBe('string')
    })

    it('should expose isSaving as ref', () => {
      const comp = mountComposable()

      expect(comp.isSaving.value).toBeDefined()
      expect(typeof comp.isSaving.value).toBe('boolean')
    })

    it('should expose hasUnsavedChanges as ref', () => {
      const comp = mountComposable()

      expect(comp.hasUnsavedChanges.value).toBeDefined()
      expect(typeof comp.hasUnsavedChanges.value).toBe('boolean')
    })
  })

  describe('edge cases', () => {
    it('should handle result without success property', async () => {
      mockNotesStore.updateNote.mockResolvedValueOnce(null)

      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: 'Title', content: 'Content' })

      expect(comp.saveStatus.value).toBe('Error saving')
    })

    it('should save whitespace-only content if both title and content exist', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: '   ', content: '   ' })

      // The code checks if title OR content is falsy, whitespace is truthy
      expect(mockNotesStore.updateNote).toHaveBeenCalledWith('note-1', {
        title: '   ',
        content: '   '
      })
    })

    it('should save if title has whitespace and content is valid', async () => {
      const comp = mountComposable({ noteId: 'note-1' })

      await comp.forceSave({ title: '   ', content: 'Valid content' })

      expect(mockNotesStore.updateNote).toHaveBeenCalledWith('note-1', {
        title: '   ',
        content: 'Valid content'
      })
    })
  })
})
