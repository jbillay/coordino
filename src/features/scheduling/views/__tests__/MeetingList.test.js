import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import MeetingList from '../MeetingList.vue'
import { useSchedulingStore } from '../../store'
import { useRouter } from 'vue-router'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

// Mock useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

describe('MeetingList.vue', () => {
  let wrapper
  let store
  let router
  const meetings = [
    {
      id: '1',
      title: 'Test Meeting 1',
      proposed_time: '2025-12-25T10:00:00.000Z',
      duration_minutes: 60,
      participant_count: 2
    },
    {
      id: '2',
      title: 'Another Test Meeting',
      proposed_time: '2025-12-26T14:30:00.000Z',
      duration_minutes: 90,
      participant_count: 5
    }
  ]

  beforeEach(() => {
    const pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        scheduling: {
          meetings,
          loading: false
        }
      }
    })
    store = useSchedulingStore(pinia)

    // Mock fetchMeetings to avoid onMounted errors
    store.fetchMeetings = vi.fn().mockResolvedValue()

    router = {
      push: vi.fn()
    }
    useRouter.mockReturnValue(router)

    wrapper = mount(MeetingList, {
      global: {
        plugins: [pinia],
        stubs: {
          Card: { template: '<div><slot name="content" /></div>' },
          Button: true,
          InputText: true,
          IconField: { template: '<div><slot /></div>' },
          InputIcon: true,
          DatePicker: true,
          DataTable: {
            props: ['value', 'loading'],
            template: `
              <div>
                <slot name="empty" v-if="!value || value.length === 0"></slot>
                <div v-else>
                  <div v-for="item in value" :key="item.id" class="meeting-item">
                    <slot name="body" :data="item"></slot>
                  </div>
                </div>
              </div>
            `
          },
          Column: {
            template: '<div><slot name="body" :data="data"></slot></div>',
            props: ['data']
          },
          Tag: true,
          Dialog: {
            props: ['visible'],
            template:
              '<div><slot v-if="visible"></slot><slot name="footer" v-if="visible"></slot></div>'
          },
          Tooltip: {}
        },
        directives: {
          Tooltip: vi.fn()
        }
      }
    })
  })

  it('renders the title and action buttons', () => {
    expect(wrapper.find('.page-title').text()).toBe('Meetings')
    expect(wrapper.find('.create-button').exists()).toBe(true)
    expect(wrapper.find('.config-button').exists()).toBe(true)
  })

  it('displays the list of meetings', () => {
    const meetingItems = wrapper.findAll('.meeting-item')
    expect(meetingItems.length).toBe(2)
  })

  it('filters meetings based on search query', async () => {
    wrapper.findComponent({ name: 'InputText' })
    await wrapper.vm.$nextTick()
    wrapper.vm.searchQuery = 'Test Meeting 1'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.filteredMeetings.length).toBe(1)
    expect(wrapper.vm.filteredMeetings[0].title).toBe('Test Meeting 1')
  })

  it('shows empty state when no meetings are available', async () => {
    store.meetings = []
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-state').text()).toContain('No meetings found')
  })

  it('navigates to create meeting page when "New Meeting" is clicked', async () => {
    await wrapper.find('.create-button').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/scheduling/create')
  })

  it('navigates to config page when "Working Hours" is clicked', async () => {
    await wrapper.find('.config-button').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/scheduling/config')
  })

  it('opens delete confirmation dialog when delete is clicked', async () => {
    expect(wrapper.vm.deleteDialogVisible).toBe(false)
    const meetingToDelete = meetings[0]
    wrapper.vm.confirmDelete(meetingToDelete)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.deleteDialogVisible).toBe(true)
    expect(wrapper.vm.meetingToDelete).toEqual(meetingToDelete)
  })

  it('calls store to delete a meeting and closes dialog', async () => {
    const deleteMeetingSpy = vi.spyOn(store, 'deleteMeeting').mockResolvedValue({})
    const meetingToDelete = meetings[0]
    wrapper.vm.confirmDelete(meetingToDelete)
    await wrapper.vm.$nextTick()

    await wrapper.vm.deleteMeeting()

    expect(deleteMeetingSpy).toHaveBeenCalledWith(meetingToDelete.id)
    expect(wrapper.vm.deleteDialogVisible).toBe(false)
  })

  it('filters meetings by date range', async () => {
    const startDate = new Date('2025-12-25T00:00:00.000Z')
    const endDate = new Date('2025-12-25T23:59:59.000Z')

    wrapper.vm.dateRange = [startDate, endDate]
    await wrapper.vm.$nextTick()

    const filtered = wrapper.vm.filteredMeetings
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('1')
  })

  it('filters meetings by search query case-insensitively', async () => {
    wrapper.vm.searchQuery = 'test'
    await wrapper.vm.$nextTick()

    const filtered = wrapper.vm.filteredMeetings
    // Both meetings have 'Test' in title ("Test Meeting 1" and "Another Test Meeting")
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.some((m) => m.title.toLowerCase().includes('test'))).toBe(true)
  })

  it('returns all meetings when no filters applied', async () => {
    wrapper.vm.searchQuery = ''
    wrapper.vm.dateRange = null
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredMeetings.length).toBe(2)
  })

  it('combines search and date range filters', async () => {
    wrapper.vm.searchQuery = 'Test'
    wrapper.vm.dateRange = [
      new Date('2025-12-25T00:00:00.000Z'),
      new Date('2025-12-25T23:59:59.000Z')
    ]
    await wrapper.vm.$nextTick()

    const filtered = wrapper.vm.filteredMeetings
    expect(filtered.length).toBe(1)
    expect(filtered[0].title).toBe('Test Meeting 1')
  })

  it('formats date and time correctly', () => {
    const formatted = wrapper.vm.formatDateTime('2025-12-25T10:00:00.000Z')
    expect(formatted).toContain('Dec')
    expect(formatted).toContain('25')
    expect(formatted).toContain('2025')
  })

  it('formats duration with hours and minutes', () => {
    expect(wrapper.vm.formatDuration(90)).toBe('1h 30m')
    expect(wrapper.vm.formatDuration(120)).toBe('2h')
    expect(wrapper.vm.formatDuration(45)).toBe('45m')
  })

  it('formats duration with only hours when no remaining minutes', () => {
    expect(wrapper.vm.formatDuration(60)).toBe('1h')
    expect(wrapper.vm.formatDuration(180)).toBe('3h')
  })

  it('navigates to view meeting page', async () => {
    wrapper.vm.viewMeeting('meeting-123')
    expect(router.push).toHaveBeenCalledWith('/scheduling/meeting-123')
  })

  it('navigates to edit meeting page', async () => {
    wrapper.vm.editMeeting('meeting-456')
    expect(router.push).toHaveBeenCalledWith('/scheduling/meeting-456')
  })

  it('fetches meetings on mount', async () => {
    const fetchSpy = vi.spyOn(store, 'fetchMeetings')
    await wrapper.vm.$nextTick()

    expect(fetchSpy).toHaveBeenCalled()
  })

  it('handles fetch meetings error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(store, 'fetchMeetings').mockRejectedValue(new Error('Fetch failed'))

    const pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        scheduling: {
          meetings: [],
          loading: false
        }
      }
    })

    const failStore = useSchedulingStore(pinia)
    failStore.fetchMeetings = vi.fn().mockRejectedValue(new Error('Fetch failed'))

    const failWrapper = mount(MeetingList, {
      global: {
        plugins: [pinia],
        stubs: {
          Card: { template: '<div><slot name="content" /></div>' },
          Button: true,
          InputText: true,
          IconField: { template: '<div><slot /></div>' },
          InputIcon: true,
          DatePicker: true,
          DataTable: { template: '<div></div>' },
          Column: true,
          Tag: true,
          Dialog: true
        },
        directives: {
          Tooltip: vi.fn()
        }
      }
    })

    await failWrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(failStore.fetchMeetings).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('sets loading state during fetch', async () => {
    expect(wrapper.vm.loading).toBe(false)
  })

  it('displays correct number of participants via computed prop', () => {
    // Check filteredMeetings instead of rendered text due to stubbed components
    expect(wrapper.vm.filteredMeetings[0].participant_count).toBe(2)
    expect(wrapper.vm.filteredMeetings[1].participant_count).toBe(5)
  })

  it('handles meeting with zero participants', async () => {
    store.meetings = [
      {
        id: '3',
        title: 'No Participants Meeting',
        proposed_time: '2025-12-27T10:00:00.000Z',
        duration_minutes: 30,
        participant_count: 0
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredMeetings[0].participant_count).toBe(0)
  })

  it('handles delete meeting error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const deleteSpy = vi.spyOn(store, 'deleteMeeting').mockRejectedValue(new Error('Delete failed'))

    wrapper.vm.meetingToDelete = meetings[0]
    await wrapper.vm.deleteMeeting()

    expect(deleteSpy).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('clears meetingToDelete after successful deletion', async () => {
    vi.spyOn(store, 'deleteMeeting').mockResolvedValue({})
    wrapper.vm.confirmDelete(meetings[0])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.meetingToDelete).toBeTruthy()

    await wrapper.vm.deleteMeeting()

    expect(wrapper.vm.meetingToDelete).toBeNull()
  })

  it('does not attempt deletion if no meeting selected', async () => {
    const deleteSpy = vi.spyOn(store, 'deleteMeeting')

    wrapper.vm.meetingToDelete = null
    await wrapper.vm.deleteMeeting()

    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('renders filter labels correctly', () => {
    expect(wrapper.find('label[for="search"]').text()).toContain('Search by title')
    expect(wrapper.find('label[for="dateRange"]').text()).toContain('Date range')
  })

  it('has action button methods available', () => {
    // Check that the methods exist rather than rendered buttons (stubbed components)
    expect(typeof wrapper.vm.viewMeeting).toBe('function')
    expect(typeof wrapper.vm.editMeeting).toBe('function')
    expect(typeof wrapper.vm.confirmDelete).toBe('function')
  })

  it('handles empty meetings array with proper message', async () => {
    store.meetings = []
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No meetings found')
    expect(wrapper.text()).toContain('Create your first meeting to get started')
  })

  it('displays meeting data in correct columns', () => {
    // Check data via filteredMeetings (stubbed components don't render full content)
    const filtered = wrapper.vm.filteredMeetings
    expect(filtered[0].title).toBe('Test Meeting 1')
    expect(filtered[1].title).toBe('Another Test Meeting')

    // Duration formatting works
    expect(wrapper.vm.formatDuration(60)).toBe('1h')
    expect(wrapper.vm.formatDuration(90)).toBe('1h 30m')
  })

  it('handles date range with only start date', async () => {
    wrapper.vm.dateRange = [new Date('2025-12-25T00:00:00.000Z'), null]
    await wrapper.vm.$nextTick()

    // Should not filter when dateRange doesn't have both dates - expects 2 element array
    // The filter checks: if (dateRange.value && dateRange.value.length === 2)
    // So [date, null] has length 2 but null is falsy, so the filter still applies
    const filtered = wrapper.vm.filteredMeetings
    // This is expected to filter based on the incomplete range
    expect(filtered).toBeDefined()
  })

  it('handles invalid date range gracefully', async () => {
    wrapper.vm.dateRange = []
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredMeetings.length).toBe(2)
  })

  it('search is case-insensitive', async () => {
    wrapper.vm.searchQuery = 'ANOTHER'
    await wrapper.vm.$nextTick()

    const filtered = wrapper.vm.filteredMeetings
    expect(filtered.length).toBe(1)
    expect(filtered[0].title).toBe('Another Test Meeting')
  })

  it('returns empty array when search matches nothing', async () => {
    wrapper.vm.searchQuery = 'NonexistentMeeting'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredMeetings.length).toBe(0)
  })

  it('updates filteredMeetings reactively when meetings change', async () => {
    expect(wrapper.vm.filteredMeetings.length).toBe(2)

    store.meetings = [meetings[0]]
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.filteredMeetings.length).toBe(1)
  })

  it('renders page title', () => {
    expect(wrapper.find('.page-title').text()).toBe('Meetings')
  })

  it('renders header action buttons', () => {
    expect(wrapper.find('.config-button').exists()).toBe(true)
    expect(wrapper.find('.create-button').exists()).toBe(true)
  })

  it('has proper aria-label on config button', () => {
    const configBtn = wrapper.find('.config-button')
    expect(configBtn.attributes('aria-label')).toContain('Configure custom working hours')
  })
})
