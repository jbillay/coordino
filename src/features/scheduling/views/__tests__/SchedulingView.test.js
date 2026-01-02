import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import SchedulingView from '../SchedulingView.vue'
import { useSchedulingStore } from '../../store'
import { nextTick } from 'vue'

// Mock child components
vi.mock('../components/MeetingList.vue', () => ({
  default: {
    name: 'MeetingList',
    template:
      '<div class="mock-meeting-list" @select="$emit(\'select\', $event)" @create="$emit(\'create\')" @delete="$emit(\'delete\', $event)"></div>',
    props: ['meetings', 'loading', 'selectedId']
  }
}))

vi.mock('../components/MeetingEditor.vue', () => ({
  default: {
    name: 'MeetingEditor',
    template:
      '<div class="mock-meeting-editor" @saved="$emit(\'saved\', $event)" @cancelled="$emit(\'cancelled\')"></div>',
    props: ['meetingId']
  }
}))

describe('SchedulingView.vue', () => {
  let store

  // Helper function to mount component
  const mountComponent = (initialState = {}) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        scheduling: {
          meetings: [],
          participants: [],
          countryConfigs: [],
          filteredMeetings: [],
          loading: false,
          error: null,
          ...initialState
        }
      }
    })
    setActivePinia(pinia)

    const wrapper = mount(SchedulingView, {
      global: {
        plugins: [pinia],
        stubs: {
          ProgressSpinner: true,
          Dialog: {
            name: 'Dialog',
            template:
              '<div v-if="visible" class="dialog-stub"><slot></slot><slot name="footer"></slot></div>',
            props: ['visible', 'header', 'modal', 'closable']
          },
          Button: {
            name: 'Button',
            template:
              '<button @click="$emit(\'click\')" :data-label="label"><slot></slot></button>',
            props: ['label', 'icon', 'size', 'severity', 'text', 'loading']
          }
        }
      }
    })
    store = useSchedulingStore()
    return { wrapper, store }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State and Data Loading', () => {
    it('should show a loading spinner initially', async () => {
      // Set up mocks that never resolve to keep loading state
      const neverResolve = new Promise(() => {})

      const pinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: {
          scheduling: {
            meetings: [],
            participants: [],
            countryConfigs: [],
            filteredMeetings: [],
            loading: false,
            error: null
          }
        },
        stubActions: false
      })
      setActivePinia(pinia)

      const store = useSchedulingStore()
      store.fetchMeetings = vi.fn().mockReturnValue(neverResolve)
      store.fetchParticipants = vi.fn().mockReturnValue(neverResolve)
      store.fetchCountryConfigurations = vi.fn().mockReturnValue(neverResolve)

      const wrapper = mount(SchedulingView, {
        global: {
          plugins: [pinia],
          stubs: {
            ProgressSpinner: true,
            Dialog: true,
            Button: true
          }
        }
      })

      // Wait just one tick - at this point onMounted has fired but promises haven't resolved
      await nextTick()

      expect(wrapper.text()).toContain('Loading scheduling assistant...')
    })

    it('should fetch initial data on mount', async () => {
      const { store } = mountComponent()
      store.fetchMeetings.mockResolvedValue([])
      store.fetchParticipants.mockResolvedValue([])
      store.fetchCountryConfigurations.mockResolvedValue([])

      await nextTick() // onMounted is async

      expect(store.fetchMeetings).toHaveBeenCalled()
      expect(store.fetchParticipants).toHaveBeenCalled()
      expect(store.fetchCountryConfigurations).toHaveBeenCalled()
    })

    it('should hide loading spinner and show content after data loads', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchMeetings.mockResolvedValue([])
      store.fetchParticipants.mockResolvedValue([])
      store.fetchCountryConfigurations.mockResolvedValue([])

      await flushPromises()

      expect(wrapper.find('progressspinner-stub').exists()).toBe(false)
      // When no meetings, should show EmptyState instead of MeetingList
      expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
      expect(wrapper.find('.pi-calendar').exists()).toBe(true) // Empty state icon
    })

    it('should show an error message if data fetching fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Failed to fetch')

      // Set up mocks BEFORE mounting
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: {
          scheduling: {
            meetings: [],
            participants: [],
            countryConfigs: [],
            filteredMeetings: [],
            loading: false,
            error: null
          }
        },
        stubActions: false
      })
      setActivePinia(pinia)

      const store = useSchedulingStore()
      store.fetchMeetings = vi.fn().mockRejectedValue(error)
      store.fetchParticipants = vi.fn().mockResolvedValue([])
      store.fetchCountryConfigurations = vi.fn().mockResolvedValue([])

      mount(SchedulingView, {
        global: {
          plugins: [pinia],
          stubs: {
            ProgressSpinner: true,
            Dialog: true,
            Button: true
          }
        }
      })

      await flushPromises()

      expect(errorSpy).toHaveBeenCalledWith('Failed to initialize scheduling view:', error)
      errorSpy.mockRestore()
    })
  })

  describe('User Interactions', () => {
    const mockMeetings = [{ id: 'm1', title: 'Meeting 1' }]

    it('should show MeetingEditor when create button is clicked', async () => {
      // Mount with NO meetings to show the empty state with "Create Your First Meeting" button
      const { wrapper, store } = mountComponent({ meetings: [], filteredMeetings: [] })
      store.fetchMeetings.mockResolvedValue([])
      store.fetchParticipants.mockResolvedValue([])
      store.fetchCountryConfigurations.mockResolvedValue([])
      await flushPromises()

      // Find the Button by its data-label attribute
      const createButton = wrapper.find('button[data-label="Create Your First Meeting"]')
      expect(createButton.exists()).toBe(true)
      await createButton.trigger('click')

      const editor = wrapper.findComponent({ name: 'MeetingEditor' })
      expect(editor.exists()).toBe(true)
      expect(editor.props('meetingId')).toBeNull()
    })

    it('should show MeetingEditor when create event is emitted from MeetingList', async () => {
      const { wrapper } = mountComponent({ meetings: mockMeetings, filteredMeetings: mockMeetings })
      await flushPromises()

      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('create')

      const editor = wrapper.findComponent({ name: 'MeetingEditor' })
      expect(editor.exists()).toBe(true)
      expect(editor.props('meetingId')).toBeNull()
    })

    it('should show MeetingEditor with correct id when select event is emitted', async () => {
      const { wrapper } = mountComponent({ meetings: mockMeetings, filteredMeetings: mockMeetings })
      await flushPromises()

      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('select', 'm1')

      const editor = wrapper.findComponent({ name: 'MeetingEditor' })
      expect(editor.exists()).toBe(true)
      expect(editor.props('meetingId')).toBe('m1')
    })

    it('should handle meeting saved event', async () => {
      const { wrapper, store } = mountComponent({
        meetings: mockMeetings,
        filteredMeetings: mockMeetings
      })
      await flushPromises()
      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('create')
      store.fetchMeetings.mockResolvedValue([])

      const editor = wrapper.findComponent({ name: 'MeetingEditor' })
      await editor.vm.$emit('saved', 'new-m2')
      await nextTick()

      expect(store.fetchMeetings).toHaveBeenCalled()
      // After saving, the editor should still be shown with the saved meeting ID
      const updatedEditor = wrapper.findComponent({ name: 'MeetingEditor' })
      expect(updatedEditor.exists()).toBe(true)
      expect(updatedEditor.props('meetingId')).toBe('new-m2')
    })

    it('should handle editor cancelled event', async () => {
      const { wrapper } = mountComponent({ meetings: mockMeetings, filteredMeetings: mockMeetings })
      await flushPromises()
      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('create')
      expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(true)

      const editor = wrapper.findComponent({ name: 'MeetingEditor' })
      await editor.vm.$emit('cancelled')

      expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(false)
    })
  })

  describe('Meeting Deletion', () => {
    const mockMeetings = [{ id: 'm1', title: 'Meeting 1' }]

    it('should show delete dialog when delete event is emitted', async () => {
      const { wrapper } = mountComponent({ meetings: mockMeetings, filteredMeetings: mockMeetings })
      await flushPromises()

      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('delete', 'm1')
      await nextTick()

      const dialog = wrapper.find('.dialog-stub')
      expect(dialog.exists()).toBe(true)
      expect(dialog.isVisible()).toBe(true)
    })

    it('should call deleteMeeting on confirmation', async () => {
      const { wrapper, store } = mountComponent({
        meetings: mockMeetings,
        filteredMeetings: mockMeetings
      })
      await flushPromises()
      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('delete', 'm1')
      await nextTick()
      store.deleteMeeting.mockResolvedValue(undefined)

      // Find and click the Delete button in the dialog using data-label attribute
      const deleteButton = wrapper.find('button[data-label="Delete"]')
      expect(deleteButton.exists()).toBe(true)
      await deleteButton.trigger('click')
      await flushPromises()

      expect(store.deleteMeeting).toHaveBeenCalledWith('m1')
      const dialog = wrapper.find('.dialog-stub')
      expect(dialog.exists()).toBe(false)
    })

    it('should close editor if the deleted meeting was selected', async () => {
      const { wrapper, store } = mountComponent({
        meetings: mockMeetings,
        filteredMeetings: mockMeetings
      })
      await flushPromises()
      // Select and open editor for 'm1'
      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('select', 'm1')
      expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(true)

      // Trigger and confirm deletion of 'm1'
      await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('delete', 'm1')
      await nextTick()
      store.deleteMeeting.mockResolvedValue(undefined)

      // Click the Delete button using data-label attribute
      const deleteButton = wrapper.find('button[data-label="Delete"]')
      expect(deleteButton.exists()).toBe(true)
      await deleteButton.trigger('click')
      await flushPromises()

      expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(false)
    })
  })
})
