import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useNotesStore } from '../store'
import { highlightSearchTerms, getSearchSnippet } from '../utils'

/**
 * Composable for handling note search functionality
 * @param {Object} options - Search configuration
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @returns {Object} Search controls and results
 */
export function useNoteSearch(options = {}) {
  const { debounceMs = 300 } = options

  const notesStore = useNotesStore()

  const searchQuery = ref('')
  const searchResults = ref([])
  const isSearching = ref(false)
  const searchError = ref(null)

  // Debounced search function
  const debouncedSearch = useDebounceFn(async (query) => {
    await performSearch(query)
  }, debounceMs)

  /**
   * Perform the actual search operation
   * @param {string} query - Search query
   */
  const performSearch = async (query) => {
    if (!query || query.trim().length === 0) {
      searchResults.value = []
      searchError.value = null
      return
    }

    isSearching.value = true
    searchError.value = null

    try {
      const result = await notesStore.searchNotes(query)

      if (result.success) {
        searchResults.value = result.data || []
      } else {
        throw new Error(result.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      searchError.value = error.message
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Trigger search with debouncing
   * @param {string} query - Search query
   */
  const search = (query) => {
    searchQuery.value = query
    notesStore.searchQuery = query

    if (!query || query.trim().length === 0) {
      clearSearch()
      return
    }

    debouncedSearch(query)
  }

  /**
   * Clear search results and query
   */
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchError.value = null
    notesStore.searchQuery = ''
    debouncedSearch.cancel()
  }

  /**
   * Get highlighted version of text
   * @param {string} text - Text to highlight
   * @returns {string} HTML with highlighted terms
   */
  const getHighlightedText = (text) => highlightSearchTerms(text, searchQuery.value)

  /**
   * Get snippet of content around search match
   * @param {string} content - Full content
   * @returns {string} Content snippet
   */
  const getContentSnippet = (content) => getSearchSnippet(content, searchQuery.value, 80)

  // Computed properties
  const hasResults = computed(() => searchResults.value.length > 0)

  const resultCount = computed(() => searchResults.value.length)

  const hasQuery = computed(() => searchQuery.value.trim().length > 0)

  const isEmpty = computed(() => hasQuery.value && !isSearching.value && !hasResults.value)

  /**
   * Group search results by topic
   * @returns {Array} Results grouped by topic { topic, notes }
   */
  const groupedResults = computed(() => {
    const groups = new Map()

    searchResults.value.forEach((note) => {
      const topicId = note.topic?.id
      const topicName = note.topic?.name || 'Unknown'
      const topicColor = note.topic?.color || '#6b7280'

      if (!groups.has(topicId)) {
        groups.set(topicId, {
          topic: {
            id: topicId,
            name: topicName,
            color: topicColor
          },
          notes: []
        })
      }

      groups.get(topicId).notes.push(note)
    })

    return Array.from(groups.values())
  })

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    searchError,

    // Computed
    hasResults,
    resultCount,
    hasQuery,
    isEmpty,
    groupedResults,

    // Methods
    search,
    clearSearch,
    getHighlightedText,
    getContentSnippet
  }
}
