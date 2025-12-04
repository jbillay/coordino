import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import NotesView from '../NotesView.vue'
import { createTestingPinia } from '@pinia/testing'
import { useNotesStore } from '@/features/notes/store'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

// Mock composables
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn()
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn()
}))

vi.mock('@/features/notes/composables/useNoteKeyboardShortcuts', () => ({
  useNoteKeyboardShortcuts: vi.fn()
}))

vi.mock('@/features/notes/composables/useAccessibilityAnnouncements', () => ({
  useAccessibilityAnnouncements: vi.fn(() => ({
    announcement: '',
    announcementPriority: 'polite',
    announceSearchResults: vi.fn(),
    announceNavigation: vi.fn()
  }))
}))

describe('NotesView.vue', () => {
  let router
  let route
  let toast
  let pinia
  let notesStore

  const mockTopics = [
    { id: '1', name: 'Work', user_id: 'user1', created_at: '2024-01-01' },
    { id: '2', name: 'Personal', user_id: 'user1', created_at: '2024-01-01' }
  ]

  const mockNotes = [
    {
      id: 'note1',
      title: 'Test Note 1',
      content: 'Content 1',
      topic_id: '1',
      is_pinned: false,
      archived_at: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: 'note2',
      title: 'Test Note 2',
      content: 'Content 2',
      topic_id: '2',
      is_pinned: true,
      archived_at: null,
      created_at: '2024-01-02',
      updated_at: '2024-01-02'
    }
  ]

  beforeEach(() => {
    // Setup router mock
    router = {
      push: vi.fn()
    }
    route = {
      name: 'notes',
      query: {}
    }

    vi.mocked(useRouter).mockReturnValue(router)
    vi.mocked(useRoute).mockReturnValue(route)

    // Setup toast mock
    toast = {
      add: vi.fn()
    }
    vi.mocked(useToast).mockReturnValue(toast)

    // Setup pinia
    pinia = createTestingPinia({
      stubActions: false
    })

    // Setup notes store
    notesStore = useNotesStore(pinia)
    notesStore.notes = [...mockNotes]
    notesStore.topics = [...mockTopics]
    notesStore.filteredNotes = [...mockNotes]
    notesStore.loading = false
    notesStore.error = null
    notesStore.selectedTopicId = null
    notesStore.selectedTopic = null

    // Mock store methods
    notesStore.fetchTopics = vi.fn().mockResolvedValue({ success: true })
    notesStore.fetchNotes = vi.fn().mockResolvedValue({ success: true })
    notesStore.createNote = vi.fn().mockResolvedValue({ success: true, data: mockNotes[0] })
    notesStore.updateNote = vi.fn().mockResolvedValue({ success: true })
    notesStore.deleteNote = vi.fn().mockResolvedValue({ success: true })
    notesStore.togglePin = vi.fn().mockResolvedValue({ success: true })
    notesStore.toggleArchive = vi.fn().mockResolvedValue({ success: true })
    notesStore.searchNotes = vi.fn().mockResolvedValue({ success: true, data: [] })
    notesStore.setupRealtimeSubscriptions = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mountComponent = (options = {}) =>
    mount(NotesView, {
      global: {
        plugins: [pinia],
        directives: {
          tooltip: () => {}
        },
        stubs: {
          AppLayout: {
            template: '<div class="app-layout"><slot /></div>'
          },
          TopicList: {
            template: '<div class="topic-list">Topics</div>'
          },
          NoteList: {
            name: 'NoteList',
            template: '<div class="note-list" data-test="note-list"></div>',
            props: ['notes', 'title', 'loading', 'emptyStateTitle', 'emptyStateMessage'],
            emits: ['open', 'create', 'pin', 'archive', 'delete']
          },
          NoteEditor: {
            name: 'NoteEditor',
            template: '<div class="note-editor" data-test="note-editor"></div>',
            props: ['note', 'topicId'],
            emits: ['close', 'save', 'pin', 'archive', 'delete']
          },
          NoteSearchBar: {
            name: 'NoteSearchBar',
            template: '<div class="search-bar" data-test="search-bar"></div>',
            props: ['resultCount', 'searchTime'],
            emits: ['search', 'clear']
          },
          NoteSearchResults: {
            name: 'NoteSearchResults',
            template: '<div class="search-results" data-test="search-results"></div>',
            props: ['results', 'loading', 'searchQuery'],
            emits: ['select']
          },
          ConfirmDialog: {
            name: 'ConfirmDialog',
            template: '<div class="confirm-dialog" data-test="confirm-dialog"></div>',
            props: ['visible', 'header', 'message', 'severity', 'confirmLabel', 'confirmIcon'],
            emits: ['update:visible', 'confirm']
          },
          KeyboardShortcutsHelp: {
            template: '<div class="shortcuts-help"></div>',
            props: ['visible'],
            emits: ['update:visible']
          },
          AriaLiveRegion: {
            template: '<div class="aria-live"></div>',
            props: ['message', 'priority']
          },
          Toast: {
            template: '<div class="toast"></div>'
          },
          Button: {
            template: '<button @click="$emit(\'click\', $event)"><slot>{{ label }}</slot></button>',
            props: ['label', 'icon', 'class'],
            emits: ['click']
          }
        }
      },
      ...options
    })

  describe('Component Initialization', () => {
    it('renders correctly with default state', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.notes-view').exists()).toBe(true)
      expect(wrapper.find('.topic-list').exists()).toBe(true)
      expect(wrapper.find('.notes-header').exists()).toBe(true)
    })

    it('fetches topics and notes on mount', async () => {
      mountComponent()
      await nextTick()
      await nextTick() // Wait for onMounted hook to complete

      expect(notesStore.fetchTopics).toHaveBeenCalled()
      expect(notesStore.fetchNotes).toHaveBeenCalled()
      expect(notesStore.setupRealtimeSubscriptions).toHaveBeenCalled()
    })

    it('displays loading state', async () => {
      notesStore.loading = true
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Loading notes...')
    })

    it('displays error state', async () => {
      notesStore.loading = false
      notesStore.error = 'Failed to load notes'
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Failed to load notes')
      const retryButton = wrapper.findAll('button').find((b) => b.text().includes('Retry'))
      expect(retryButton).toBeDefined()
    })

    it('displays correct title for all notes', async () => {
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('All Notes')
    })

    it('displays correct title when topic is selected', async () => {
      notesStore.selectedTopicId = '1'
      notesStore.selectedTopic = mockTopics[0]
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Work')
    })
  })

  describe('Note Creation', () => {
    it('opens editor when create note button is clicked', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const createButton = wrapper.findAll('button').find((b) => b.text().includes('New Note'))
      await createButton.trigger('click')
      await nextTick()

      expect(wrapper.find('.note-editor').exists()).toBe(true)
      expect(wrapper.text()).toContain('New Note')
      expect(router.push).toHaveBeenCalledWith({ name: 'notes', query: { action: 'create' } })
    })

    it('creates a new note with default values', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const createButton = wrapper.findAll('button').find((b) => b.text().includes('New Note'))
      await createButton.trigger('click')
      await nextTick()

      const editor = wrapper.findComponent({ name: 'NoteEditor' })
      editor.vm.$emit('save', {
        title: 'New Note',
        content: 'New content'
      })
      await nextTick()

      expect(notesStore.createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Note',
          content: 'New content'
        })
      )
    })

    it('creates note with selected topic', async () => {
      notesStore.selectedTopicId = '1'
      const wrapper = mountComponent()
      await nextTick()

      const createButton = wrapper.findAll('button').find((b) => b.text().includes('New Note'))
      await createButton.trigger('click')
      await nextTick()

      const editor = wrapper.findComponent({ name: 'NoteEditor' })
      editor.vm.$emit('save', {
        title: 'New Note',
        content: 'New content'
      })
      await nextTick()

      expect(notesStore.createNote).toHaveBeenCalledWith({
        title: 'New Note',
        content: 'New content',
        topic_id: '1'
      })
    })

    it('shows error toast when note creation fails', async () => {
      notesStore.createNote.mockResolvedValueOnce({
        success: false,
        error: 'Failed to create note'
      })

      const wrapper = mountComponent()
      await nextTick()

      const createButton = wrapper.findAll('button').find((b) => b.text().includes('New Note'))
      await createButton.trigger('click')
      await nextTick()

      const editor = wrapper.findComponent({ name: 'NoteEditor' })
      editor.vm.$emit('save', {
        title: 'New Note',
        content: 'New content'
      })
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create note'
        })
      )
    })
  })

  describe('Note Editing', () => {
    it('opens editor when note is selected from list', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('open', mockNotes[0])
      await nextTick()

      expect(wrapper.find('.note-editor').exists()).toBe(true)
      expect(wrapper.text()).toContain('Edit Note')
      expect(router.push).toHaveBeenCalledWith({ name: 'notes', query: { noteId: 'note1' } })
    })

    it('updates existing note', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('open', mockNotes[0])
      await nextTick()

      const editor = wrapper.findComponent({ name: 'NoteEditor' })
      editor.vm.$emit('save', {
        id: 'note1',
        title: 'Updated Title',
        content: 'Updated content'
      })
      await nextTick()

      expect(notesStore.updateNote).toHaveBeenCalledWith('note1', {
        title: 'Updated Title',
        content: 'Updated content'
      })
    })

    it('closes editor and returns to list', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('open', mockNotes[0])
      await nextTick()

      const editor = wrapper.findComponent({ name: 'NoteEditor' })
      editor.vm.$emit('close')
      await nextTick()

      expect(wrapper.find('.note-list').exists()).toBe(true)
      expect(wrapper.find('.note-editor').exists()).toBe(false)
      expect(router.push).toHaveBeenCalledWith({ name: 'notes' })
    })
  })

  describe('Note Actions', () => {
    it('toggles pin on a note', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('pin', mockNotes[0])
      await nextTick()

      expect(notesStore.togglePin).toHaveBeenCalledWith('note1')
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Note Pinned'
        })
      )
    })

    it('toggles archive on a note', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('archive', mockNotes[0])
      await nextTick()

      expect(notesStore.toggleArchive).toHaveBeenCalledWith('note1')
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Note Archived'
        })
      )
    })

    it('shows delete confirmation dialog', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('delete', mockNotes[0])
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      expect(confirmDialog.props('visible')).toBe(true)
      expect(confirmDialog.props('message')).toContain('Test Note 1')
    })

    it('deletes note after confirmation', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('delete', mockNotes[0])
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      confirmDialog.vm.$emit('confirm')
      await nextTick()

      expect(notesStore.deleteNote).toHaveBeenCalledWith('note1')
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Note Deleted'
        })
      )
    })

    it('closes editor when deleting currently open note', async () => {
      const wrapper = mountComponent()
      await nextTick()

      // Open note in editor
      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('open', mockNotes[0])
      await nextTick()

      // Delete the note
      const editor = wrapper.findComponent({ name: 'NoteEditor' })
      editor.vm.$emit('delete', mockNotes[0])
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      confirmDialog.vm.$emit('confirm')
      await nextTick()
      await nextTick() // Wait for async delete and state update

      expect(wrapper.find('.note-list').exists()).toBe(true)
      expect(wrapper.find('.note-editor').exists()).toBe(false)
    })
  })

  describe('Search Functionality', () => {
    it('performs search with query', async () => {
      const searchResults = [mockNotes[0]]
      notesStore.searchNotes.mockResolvedValueOnce({ success: true, data: searchResults })

      const wrapper = mountComponent()
      await nextTick()

      const searchBar = wrapper.findComponent({ name: 'NoteSearchBar' })
      searchBar.vm.$emit('search', { query: 'test' })
      await nextTick()

      expect(notesStore.searchNotes).toHaveBeenCalledWith('test')
    })

    it('displays search results', async () => {
      const searchResults = [mockNotes[0]]
      notesStore.searchNotes.mockResolvedValueOnce({ success: true, data: searchResults })

      const wrapper = mountComponent()
      await nextTick()

      const searchBar = wrapper.findComponent({ name: 'NoteSearchBar' })
      searchBar.vm.$emit('search', { query: 'test' })
      await nextTick()

      expect(wrapper.find('.search-results').exists()).toBe(true)
      expect(wrapper.find('.note-list').exists()).toBe(false)
    })

    it('clears search and returns to list', async () => {
      const wrapper = mountComponent()
      await nextTick()

      // Perform search
      const searchBar = wrapper.findComponent({ name: 'NoteSearchBar' })
      searchBar.vm.$emit('search', { query: 'test' })
      await flushPromises() // Wait for async search
      await nextTick()

      // Verify search is active
      expect(wrapper.vm.searchActive).toBe(true)
      expect(wrapper.vm.currentView).toBe('search')

      // Clear search by calling the method directly
      // (In the actual UI, this would be triggered by a button in the search results)
      wrapper.vm.handleClearSearch()
      await nextTick()

      // Verify we're back to list view
      expect(wrapper.vm.searchActive).toBe(false)
      expect(wrapper.vm.currentView).toBe('list')
    })

    it('shows error toast when search fails', async () => {
      notesStore.searchNotes.mockResolvedValueOnce({
        success: false,
        error: 'Search failed'
      })

      const wrapper = mountComponent()
      await nextTick()

      const searchBar = wrapper.findComponent({ name: 'NoteSearchBar' })
      searchBar.vm.$emit('search', { query: 'test' })
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Search Error',
          detail: 'Search failed'
        })
      )
    })

    it('opens note from search results', async () => {
      const searchResults = [mockNotes[0]]
      notesStore.searchNotes.mockResolvedValueOnce({ success: true, data: searchResults })

      const wrapper = mountComponent()
      await nextTick()

      const searchBar = wrapper.findComponent({ name: 'NoteSearchBar' })
      searchBar.vm.$emit('search', { query: 'test' })
      await nextTick()

      const searchResultsComponent = wrapper.findComponent({ name: 'NoteSearchResults' })
      searchResultsComponent.vm.$emit('select', mockNotes[0])
      await nextTick()

      expect(wrapper.find('.note-editor').exists()).toBe(true)
    })
  })

  describe('URL Routing', () => {
    it('handles create action from URL query', async () => {
      route.query = { action: 'create' }

      const wrapper = mountComponent()
      await flushPromises() // Wait for onMounted and async operations
      await nextTick()

      expect(wrapper.find('.note-editor').exists()).toBe(true)
      expect(wrapper.text()).toContain('New Note')
    })

    it('handles note ID from URL query', async () => {
      route.query = { noteId: 'note1' }

      const wrapper = mountComponent()
      await flushPromises() // Wait for onMounted and async operations
      await nextTick()

      expect(wrapper.find('.note-editor').exists()).toBe(true)
      expect(wrapper.text()).toContain('Edit Note')
    })

    it('handles invalid note ID gracefully', async () => {
      route.query = { noteId: 'invalid-id' }

      const wrapper = mountComponent()
      await flushPromises() // Wait for onMounted and async operations
      await nextTick()

      // Should stay on list view if note not found
      expect(wrapper.find('.note-list').exists()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when pin fails', async () => {
      notesStore.togglePin.mockResolvedValueOnce({
        success: false,
        error: 'Pin failed'
      })

      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('pin', mockNotes[0])
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Pin failed'
        })
      )
    })

    it('shows error toast when archive fails', async () => {
      notesStore.toggleArchive.mockResolvedValueOnce({
        success: false,
        error: 'Archive failed'
      })

      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('archive', mockNotes[0])
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Archive failed'
        })
      )
    })

    it('shows error toast when delete fails', async () => {
      notesStore.deleteNote.mockResolvedValueOnce({
        success: false,
        error: 'Delete failed'
      })

      const wrapper = mountComponent()
      await nextTick()

      const noteList = wrapper.findComponent({ name: 'NoteList' })
      noteList.vm.$emit('delete', mockNotes[0])
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      confirmDialog.vm.$emit('confirm')
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Delete failed'
        })
      )
    })

    it('retries fetching notes when retry button is clicked', async () => {
      notesStore.loading = false
      notesStore.error = 'Failed to load notes'

      const wrapper = mountComponent()
      await nextTick()

      const retryButton = wrapper.find('button')
      await retryButton.trigger('click')

      expect(notesStore.fetchNotes).toHaveBeenCalled()
    })
  })
})
