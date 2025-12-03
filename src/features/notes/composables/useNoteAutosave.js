import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useNotesStore } from '../store'
import { logger } from '@/utils/logger'

/**
 * Composable for handling note autosave functionality
 * @param {Object} options - Autosave configuration
 * @param {string} options.noteId - Existing note ID (null for new notes)
 * @param {string} options.topicId - Topic ID for new notes
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @returns {Object} Autosave controls and status
 */
export function useNoteAutosave(options = {}) {
  const { noteId = null, topicId = null, debounceMs = 3000 } = options

  const notesStore = useNotesStore()

  const saveStatus = ref('')
  const isSaving = ref(false)
  const lastSavedContent = ref(null)
  const hasUnsavedChanges = ref(false)

  // Debounced save function
  const debouncedSave = useDebounceFn(async (noteData) => {
    await performSave(noteData)
  }, debounceMs)

  /**
   * Perform the actual save operation
   * @param {Object} noteData - Note data to save
   */
  const performSave = async (noteData) => {
    if (!noteData.title && !noteData.content) {
      saveStatus.value = ''
      return
    }

    // Don't save if content hasn't changed
    const currentContent = JSON.stringify(noteData)
    if (currentContent === lastSavedContent.value) {
      return
    }

    isSaving.value = true
    saveStatus.value = 'Saving...'

    try {
      let result

      if (noteId) {
        // Update existing note
        result = await notesStore.updateNote(noteId, noteData)
      } else if (topicId) {
        // Create new note
        result = await notesStore.createNote({
          ...noteData,
          topic_id: topicId
        })

        // Update noteId for future saves
        if (result.success && result.data) {
          // This would need to be communicated back to parent component
          // via event or callback
        }
      }

      if (result && result.success) {
        saveStatus.value = 'Saved'
        lastSavedContent.value = currentContent
        hasUnsavedChanges.value = false

        // Clear status after 2 seconds
        setTimeout(() => {
          if (saveStatus.value === 'Saved') {
            saveStatus.value = ''
          }
        }, 2000)
      } else {
        throw new Error(result?.error || 'Failed to save')
      }
    } catch (error) {
      logger.error('Autosave error:', error)
      saveStatus.value = 'Error saving'
      hasUnsavedChanges.value = true

      // Show error for longer
      setTimeout(() => {
        if (saveStatus.value === 'Error saving') {
          saveStatus.value = ''
        }
      }, 5000)
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Trigger autosave with debouncing
   * @param {Object} noteData - Note data { title, content }
   */
  const triggerAutosave = (noteData) => {
    if (!noteData.title || !noteData.content) {
      return
    }

    hasUnsavedChanges.value = true
    debouncedSave(noteData)
  }

  /**
   * Force immediate save without debouncing
   * @param {Object} noteData - Note data { title, content }
   */
  const forceSave = async (noteData) => {
    // Cancel any pending debounced save
    if (debouncedSave && typeof debouncedSave.cancel === 'function') {
      debouncedSave.cancel()
    }
    await performSave(noteData)
  }

  /**
   * Cancel pending autosave
   */
  const cancelAutosave = () => {
    if (debouncedSave && typeof debouncedSave.cancel === 'function') {
      debouncedSave.cancel()
    }
    saveStatus.value = ''
  }

  /**
   * Check if there are unsaved changes
   * @param {Object} currentData - Current note data
   * @returns {boolean} True if there are unsaved changes
   */
  const checkUnsavedChanges = (currentData) => {
    const current = JSON.stringify(currentData)
    return current !== lastSavedContent.value
  }

  return {
    // State
    saveStatus,
    isSaving,
    hasUnsavedChanges,

    // Methods
    triggerAutosave,
    forceSave,
    cancelAutosave,
    checkUnsavedChanges
  }
}
