import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NotesListView from '@/views/NotesListView.vue'
import { useNotesStore } from '@/features/notes/store'

// Mock dependencies
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush
  }))
}))

const mockAdd = vi.fn()
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: mockAdd
  }))
}))

// Mock the store
vi.mock('@/features/notes/store')

// Stub child components
const AppLayout = { template: '<div><slot /></div>' }
const TopicList = { template: '<div class="topic-list-stub"></div>' }
const NoteList = {
  template: '<div class="note-list-stub" />',
  props: ['notes', 'emptyTitle', 'emptyMessage']
}
const NoteSearchBar = {
  template: '<div class="note-search-bar-stub" />',
  props: ['resultCount', 'searchTime']
}
const Button = { template: '<button><slot /></button>' }

describe('NotesListView.vue', () => {
  let notesStore

  const getWrapper = () =>
    mount(NotesListView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppLayout,
          TopicList,
          NoteList,
          NoteSearchBar,
          Button,
          'router-link': { template: '<a><slot/></a>' }
        }
      }
    })

  beforeEach(() => {
    setActivePinia(createPinia())
    // Create a fresh mock for each test
    notesStore = {
      notes: [
        { id: 'note-1', title: 'Note 1', topic_id: 'topic-1', is_pinned: false },
        { id: 'note-2', title: 'Note 2', topic_id: 'topic-2', is_pinned: true }
      ],
      topics: [
        { id: 'topic-1', name: 'Topic 1' },
        { id: 'topic-2', name: 'Topic 2' }
      ],
      selectedTopicId: null,
      get selectedTopic() {
        return this.topics.find((t) => t.id === this.selectedTopicId)
      },
      get filteredNotes() {
        if (this.selectedTopicId) {
          return this.notes.filter((n) => n.topic_id === this.selectedTopicId)
        }
        return this.notes
      },
      fetchNotes: vi.fn().mockResolvedValue(),
      fetchTopics: vi.fn().mockResolvedValue(),
      searchNotes: vi
        .fn()
        .mockResolvedValue({ success: true, data: [{ id: 'search-1', title: 'Search Result' }] }),
      togglePin: vi.fn().mockResolvedValue({ success: true }),
      deleteNote: vi.fn().mockResolvedValue({ success: true })
    }
    vi.mocked(useNotesStore).mockReturnValue(notesStore)
    vi.clearAllMocks()
  })

  describe('Rendering and Data Loading', () => {
    it('fetches notes and topics on mount', async () => {
      getWrapper()
      await flushPromises()
      expect(notesStore.fetchNotes).toHaveBeenCalled()
      expect(notesStore.fetchTopics).toHaveBeenCalled()
    })

    it('displays the correct title for "All Notes"', async () => {
      const wrapper = getWrapper()
      await flushPromises()
      expect(wrapper.find('h2').text()).toBe('All Notes')
      expect(wrapper.find('.note-count').text()).toContain('2 notes')
    })

    it('displays the correct title when a topic is selected', async () => {
      notesStore.selectedTopicId = 'topic-1'
      const wrapper = getWrapper()
      await flushPromises()
      expect(wrapper.find('h2').text()).toBe('Topic 1')
      expect(wrapper.find('.note-count').text()).toContain('1 note')
    })

    it('passes all notes to NoteList component by default', async () => {
      const wrapper = getWrapper()
      await flushPromises()
      const noteList = wrapper.findComponent(NoteList)
      expect(noteList.props('notes')).toHaveLength(2)
    })

    it('passes filtered notes when a topic is selected', async () => {
      notesStore.selectedTopicId = 'topic-1'
      const wrapper = getWrapper()
      await flushPromises()
      const noteList = wrapper.findComponent(NoteList)
      expect(noteList.props('notes')).toHaveLength(1)
      expect(noteList.props('notes')[0].id).toBe('note-1')
    })

    it('passes correct empty state messages', () => {
      const wrapper = getWrapper()
      const noteList = wrapper.findComponent(NoteList)
      expect(noteList.props('emptyTitle')).toBe('No notes yet')
      expect(noteList.props('emptyMessage')).toContain('Start capturing')

      notesStore.selectedTopicId = 'topic-1'
      const wrapper2 = getWrapper()
      const noteList2 = wrapper2.findComponent(NoteList)
      expect(noteList2.props('emptyTitle')).toBe('No notes in this topic')
      expect(noteList2.props('emptyMessage')).toContain('Create your first note in this topic')
    })
  })

  describe('User Actions', () => {
    it('navigates to create note page', async () => {
      const wrapper = getWrapper()
      await wrapper.find('.header-actions button').trigger('click')
      expect(mockPush).toHaveBeenCalledWith({ name: 'notes-create' })
    })

    it('navigates to edit note page on open-note event', async () => {
      const wrapper = getWrapper()
      const noteToOpen = { id: 'note-1' }
      await wrapper.vm.handleOpenNote(noteToOpen)
      expect(mockPush).toHaveBeenCalledWith({ name: 'notes-edit', params: { id: 'note-1' } })
    })

    it('calls togglePin and shows toast on toggle-pin event', async () => {
      const wrapper = getWrapper()
      const noteToPin = { id: 'note-1', title: 'Note 1', is_pinned: false }
      await wrapper.vm.handleTogglePin(noteToPin)
      expect(notesStore.togglePin).toHaveBeenCalledWith('note-1')
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success', summary: 'Note Pinned' })
      )
    })

    it('calls deleteNote and shows toast on delete-note event', async () => {
      const wrapper = getWrapper()
      const noteToDelete = { id: 'note-1', title: 'Note 1' }
      await wrapper.vm.handleDeleteNote(noteToDelete)
      expect(notesStore.deleteNote).toHaveBeenCalledWith('note-1')
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success', summary: 'Note Deleted' })
      )
    })
  })

  describe('Search Functionality', () => {
    it('calls searchNotes on search event', async () => {
      const wrapper = getWrapper()
      await wrapper.vm.handleSearch('query')
      expect(notesStore.searchNotes).toHaveBeenCalledWith('query')
    })

    it('updates displayedNotes with search results', async () => {
      const wrapper = getWrapper()
      await flushPromises()
      const noteList = wrapper.findComponent(NoteList)

      // Before search
      expect(noteList.props('notes')).toHaveLength(2)

      // After search
      await wrapper.vm.handleSearch('query')
      await wrapper.vm.$nextTick()

      expect(noteList.props('notes')).toHaveLength(1)
      expect(noteList.props('notes')[0].id).toBe('search-1')
    })

    it('clears search results', async () => {
      const wrapper = getWrapper()
      await flushPromises()
      const noteList = wrapper.findComponent(NoteList)

      // Perform a search
      await wrapper.vm.handleSearch('query')
      await wrapper.vm.$nextTick()
      expect(noteList.props('notes')[0].id).toBe('search-1')
      expect(wrapper.vm.searchActive).toBe(true)

      // Clear search
      await wrapper.vm.handleClearSearch()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.searchActive).toBe(false)
      expect(noteList.props('notes')).toHaveLength(2)
      expect(noteList.props('notes')[0].id).toBe('note-1')
    })

    it('shows error toast on search failure', async () => {
      notesStore.searchNotes.mockResolvedValue({ success: false, error: 'Search failed' })
      const wrapper = getWrapper()

      await wrapper.vm.handleSearch('query')
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error', detail: 'Search failed' })
      )
    })
  })
})
