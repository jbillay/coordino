import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNoteAutosave } from '../useNoteAutosave'
import { useNotesStore } from '../../store'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../store', () => ({
  useNotesStore: vi.fn()
}))

describe('useNoteAutosave', () => {
  let mockNotesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mockNotesStore = {
      updateNote: vi.fn().mockResolvedValue({ success: true }),
      createNote: vi.fn().mockResolvedValue({ success: true, data: { id: 'new-id' } })
    }
    useNotesStore.mockReturnValue(mockNotesStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should trigger debounced save on triggerAutosave', () => {
    const { triggerAutosave } = useNoteAutosave()
    triggerAutosave({ title: 'T', content: 'C' })
    expect(useNotesStore().updateNote).not.toHaveBeenCalled() // Not called immediately
  })

  it('should call performSave directly on forceSave', async () => {
    const { forceSave } = useNoteAutosave({ noteId: 'note-1' })
    await forceSave({ title: 'T', content: 'C' })
    expect(mockNotesStore.updateNote).toHaveBeenCalled()
  })
})
