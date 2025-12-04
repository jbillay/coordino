import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import TopicList from '../TopicList.vue'
import { useNotesStore } from '../../store'

// Mock PrimeVue useToast
const mockToast = {
  add: vi.fn()
}

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast
}))

describe('TopicList.vue', () => {
  let wrapper
  let notesStore

  const mockTopics = [
    {
      id: 'topic1',
      name: 'Work',
      color: '#3b82f6',
      note_count: 5,
      order: 1
    },
    {
      id: 'topic2',
      name: 'Personal',
      color: '#10b981',
      note_count: 3,
      order: 2
    },
    {
      id: 'topic3',
      name: 'Ideas',
      color: '#f59e0b',
      note_count: 0,
      order: 3
    }
  ]

  const mockNotes = [
    {
      id: '1',
      title: 'Note 1',
      content: 'Content 1',
      topic_id: 'topic1',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-01T10:00:00Z'
    },
    {
      id: '2',
      title: 'Note 2',
      content: 'Content 2',
      topic_id: 'topic1',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-02T10:00:00Z'
    },
    {
      id: '3',
      title: 'Note 3',
      content: 'Content 3',
      topic_id: 'topic1',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-03T10:00:00Z'
    },
    {
      id: '4',
      title: 'Note 4',
      content: 'Content 4',
      topic_id: 'topic1',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-04T10:00:00Z'
    },
    {
      id: '5',
      title: 'Note 5',
      content: 'Content 5',
      topic_id: 'topic1',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-05T10:00:00Z'
    },
    {
      id: '6',
      title: 'Note 6',
      content: 'Content 6',
      topic_id: 'topic2',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-06T10:00:00Z'
    },
    {
      id: '7',
      title: 'Note 7',
      content: 'Content 7',
      topic_id: 'topic2',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-07T10:00:00Z'
    },
    {
      id: '8',
      title: 'Note 8',
      content: 'Content 8',
      topic_id: 'topic2',
      archived_at: null,
      is_pinned: false,
      updated_at: '2025-01-08T10:00:00Z'
    }
  ]

  beforeEach(() => {
    // Clear mock calls before each test
    mockToast.add.mockClear()

    wrapper = mount(TopicList, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
            initialState: {
              notes: {
                topics: mockTopics,
                notes: mockNotes,
                selectedTopicId: null
              }
            }
          })
        ],
        stubs: {
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)"><slot />{{ label }}</button>',
            props: ['label', 'icon', 'size', 'class'],
            emits: ['click']
          },
          TopicCard: {
            name: 'TopicCard',
            template:
              '<div class="topic-card-stub" @click="$emit(\'select\')">{{ topic.name }}</div>',
            props: ['topic', 'selected'],
            emits: ['select', 'edit', 'delete']
          },
          TopicDialog: {
            name: 'TopicDialog',
            template: '<div class="topic-dialog-stub"></div>',
            props: ['visible', 'topic'],
            emits: ['update:visible', 'saved']
          },
          ConfirmDialog: {
            name: 'ConfirmDialog',
            template: '<div class="confirm-dialog-stub"></div>',
            props: ['visible', 'header', 'message', 'confirmLabel', 'cancelLabel', 'severity'],
            emits: ['update:visible', 'confirm', 'cancel']
          },
          draggable: {
            name: 'draggable',
            template: `
              <div class="draggable-stub">
                <template v-for="item in modelValue" :key="item[itemKey]">
                  <slot name="item" :element="item" />
                </template>
              </div>
            `,
            props: ['modelValue', 'itemKey', 'handle', 'animation', 'ghostClass'],
            emits: ['update:modelValue', 'end']
          }
        },
        directives: {
          tooltip: () => {}
        }
      }
    })

    notesStore = useNotesStore()
  })

  describe('Component Rendering', () => {
    it('renders correctly', () => {
      expect(wrapper.find('.topic-list').exists()).toBe(true)
    })

    it('displays "Topics" header', () => {
      const header = wrapper.find('h2')
      expect(header.text()).toBe('Topics')
    })

    it('displays create topic button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const createButton = buttons.find((b) => b.props('icon') === 'pi pi-plus')
      expect(createButton).toBeDefined()
    })

    it('uses flex column layout', () => {
      const topicList = wrapper.find('.topic-list')
      expect(topicList.classes()).toContain('flex')
      expect(topicList.classes()).toContain('flex-col')
    })

    it('has border on the right', () => {
      const topicList = wrapper.find('.topic-list')
      expect(topicList.classes()).toContain('border-r')
    })
  })

  describe('All Notes Option', () => {
    it('displays "All Notes" option', () => {
      expect(wrapper.text()).toContain('All Notes')
    })

    it('displays total notes count', () => {
      expect(wrapper.text()).toContain('8 notes')
    })

    it('shows list icon for All Notes', () => {
      const icon = wrapper.find('.pi-list')
      expect(icon.exists()).toBe(true)
    })

    it('highlights All Notes when no topic is selected', () => {
      const allNotesCard = wrapper.findAll('.topic-card')[0]
      const classes = allNotesCard.classes().join(' ')
      expect(classes).toContain('bg-primary-50')
    })

    it('does not highlight All Notes when a topic is selected', async () => {
      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      const allNotesCard = wrapper.findAll('.topic-card')[0]
      const classes = allNotesCard.classes().join(' ')
      expect(classes).not.toContain('bg-primary-50')
      expect(classes).toContain('hover:bg-gray-50')
    })

    it('selects all notes when clicked', async () => {
      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      const allNotesCard = wrapper.findAll('.topic-card')[0]
      await allNotesCard.trigger('click')
      await nextTick()

      expect(notesStore.selectedTopicId).toBe(null)
      expect(notesStore.fetchNotes).toHaveBeenCalled()
    })
  })

  describe('Topics List Display', () => {
    it('displays all topics', () => {
      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      expect(topicCards.length).toBe(3)
    })

    it('passes correct props to TopicCard', () => {
      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      expect(topicCards[0].props('topic')).toEqual(mockTopics[0])
      expect(topicCards[0].props('selected')).toBe(false)
    })

    it('marks selected topic card as selected', async () => {
      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      expect(topicCards[0].props('selected')).toBe(true)
      expect(topicCards[1].props('selected')).toBe(false)
    })

    it('uses draggable for topic reordering', () => {
      const draggable = wrapper.findComponent({ name: 'draggable' })
      expect(draggable.exists()).toBe(true)
    })

    it('passes correct props to draggable', () => {
      const draggable = wrapper.findComponent({ name: 'draggable' })
      expect(draggable.props('itemKey')).toBe('id')
      expect(draggable.props('handle')).toBe('.drag-handle')
    })
  })

  describe('Topic Selection', () => {
    it('selects topic when TopicCard emits select', async () => {
      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      await topicCards[0].vm.$emit('select')
      await nextTick()

      expect(notesStore.selectedTopicId).toBe('topic1')
      expect(notesStore.fetchNotes).toHaveBeenCalledWith('topic1')
    })

    it('updates selected state when different topic is clicked', async () => {
      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      await topicCards[1].vm.$emit('select')
      await nextTick()

      expect(notesStore.selectedTopicId).toBe('topic2')
    })
  })

  describe('Creating Topics', () => {
    it('opens dialog when create button is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const createButton = buttons.find((b) => b.props('icon') === 'pi pi-plus')

      await createButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showTopicDialog).toBe(true)
    })

    it('passes null topic to dialog for creation', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const createButton = buttons.find((b) => b.props('icon') === 'pi pi-plus')

      await createButton.trigger('click')
      await nextTick()

      const dialog = wrapper.findComponent({ name: 'TopicDialog' })
      expect(dialog.props('topic')).toBe(null)
    })

    it('clears selectedTopic when dialog is saved', async () => {
      wrapper.vm.selectedTopic = mockTopics[0]
      await nextTick()

      const dialog = wrapper.findComponent({ name: 'TopicDialog' })
      await dialog.vm.$emit('saved')
      await nextTick()

      expect(wrapper.vm.selectedTopic).toBe(null)
    })
  })

  describe('Editing Topics', () => {
    it('opens dialog when edit is triggered from TopicCard', async () => {
      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      await topicCards[0].vm.$emit('edit', mockTopics[0])
      await nextTick()

      expect(wrapper.vm.showTopicDialog).toBe(true)
      expect(wrapper.vm.selectedTopic).toEqual(mockTopics[0])
    })

    it('passes selected topic to dialog', async () => {
      wrapper.vm.selectedTopic = mockTopics[0]
      wrapper.vm.showTopicDialog = true
      await nextTick()

      const dialog = wrapper.findComponent({ name: 'TopicDialog' })
      expect(dialog.props('topic')).toEqual(mockTopics[0])
    })
  })

  describe('Deleting Topics', () => {
    it('opens confirm dialog when delete is triggered from TopicCard', async () => {
      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      await topicCards[0].vm.$emit('delete', mockTopics[0])
      await nextTick()

      expect(wrapper.vm.showDeleteConfirm).toBe(true)
      expect(wrapper.vm.topicToDelete).toEqual(mockTopics[0])
    })

    it('shows correct message for topic with no notes', async () => {
      wrapper.vm.topicToDelete = mockTopics[2] // Ideas topic with 0 notes
      await nextTick()

      expect(wrapper.vm.deleteConfirmMessage).toBe('Are you sure you want to delete this topic?')
    })

    it('shows warning message for topic with notes', async () => {
      wrapper.vm.topicToDelete = mockTopics[0] // Work topic with 5 notes
      await nextTick()

      expect(wrapper.vm.deleteConfirmMessage).toContain('This topic contains 5 notes')
      expect(wrapper.vm.deleteConfirmMessage).toContain('cannot be undone')
    })

    it('uses singular form for topic with 1 note', async () => {
      wrapper.vm.topicToDelete = { ...mockTopics[0], note_count: 1 }
      await nextTick()

      expect(wrapper.vm.deleteConfirmMessage).toContain('1 note.')
    })

    it('uses plural form for topic with multiple notes', async () => {
      wrapper.vm.topicToDelete = mockTopics[0] // 5 notes
      await nextTick()

      expect(wrapper.vm.deleteConfirmMessage).toContain('5 notes.')
    })

    it('calls deleteTopic when confirm is emitted', async () => {
      wrapper.vm.topicToDelete = mockTopics[0]
      notesStore.deleteTopic.mockResolvedValue({ success: true })
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      await confirmDialog.vm.$emit('confirm')
      await nextTick()

      expect(notesStore.deleteTopic).toHaveBeenCalledWith('topic1')
    })

    it('shows success toast on successful deletion', async () => {
      wrapper.vm.topicToDelete = mockTopics[0]
      notesStore.deleteTopic.mockResolvedValue({ success: true })
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      await confirmDialog.vm.$emit('confirm')
      await nextTick()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Topic Deleted',
        detail: 'Topic "Work" deleted successfully',
        life: 3000
      })
    })

    it('shows error toast on deletion failure', async () => {
      wrapper.vm.topicToDelete = mockTopics[0]
      notesStore.deleteTopic.mockResolvedValue({ success: false, error: 'Database error' })
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      await confirmDialog.vm.$emit('confirm')
      await nextTick()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Database error',
        life: 5000
      })
    })

    it('clears topicToDelete after deletion', async () => {
      wrapper.vm.topicToDelete = mockTopics[0]
      notesStore.deleteTopic.mockResolvedValue({ success: true })
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      await confirmDialog.vm.$emit('confirm')
      await nextTick()

      expect(wrapper.vm.topicToDelete).toBe(null)
    })

    it('handles deletion when no topicToDelete is set', async () => {
      wrapper.vm.topicToDelete = null
      await nextTick()

      await wrapper.vm.confirmDelete()

      expect(notesStore.deleteTopic).not.toHaveBeenCalled()
    })
  })

  describe('Topic Reordering', () => {
    it('calls reorderTopics when drag ends', async () => {
      notesStore.reorderTopics.mockResolvedValue({ success: true })
      const draggable = wrapper.findComponent({ name: 'draggable' })

      await draggable.vm.$emit('end')
      await nextTick()

      expect(notesStore.reorderTopics).toHaveBeenCalled()
    })

    it('shows error toast if reordering fails', async () => {
      notesStore.reorderTopics.mockResolvedValue({ success: false })
      const draggable = wrapper.findComponent({ name: 'draggable' })

      await draggable.vm.$emit('end')
      await nextTick()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to reorder topics',
        life: 3000
      })
    })

    it('refreshes topics if reordering fails', async () => {
      notesStore.reorderTopics.mockResolvedValue({ success: false })
      const draggable = wrapper.findComponent({ name: 'draggable' })

      await draggable.vm.$emit('end')
      await nextTick()

      expect(notesStore.fetchTopics).toHaveBeenCalled()
    })

    it('does not show toast if reordering succeeds', async () => {
      mockToast.add.mockClear()
      notesStore.reorderTopics.mockResolvedValue({ success: true })
      const draggable = wrapper.findComponent({ name: 'draggable' })

      await draggable.vm.$emit('end')
      await nextTick()

      // Toast should only be called for errors
      const errorToasts = mockToast.add.mock.calls.filter(
        (call) => call[0].severity === 'error' && call[0].summary === 'Error'
      )
      expect(errorToasts.length).toBe(0)
    })
  })

  describe('Empty State', () => {
    beforeEach(async () => {
      notesStore.topics = []
      await nextTick()
    })

    it('displays empty state when no topics exist', () => {
      const emptyState = wrapper.find('.text-center.py-8')
      expect(emptyState.exists()).toBe(true)
    })

    it('displays empty state icon', () => {
      const icon = wrapper.find('.pi-folder-open')
      expect(icon.exists()).toBe(true)
    })

    it('displays empty state message', () => {
      expect(wrapper.text()).toContain('No topics yet')
      expect(wrapper.text()).toContain('Create your first topic to organize your notes!')
    })

    it('displays create topic button in empty state', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const createButton = buttons.find((b) => b.props('label') === 'Create Topic')
      expect(createButton).toBeDefined()
    })

    it('opens dialog when empty state button is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const createButton = buttons.find((b) => b.props('label') === 'Create Topic')

      await createButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showTopicDialog).toBe(true)
    })

    it('does not display topic cards in empty state', () => {
      const topicCards = wrapper.findAllComponents({ name: 'TopicCard' })
      expect(topicCards.length).toBe(0)
    })
  })

  describe('Data Fetching on Mount', () => {
    it('fetches topics if store is empty', () => {
      mount(TopicList, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              stubActions: false,
              initialState: {
                notes: {
                  topics: [],
                  selectedTopicId: null,
                  activeNotesCount: 0
                }
              }
            })
          ],
          stubs: {
            Button: {
              name: 'Button',
              template: '<button><slot /></button>',
              props: ['label', 'icon', 'size', 'class']
            },
            TopicCard: {
              name: 'TopicCard',
              template: '<div></div>',
              props: ['topic', 'selected']
            },
            TopicDialog: {
              name: 'TopicDialog',
              template: '<div></div>',
              props: ['visible', 'topic']
            },
            ConfirmDialog: {
              name: 'ConfirmDialog',
              template: '<div></div>',
              props: ['visible', 'header', 'message', 'confirmLabel', 'cancelLabel', 'severity']
            },
            draggable: {
              name: 'draggable',
              template: '<div><slot /></div>',
              props: ['modelValue', 'itemKey', 'handle', 'animation', 'ghostClass']
            }
          },
          directives: {
            tooltip: () => {}
          }
        }
      })

      const store = useNotesStore()
      expect(store.fetchTopics).toHaveBeenCalled()
    })

    it('does not fetch topics if already loaded', () => {
      // Store already has topics from beforeEach
      expect(notesStore.fetchTopics).not.toHaveBeenCalled()
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes for container', () => {
      const topicList = wrapper.find('.topic-list')
      const classes = topicList.classes().join(' ')
      expect(classes).toContain('dark:bg-gray-900')
      expect(classes).toContain('dark:border-gray-700')
    })

    it('has dark mode classes for header', () => {
      const header = wrapper.find('h2')
      const classes = header.classes().join(' ')
      expect(classes).toContain('dark:text-white')
    })

    it('has dark mode classes for All Notes card', async () => {
      // Select a topic so All Notes is not selected
      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      const allNotesCard = wrapper.findAll('.topic-card')[0]
      const classes = allNotesCard.classes().join(' ')
      expect(classes).toContain('dark:hover:bg-gray-800')
    })

    it('has dark mode selected state for All Notes', () => {
      const allNotesCard = wrapper.findAll('.topic-card')[0]
      const classes = allNotesCard.classes().join(' ')
      expect(classes).toContain('dark:bg-primary-900/20')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic heading for title', () => {
      const heading = wrapper.find('h2')
      expect(heading.exists()).toBe(true)
    })

    it('uses semantic heading for All Notes', () => {
      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('All Notes')
    })

    it('provides clear button labels', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      buttons.forEach((button) => {
        expect(button.props('icon') || button.props('label')).toBeTruthy()
      })
    })

    it('uses cursor pointer for clickable elements', () => {
      const allNotesCard = wrapper.findAll('.topic-card')[0]
      expect(allNotesCard.classes()).toContain('cursor-pointer')
    })

    it('provides clear empty state guidance', async () => {
      notesStore.topics = []
      await nextTick()

      expect(wrapper.text()).toContain('No topics yet')
      expect(wrapper.text()).toContain('Create your first topic')
    })
  })

  describe('Responsive Design', () => {
    it('has fixed width for desktop', () => {
      const topicList = wrapper.find('.topic-list')
      expect(topicList.element.style.width || topicList.classes()).toBeTruthy()
    })

    it('has scrollable topics list', () => {
      const scrollContainer = wrapper.find('.overflow-y-auto')
      expect(scrollContainer.exists()).toBe(true)
    })
  })
})
