import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NoteEditorView from '@/views/NoteEditorView.vue'
import { useNotesStore } from '@/features/notes/store'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

// Mock dependencies
vi.mock('vue-router')
vi.mock('primevue/usetoast')
vi.mock('@/features/notes/store')

// Stub child components
const AppLayout = { template: '<div><slot /></div>' }
const NoteEditor = {
  template: '<div class="note-editor-stub"></div>',
  props: ['note', 'autoFocus']
}
const Button = { template: '<button><slot /></button>' }
const Select = { template: '<select></select>', props: ['modelValue', 'options'] }

describe('NoteEditorView.vue', () => {
  let mockPush
  let mockAdd
  let mockNotesStore

  beforeEach(() => {
    // Reset mocks for each test
    mockPush = vi.fn()
    mockAdd = vi.fn()

    vi.mocked(useRouter).mockReturnValue({ push: mockPush })
    vi.mocked(useToast).mockReturnValue({ add: mockAdd })

    // A fresh store mock for each test
    mockNotesStore = {
      topics: [
        { id: 'topic-1', name: 'Topic 1' },
        { id: 'topic-2', name: 'Topic 2' }
      ],
      notes: [
        {
          id: 'note-1',
          title: 'Test Note',
          content: 'Content',
          topic_id: 'topic-1',
          topic: { name: 'Topic 1' }
        }
      ],
      selectedTopicId: 'topic-1',
      fetchTopics: vi.fn().mockResolvedValue(),
      createNote: vi.fn().mockResolvedValue({ success: true, data: { title: 'New Note' } }),
      updateNote: vi.fn().mockResolvedValue({ success: true, data: { title: 'Updated Note' } })
    }
    vi.mocked(useNotesStore).mockReturnValue(mockNotesStore)

    setActivePinia(createPinia())
  })

  const getWrapper = (routeParams = {}) => {
    vi.mocked(useRoute).mockReturnValue({ params: routeParams })
    return mount(NoteEditorView, {
      global: {
        stubs: { AppLayout, NoteEditor, Button, Select }
      }
    })
  }

  describe('Create Mode', () => {
    it('renders in create mode when no route id is provided', async () => {
      const wrapper = getWrapper()
      await flushPromises()
      expect(wrapper.find('.breadcrumb-text').text()).toBe('Notes > New Note')
      expect(wrapper.findComponent(NoteEditor).props('autoFocus')).toBe(true)
    })

    it('initializes an empty note with default topic', async () => {
      const wrapper = getWrapper()
      await flushPromises()
      const noteEditor = wrapper.findComponent(NoteEditor)
      expect(noteEditor.props('note')).toEqual({
        title: '',
        content: '',
        topic_id: 'topic-1'
      })
    })

    it('calls createNote on save', async () => {
      const wrapper = getWrapper()
      await flushPromises()

      const noteData = { title: 'New Test', content: 'New Content' }
      await wrapper.vm.handleSave(noteData)

      expect(mockNotesStore.createNote).toHaveBeenCalledWith({
        title: 'New Test',
        content: 'New Content',
        topic_id: 'topic-1'
      })
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      expect(mockPush).toHaveBeenCalledWith({ name: 'notes' })
    })

    it('handles cancel by navigating to notes list', async () => {
      const wrapper = getWrapper()
      await wrapper.vm.handleCancel()
      expect(mockPush).toHaveBeenCalledWith({ name: 'notes' })
    })
  })

  describe('Edit Mode', () => {
    it('renders in edit mode when route id is provided', async () => {
      const wrapper = getWrapper({ id: 'note-1' })
      await flushPromises()
      expect(wrapper.find('.breadcrumb-text').text()).toContain('Test Note')
      expect(wrapper.findComponent(NoteEditor).props('autoFocus')).toBe(false)
    })

    it('loads existing note data', async () => {
      const wrapper = getWrapper({ id: 'note-1' })
      await flushPromises()
      const noteEditor = wrapper.findComponent(NoteEditor)
      expect(noteEditor.props('note').id).toBe('note-1')
      expect(noteEditor.props('note').title).toBe('Test Note')
    })

    it('redirects if note not found', async () => {
      mockNotesStore.notes = [] // Ensure note is not found
      getWrapper({ id: 'note-not-found' })
      await flushPromises()
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error', summary: 'Note Not Found' })
      )
      expect(mockPush).toHaveBeenCalledWith({ name: 'notes' })
    })

    it('calls updateNote on save', async () => {
      const wrapper = getWrapper({ id: 'note-1' })
      await flushPromises()

      const noteData = { title: 'Updated Title', content: 'Updated Content' }
      await wrapper.vm.handleSave(noteData)

      expect(mockNotesStore.updateNote).toHaveBeenCalledWith('note-1', {
        title: 'Updated Title',
        content: 'Updated Content',
        topic_id: 'topic-1'
      })
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      expect(mockPush).toHaveBeenCalledWith({ name: 'notes' })
    })
  })

  describe('General Functionality', () => {
    it('updates note topic when selectedTopicId changes', async () => {
      const wrapper = getWrapper()
      await flushPromises()

      wrapper.vm.selectedTopicId = 'topic-2'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.note.topic_id).toBe('topic-2')
    })

    it('shows error toast on save failure', async () => {
      mockNotesStore.createNote.mockResolvedValue({ success: false, error: 'Database error' })
      const wrapper = getWrapper()
      await wrapper.vm.handleSave({ title: 'test', content: 'test' })
      await flushPromises()

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Error',
          detail: 'Database error'
        })
      )
    })

    it('shows loading skeleton in edit mode and then content', async () => {
      let resolveFetchTopics
      mockNotesStore.fetchTopics = vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetchTopics = resolve
          })
      )

      const wrapper = getWrapper({ id: 'note-1' })

      // onMounted is called, and loading becomes true. Wait for the DOM update.
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.loading-state').exists()).toBe(true)
      expect(wrapper.find('.editor-container').exists()).toBe(false)

      // Manually resolve the pending promise from onMounted
      resolveFetchTopics()
      await flushPromises()

      // Now the component should have finished loading
      expect(wrapper.find('.loading-state').exists()).toBe(false)
      expect(wrapper.find('.editor-container').exists()).toBe(true)
    })
  })
})
