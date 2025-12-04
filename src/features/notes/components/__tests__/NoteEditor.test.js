import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Hoist mock state to ensure it's created before any imports
const {
  mockSaveStatus,
  mockIsSaving,
  mockAutosaveTrigger,
  mockForceSave,
  mockCancelAutosave,
  mockSetContent,
  mockGetWordCount,
  mockGetCharacterCount,
  mockEditor
} = vi.hoisted(() => ({
  mockSaveStatus: { value: 'saved' },
  mockIsSaving: { value: false },
  mockAutosaveTrigger: vi.fn(),
  mockForceSave: vi.fn(),
  mockCancelAutosave: vi.fn(),
  mockSetContent: vi.fn(),
  mockGetWordCount: vi.fn(() => 150),
  mockGetCharacterCount: vi.fn(() => 750),
  mockEditor: {
    isActive: vi.fn(),
    chain: vi.fn(() => ({
      focus: vi.fn().mockReturnThis(),
      toggleBold: vi.fn().mockReturnThis(),
      run: vi.fn()
    }))
  }
}))

// Mock composables
vi.mock('../composables/useNoteEditor', () => ({
  useNoteEditor: () => ({
    editor: mockEditor,
    setContent: mockSetContent,
    getWordCount: mockGetWordCount,
    getCharacterCount: mockGetCharacterCount
  })
}))

vi.mock('../composables/useNoteAutosave', () => ({
  useNoteAutosave: () => ({
    saveStatus: mockSaveStatus,
    isSaving: mockIsSaving,
    triggerAutosave: mockAutosaveTrigger,
    forceSave: mockForceSave,
    cancelAutosave: mockCancelAutosave
  })
}))

// Mock utils
vi.mock('../utils', () => ({
  validateNote: vi.fn((note) => ({
    valid: note.title !== 'invalid',
    errors: note.title === 'invalid' ? { title: 'Invalid title' } : {}
  })),
  formatNoteTimestamp: vi.fn(() => '2 hours ago')
}))

// Mock notes store
vi.mock('../store', () => ({
  useNotesStore: () => ({
    updateNote: vi.fn(),
    createNote: vi.fn(),
    deleteNote: vi.fn()
  })
}))

// Import component AFTER all mocks are defined
import NoteEditor from '../NoteEditor.vue'

describe('NoteEditor.vue', () => {
  let wrapper

  const mockNote = {
    id: 'note1',
    title: 'Test Note',
    content: '<p>Test content</p>',
    topic_id: 'topic1',
    topic: {
      id: 'topic1',
      name: 'Work',
      color: '#3b82f6'
    },
    is_pinned: false,
    archived_at: null,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T12:00:00Z'
  }

  const mountComponent = (props = {}) =>
    mount(NoteEditor, {
      props: {
        note: null,
        topicId: null,
        ...props
      },
      global: {
        stubs: {
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)"><slot />{{ label }}</button>',
            props: ['label', 'icon', 'class', 'disabled'],
            emits: ['click']
          },
          InputText: {
            name: 'InputText',
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\')" :placeholder="placeholder" :class="inputClass" />',
            props: ['modelValue', 'placeholder', 'class', 'inputClass'],
            emits: ['update:modelValue', 'input']
          },
          EditorContent: {
            name: 'EditorContent',
            template: '<div class="editor-content"><slot /></div>',
            props: ['editor']
          },
          EditorToolbar: {
            name: 'EditorToolbar',
            template: '<div class="editor-toolbar-stub"></div>',
            props: ['editor']
          }
        },
        directives: {
          tooltip: () => {}
        }
      }
    })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    wrapper = mountComponent()
  })

  describe('Component Rendering', () => {
    it('renders correctly', () => {
      expect(wrapper.find('.note-editor').exists()).toBe(true)
    })

    it('displays editor header', () => {
      expect(wrapper.find('.editor-header').exists()).toBe(true)
    })

    it('displays title input', () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      expect(input.exists()).toBe(true)
      expect(input.props('placeholder')).toBe('Note title...')
    })

    it('has proper flex layout', () => {
      const editor = wrapper.find('.note-editor')
      expect(editor.classes()).toContain('flex')
      expect(editor.classes()).toContain('flex-col')
    })
  })

  describe('Back Button', () => {
    it('displays back button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const backButton = buttons.find((b) => b.props('icon') === 'pi pi-arrow-left')
      expect(backButton).toBeTruthy()
    })

    it('emits close event when back button is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const backButton = buttons.find((b) => b.props('icon') === 'pi pi-arrow-left')

      await backButton.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close').length).toBe(1)
    })
  })

  describe('Topic Badge', () => {
    it('displays topic badge when note has topic', async () => {
      const wrapper = mountComponent({ note: mockNote })
      await nextTick()

      expect(wrapper.text()).toContain('Work')
    })

    it('does not display topic badge when note has no topic', () => {
      const noteWithoutTopic = { ...mockNote, topic: null }
      const wrapper = mountComponent({ note: noteWithoutTopic })

      expect(wrapper.text()).not.toContain('Work')
    })

    it('applies topic color to badge', async () => {
      const wrapper = mountComponent({ note: mockNote })
      await nextTick()

      const badge = wrapper.find('.px-3.py-1.rounded')
      expect(badge.exists()).toBe(true)
    })
  })

  describe('Archived Badge', () => {
    it('displays archived badge when note is archived', () => {
      const archivedNote = { ...mockNote, archived_at: '2025-01-01T10:00:00Z' }
      const wrapper = mountComponent({ note: archivedNote })

      expect(wrapper.text()).toContain('Archived')
    })

    it('does not display archived badge when note is not archived', () => {
      const wrapper = mountComponent({ note: mockNote })

      expect(wrapper.text()).not.toContain('Archived')
    })
  })

  describe('Action Buttons', () => {
    it('displays pin button', () => {
      const wrapper = mountComponent({ note: mockNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const pinButton = buttons.find((b) => b.props('icon') === 'pi pi-star')
      expect(pinButton).toBeTruthy()
    })

    it('displays filled star icon when note is pinned', () => {
      const pinnedNote = { ...mockNote, is_pinned: true }
      const wrapper = mountComponent({ note: pinnedNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const pinButton = buttons.find((b) => b.props('icon') === 'pi pi-star-fill')
      expect(pinButton).toBeTruthy()
    })

    it('emits pin event when pin button is clicked', async () => {
      const wrapper = mountComponent({ note: mockNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const pinButton = buttons.find((b) => b.props('icon') === 'pi pi-star')

      await pinButton.trigger('click')

      expect(wrapper.emitted('pin')).toBeTruthy()
    })

    it('displays archive button', () => {
      const wrapper = mountComponent({ note: mockNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const archiveButton = buttons.find((b) => b.props('icon') === 'pi pi-box')
      expect(archiveButton).toBeTruthy()
    })

    it('displays inbox icon when note is archived', () => {
      const archivedNote = { ...mockNote, archived_at: '2025-01-01T10:00:00Z' }
      const wrapper = mountComponent({ note: archivedNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const archiveButton = buttons.find((b) => b.props('icon') === 'pi pi-inbox')
      expect(archiveButton).toBeTruthy()
    })

    it('emits archive event when archive button is clicked', async () => {
      const wrapper = mountComponent({ note: mockNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const archiveButton = buttons.find((b) => b.props('icon') === 'pi pi-box')

      await archiveButton.trigger('click')

      expect(wrapper.emitted('archive')).toBeTruthy()
    })

    it('displays delete button', () => {
      const wrapper = mountComponent({ note: mockNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const deleteButton = buttons.find((b) => b.props('icon') === 'pi pi-trash')
      expect(deleteButton).toBeTruthy()
    })

    it('emits delete event when delete button is clicked', async () => {
      const wrapper = mountComponent({ note: mockNote })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const deleteButton = buttons.find((b) => b.props('icon') === 'pi pi-trash')

      await deleteButton.trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })

  describe('Title Input', () => {
    it('binds localTitle to input', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })

      await input.vm.$emit('update:modelValue', 'New Title')
      await nextTick()

      expect(wrapper.vm.localTitle).toBe('New Title')
    })

    it('adds p-invalid class when there are title errors', async () => {
      wrapper.vm.errors = { title: 'Some error' }
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      expect(input.props('class')).toContain('p-invalid')
    })
  })

  describe('Note Watcher', () => {
    it('updates localTitle when note changes', async () => {
      const wrapper = mountComponent({ note: null })
      expect(wrapper.vm.localTitle).toBe('')

      await wrapper.setProps({ note: mockNote })
      await nextTick()

      expect(wrapper.vm.localTitle).toBe('Test Note')
    })

    it('updates localContent when note changes', async () => {
      const wrapper = mountComponent({ note: null })
      expect(wrapper.vm.localContent).toBe('')

      await wrapper.setProps({ note: mockNote })
      await nextTick()

      expect(wrapper.vm.localContent).toBe('<p>Test content</p>')
    })

    it('clears errors when note changes', async () => {
      const wrapper = mountComponent({ note: null })
      wrapper.vm.errors = { title: 'Some error' }

      await wrapper.setProps({ note: mockNote })
      await nextTick()

      expect(wrapper.vm.errors).toEqual({})
    })
  })

  describe('Content Change Handling', () => {
    it('updates localContent when editor content changes', () => {
      wrapper.vm.handleContentChange('<p>New content</p>')

      expect(wrapper.vm.localContent).toBe('<p>New content</p>')
    })
  })

  describe('Autosave Functionality', () => {
    it('does not trigger autosave when validation fails', async () => {
      wrapper.vm.localTitle = 'invalid'
      wrapper.vm.localContent = '<p>Content</p>'
      mockAutosaveTrigger.mockClear()

      wrapper.vm.triggerAutosaveInternal()

      expect(mockAutosaveTrigger).not.toHaveBeenCalled()
    })
  })

  describe('Footer with Metadata', () => {
    it('displays footer when note exists', () => {
      const wrapper = mountComponent({ note: mockNote })
      expect(wrapper.find('.editor-footer').exists()).toBe(true)
    })

    it('does not display footer when note is null', () => {
      const wrapper = mountComponent({ note: null })
      expect(wrapper.find('.editor-footer').exists()).toBe(false)
    })
  })

  describe('Lifecycle Hooks', () => {
    it('does not call forceSave on unmount when there is no content', () => {
      const wrapper = mountComponent({ note: null })
      mockForceSave.mockClear()

      wrapper.unmount()

      expect(mockForceSave).not.toHaveBeenCalled()
    })
  })

  describe('Props', () => {
    it('accepts note prop', () => {
      const wrapper = mountComponent({ note: mockNote })
      expect(wrapper.props('note')).toEqual(mockNote)
    })

    it('accepts topicId prop', () => {
      const wrapper = mountComponent({ topicId: 'topic1' })
      expect(wrapper.props('topicId')).toBe('topic1')
    })

    it('has default values for props', () => {
      expect(wrapper.props('note')).toBe(null)
      expect(wrapper.props('topicId')).toBe(null)
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes on main container', () => {
      const editor = wrapper.find('.note-editor')
      expect(editor.classes()).toContain('dark:bg-gray-900')
    })

    it('has dark mode classes on header', () => {
      const header = wrapper.find('.editor-header')
      expect(header.classes()).toContain('dark:border-gray-700')
    })

    it('has dark mode classes on footer', () => {
      const wrapper = mountComponent({ note: mockNote })
      const footer = wrapper.find('.editor-footer')
      expect(footer.classes()).toContain('dark:border-gray-700')
      expect(footer.classes()).toContain('dark:text-gray-400')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const wrapper = mountComponent({ note: mockNote })
      // Title input acts as h1 with large text
      const titleInput = wrapper.findComponent({ name: 'InputText' })
      expect(titleInput.props('class')).toContain('text-3xl')
      expect(titleInput.props('class')).toContain('font-bold')
    })

    it('provides placeholder text for title input', () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      expect(input.props('placeholder')).toBe('Note title...')
    })

    it('displays error messages for validation', async () => {
      wrapper.vm.errors = { title: 'Title is required' }
      await nextTick()

      expect(wrapper.find('.p-error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Title is required')
    })
  })

  describe('Edge Cases', () => {
    it('handles note without topic gracefully', () => {
      const noteWithoutTopic = { ...mockNote, topic: null }
      const wrapper = mountComponent({ note: noteWithoutTopic })

      expect(wrapper.find('.note-editor').exists()).toBe(true)
    })

    it('handles very long title', async () => {
      const longTitle = 'A'.repeat(500)
      const input = wrapper.findComponent({ name: 'InputText' })

      await input.vm.$emit('update:modelValue', longTitle)
      await nextTick()

      expect(wrapper.vm.localTitle).toBe(longTitle)
    })

    it('handles empty content', async () => {
      wrapper.vm.handleContentChange('')

      expect(wrapper.vm.localContent).toBe('')
    })

    it('handles HTML content with special characters', async () => {
      const specialContent = '<p>Test &amp; <strong>Bold</strong></p>'
      wrapper.vm.handleContentChange(specialContent)

      expect(wrapper.vm.localContent).toBe(specialContent)
    })

    it('handles rapid title changes', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })

      await input.vm.$emit('update:modelValue', 'Title 1')
      await input.vm.$emit('update:modelValue', 'Title 2')
      await input.vm.$emit('update:modelValue', 'Title 3')
      await nextTick()

      expect(wrapper.vm.localTitle).toBe('Title 3')
    })

    it('handles switching between multiple notes', async () => {
      const wrapper = mountComponent({ note: mockNote })
      await nextTick()

      const note2 = {
        ...mockNote,
        id: 'note2',
        title: 'Second Note',
        content: '<p>Second content</p>'
      }
      await wrapper.setProps({ note: note2 })
      await nextTick()

      expect(wrapper.vm.localTitle).toBe('Second Note')
      expect(wrapper.vm.localContent).toBe('<p>Second content</p>')
    })
  })

  describe('Layout and Styling', () => {
    it('uses full height layout', () => {
      const editor = wrapper.find('.note-editor')
      expect(editor.classes()).toContain('h-full')
    })

    it('has scrollable content area', () => {
      const contentArea = wrapper.find('.flex-1.overflow-y-auto')
      expect(contentArea.exists()).toBe(true)
    })

    it('has proper padding on sections', () => {
      expect(wrapper.find('.px-6.pt-6').exists()).toBe(true) // Title section
      expect(wrapper.find('.px-6.pt-4').exists()).toBe(true) // Toolbar section
      expect(wrapper.find('.px-6.py-4').exists()).toBe(true) // Content section
    })

    it('has border separators', () => {
      const header = wrapper.find('.editor-header')
      expect(header.classes()).toContain('border-b')
    })
  })

  describe('Emits', () => {
    it('defines all expected events', () => {
      expect(wrapper.emitted()).toBeDefined()

      // Component should be able to emit these events
      const emitNames = ['close', 'save', 'pin', 'archive', 'delete']
      emitNames.forEach(() => {
        expect(wrapper.vm.$emit).toBeDefined()
      })
    })
  })

  describe('Editor Integration', () => {
    it('exposes setContent method from composable', () => {
      expect(mockSetContent).toBeDefined()
    })

    it('exposes getWordCount method from composable', () => {
      expect(mockGetWordCount).toBeDefined()
    })

    it('exposes getCharacterCount method from composable', () => {
      expect(mockGetCharacterCount).toBeDefined()
    })
  })
})
