import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useNoteSearch } from '../useNoteSearch'
import { useNotesStore } from '../../store'
import { ref } from 'vue'

vi.mock('../../store', () => ({
  useNotesStore: vi.fn()
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn) => {
    const debouncedFn = vi.fn(fn)
    debouncedFn.cancel = vi.fn()
    return debouncedFn
  }
}))

describe('useNoteSearch', () => {
  let mockNotesStore

  beforeEach(() => {
    mockNotesStore = {
      searchNotes: vi.fn().mockResolvedValue({ success: true, data: [] }),
      loading: ref(false),
      searchQuery: ''
    }
    useNotesStore.mockReturnValue(mockNotesStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should call searchNotes on search', async () => {
    const { search } = useNoteSearch()
    await search('test')
    expect(mockNotesStore.searchNotes).toHaveBeenCalledWith('test')
  })

  it('should not call searchNotes if query is empty', async () => {
    const { search } = useNoteSearch()
    await search(' ')
    expect(mockNotesStore.searchNotes).not.toHaveBeenCalled()
  })

  it('should clear search query and results on clearSearch', async () => {
    const { searchQuery, searchResults, search, clearSearch } = useNoteSearch()
    mockNotesStore.searchNotes.mockResolvedValue({ success: true, data: [{ id: 1 }] })

    await search('test')
    searchResults.value = [{ id: 1 }]

    // Values should be set after search
    expect(searchQuery.value).toBe('test')

    clearSearch()

    expect(searchQuery.value).toBe('')
    expect(searchResults.value).toEqual([])
    expect(mockNotesStore.searchQuery).toBe('')
  })

  it('should update computed properties correctly', async () => {
    const { search, hasResults, resultCount, hasQuery, isEmpty, searchResults, isSearching } =
      useNoteSearch()

    expect(hasResults.value).toBe(false)
    expect(resultCount.value).toBe(0)
    expect(hasQuery.value).toBe(false)
    expect(isEmpty.value).toBe(false)

    // Simulate search with results
    mockNotesStore.searchNotes.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    await search('test')
    searchResults.value = [{ id: 1 }]
    isSearching.value = false

    expect(hasResults.value).toBe(true)
    expect(resultCount.value).toBe(1)
    expect(hasQuery.value).toBe(true)
    expect(isEmpty.value).toBe(false)

    // Simulate search with no results
    mockNotesStore.searchNotes.mockResolvedValue({ success: true, data: [] })
    await search('no-results')
    searchResults.value = []
    isSearching.value = false

    expect(hasResults.value).toBe(false)
    expect(resultCount.value).toBe(0)
    expect(hasQuery.value).toBe(true)
    expect(isEmpty.value).toBe(true)
  })
})
