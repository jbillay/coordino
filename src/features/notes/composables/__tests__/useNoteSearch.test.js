import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useNoteSearch } from '../useNoteSearch'
import { useNotesStore } from '../../store'
import { createPinia, setActivePinia } from 'pinia'
import * as utils from '../../utils'

vi.mock('../../store', () => ({
  useNotesStore: vi.fn()
}))

vi.mock('../../utils', () => ({
  highlightSearchTerms: vi.fn((text) => `<mark>${text}</mark>`),
  getSearchSnippet: vi.fn((content, query, length) => content.substring(0, length))
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

describe('useNoteSearch', () => {
  let mockNotesStore
  let composable

  beforeEach(() => {
    setActivePinia(createPinia())
    mockNotesStore = {
      searchNotes: vi.fn().mockResolvedValue({ success: true, data: [] }),
      searchQuery: ''
    }
    useNotesStore.mockReturnValue(mockNotesStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mountComposable = (options = {}) => {
    mount({
      setup() {
        composable = useNoteSearch(options)
        return composable
      },
      template: '<div></div>'
    })
    return composable
  }

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const comp = mountComposable()

      expect(comp.searchQuery.value).toBe('')
      expect(comp.searchResults.value).toEqual([])
      expect(comp.isSearching.value).toBe(false)
      expect(comp.searchError.value).toBe(null)
    })

    it('should accept custom debounceMs option', () => {
      const comp = mountComposable({ debounceMs: 500 })

      expect(comp).toBeDefined()
      expect(comp.searchQuery).toBeDefined()
    })
  })

  describe('search', () => {
    it('should set search query', () => {
      const comp = mountComposable()

      comp.search('test query')

      expect(comp.searchQuery.value).toBe('test query')
      expect(mockNotesStore.searchQuery).toBe('test query')
    })

    it('should clear results for empty query', () => {
      const comp = mountComposable()

      comp.search('')

      expect(comp.searchResults.value).toEqual([])
      expect(mockNotesStore.searchNotes).not.toHaveBeenCalled()
    })

    it('should clear results for whitespace-only query', () => {
      const comp = mountComposable()

      comp.search('   ')

      expect(comp.searchResults.value).toEqual([])
      expect(mockNotesStore.searchNotes).not.toHaveBeenCalled()
    })

    it('should trigger debounced search with valid query', async () => {
      const comp = mountComposable()

      await comp.search('test')

      expect(mockNotesStore.searchNotes).toHaveBeenCalledWith('test')
    })

    it('should call clearSearch for empty query', () => {
      const comp = mountComposable()

      comp.search('test')
      expect(comp.searchQuery.value).toBe('test')

      comp.search('')

      expect(comp.searchQuery.value).toBe('')
      expect(comp.searchResults.value).toEqual([])
    })
  })

  describe('performSearch', () => {
    it('should not search if query is empty', async () => {
      const comp = mountComposable()

      await comp.search('')

      expect(mockNotesStore.searchNotes).not.toHaveBeenCalled()
      expect(comp.searchResults.value).toEqual([])
    })

    it('should not search if query is whitespace only', async () => {
      const comp = mountComposable()

      await comp.search('   ')

      expect(mockNotesStore.searchNotes).not.toHaveBeenCalled()
    })

    it('should clear results and error for empty query', async () => {
      const comp = mountComposable()

      comp.searchResults.value = [{ id: 1 }]
      comp.searchError.value = 'Some error'

      // Call performSearch directly with empty query
      comp.searchQuery.value = ''
      await comp.search('')

      expect(comp.searchResults.value).toEqual([])
      expect(comp.searchError.value).toBe(null)
    })

    it('should set isSearching during search', async () => {
      const comp = mountComposable()

      const searchPromise = comp.search('test')

      expect(comp.isSearching.value).toBe(true)

      await searchPromise

      expect(comp.isSearching.value).toBe(false)
    })

    it('should clear error before search', async () => {
      const comp = mountComposable()

      comp.searchError.value = 'Previous error'

      await comp.search('test')

      expect(comp.searchError.value).toBe(null)
    })

    it('should set search results on success', async () => {
      const mockResults = [
        { id: 1, title: 'Note 1', content: 'Content 1' },
        { id: 2, title: 'Note 2', content: 'Content 2' }
      ]

      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: mockResults
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.searchResults.value).toEqual(mockResults)
    })

    it('should handle null data in successful response', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: null
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.searchResults.value).toEqual([])
    })

    it('should handle search errors', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: false,
        error: 'Network error'
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.searchError.value).toBe('Network error')
      expect(comp.searchResults.value).toEqual([])
    })

    it('should handle search exceptions', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockNotesStore.searchNotes.mockRejectedValueOnce(new Error('Database error'))

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.searchError.value).toBe('Database error')
      expect(comp.searchResults.value).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle errors without message', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: false
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.searchError.value).toBe('Search failed')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('clearSearch', () => {
    it('should clear all search state', async () => {
      const comp = mountComposable()

      await comp.search('test')
      comp.searchResults.value = [{ id: 1 }]
      comp.searchError.value = 'Some error'

      comp.clearSearch()

      expect(comp.searchQuery.value).toBe('')
      expect(comp.searchResults.value).toEqual([])
      expect(comp.searchError.value).toBe(null)
      expect(mockNotesStore.searchQuery).toBe('')
    })

    it('should cancel pending debounced search', () => {
      const comp = mountComposable()

      comp.search('test')
      comp.clearSearch()

      expect(comp.searchQuery.value).toBe('')
    })
  })

  describe('getHighlightedText', () => {
    it('should call highlightSearchTerms with query', () => {
      const comp = mountComposable()

      comp.searchQuery.value = 'test'

      const result = comp.getHighlightedText('This is a test')

      expect(utils.highlightSearchTerms).toHaveBeenCalledWith('This is a test', 'test')
      expect(result).toBe('<mark>This is a test</mark>')
    })

    it('should return original text if no query', () => {
      const comp = mountComposable()

      comp.searchQuery.value = ''

      comp.getHighlightedText('This is text')

      expect(utils.highlightSearchTerms).toHaveBeenCalledWith('This is text', '')
    })
  })

  describe('getContentSnippet', () => {
    it('should call getSearchSnippet with default length', () => {
      const comp = mountComposable()

      comp.searchQuery.value = 'test'

      comp.getContentSnippet('This is a long content with test in it')

      expect(utils.getSearchSnippet).toHaveBeenCalledWith(
        'This is a long content with test in it',
        'test',
        80
      )
    })

    it('should work with empty query', () => {
      const comp = mountComposable()

      comp.searchQuery.value = ''

      comp.getContentSnippet('Some content')

      expect(utils.getSearchSnippet).toHaveBeenCalledWith('Some content', '', 80)
    })
  })

  describe('computed properties', () => {
    it('hasResults should be false with no results', () => {
      const comp = mountComposable()

      expect(comp.hasResults.value).toBe(false)
    })

    it('hasResults should be true with results', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [{ id: 1 }]
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.hasResults.value).toBe(true)
    })

    it('resultCount should return correct count', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [{ id: 1 }, { id: 2 }, { id: 3 }]
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.resultCount.value).toBe(3)
    })

    it('hasQuery should be false with empty query', () => {
      const comp = mountComposable()

      expect(comp.hasQuery.value).toBe(false)
    })

    it('hasQuery should be true with query', () => {
      const comp = mountComposable()

      comp.search('test')

      expect(comp.hasQuery.value).toBe(true)
    })

    it('hasQuery should be false with whitespace-only query', () => {
      const comp = mountComposable()

      comp.searchQuery.value = '   '

      expect(comp.hasQuery.value).toBe(false)
    })

    it('isEmpty should be false when no query', () => {
      const comp = mountComposable()

      expect(comp.isEmpty.value).toBe(false)
    })

    it('isEmpty should be false when searching', async () => {
      const comp = mountComposable()

      comp.searchQuery.value = 'test'
      comp.isSearching.value = true

      expect(comp.isEmpty.value).toBe(false)
    })

    it('isEmpty should be true when query exists but no results', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: []
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.isEmpty.value).toBe(true)
    })

    it('isEmpty should be false when results exist', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [{ id: 1 }]
      })

      const comp = mountComposable()

      await comp.search('test')

      expect(comp.isEmpty.value).toBe(false)
    })
  })

  describe('groupedResults', () => {
    it('should group results by topic', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [
          { id: 1, topic: { id: 'topic-1', name: 'Work', color: '#ff0000' } },
          { id: 2, topic: { id: 'topic-1', name: 'Work', color: '#ff0000' } },
          { id: 3, topic: { id: 'topic-2', name: 'Personal', color: '#00ff00' } }
        ]
      })

      const comp = mountComposable()

      await comp.search('test')

      const grouped = comp.groupedResults.value

      expect(grouped).toHaveLength(2)
      expect(grouped[0].notes).toHaveLength(2)
      expect(grouped[1].notes).toHaveLength(1)
    })

    it('should handle notes without topics', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [
          { id: 1, topic: null },
          { id: 2, topic: {} }
        ]
      })

      const comp = mountComposable()

      await comp.search('test')

      const grouped = comp.groupedResults.value

      expect(grouped).toBeDefined()
      expect(grouped.length).toBeGreaterThan(0)
    })

    it('should use default color for topics without color', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [{ id: 1, topic: { id: 'topic-1', name: 'Work' } }]
      })

      const comp = mountComposable()

      await comp.search('test')

      const grouped = comp.groupedResults.value

      expect(grouped[0].topic.color).toBe('#6b7280')
    })

    it('should use "Unknown" for topics without name', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [{ id: 1, topic: { id: 'topic-1' } }]
      })

      const comp = mountComposable()

      await comp.search('test')

      const grouped = comp.groupedResults.value

      expect(grouped[0].topic.name).toBe('Unknown')
    })

    it('should return empty array with no results', () => {
      const comp = mountComposable()

      expect(comp.groupedResults.value).toEqual([])
    })
  })

  describe('reactive state', () => {
    it('should expose searchQuery as ref', () => {
      const comp = mountComposable()

      expect(comp.searchQuery.value).toBeDefined()
      expect(typeof comp.searchQuery.value).toBe('string')
    })

    it('should expose searchResults as ref', () => {
      const comp = mountComposable()

      expect(comp.searchResults.value).toBeDefined()
      expect(Array.isArray(comp.searchResults.value)).toBe(true)
    })

    it('should expose isSearching as ref', () => {
      const comp = mountComposable()

      expect(comp.isSearching.value).toBeDefined()
      expect(typeof comp.isSearching.value).toBe('boolean')
    })

    it('should expose searchError as ref', () => {
      const comp = mountComposable()

      expect(comp.searchError.value).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle multiple rapid searches', async () => {
      const comp = mountComposable()

      comp.search('test1')
      comp.search('test2')
      await comp.search('test3')

      expect(comp.searchQuery.value).toBe('test3')
      expect(mockNotesStore.searchNotes).toHaveBeenLastCalledWith('test3')
    })

    it('should handle search after error', async () => {
      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: false,
        error: 'Error'
      })

      const comp = mountComposable()

      await comp.search('fail')

      expect(comp.searchError.value).toBe('Error')

      mockNotesStore.searchNotes.mockResolvedValueOnce({
        success: true,
        data: [{ id: 1 }]
      })

      await comp.search('success')

      expect(comp.searchError.value).toBe(null)
      expect(comp.searchResults.value).toHaveLength(1)
    })
  })
})
