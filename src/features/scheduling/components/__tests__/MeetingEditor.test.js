import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import MeetingEditor from '../MeetingEditor.vue'
import { useSchedulingStore } from '../../store'
import { nextTick } from 'vue'

vi.mock('../ParticipantList.vue', () => ({
  default: {
    name: 'ParticipantList',
    template: '<div class="mock-participant-list"><slot /></div>',
    props: ['participants', 'participantStatuses', 'removable']
  }
}))
vi.mock('../EquityScoreDisplay.vue', () => ({
  default: {
    name: 'EquityScoreDisplay',
    template: '<div class="mock-equity-score-display"><slot /></div>',
    props: ['score', 'breakdown']
  }
}))
vi.mock('../ParticipantDialog.vue', () => ({
  default: {
    name: 'ParticipantDialog',
    template: '<div class="mock-participant-dialog"><slot /></div>',
    props: ['visible', 'participant', 'saving']
  }
}))
vi.mock('../TimeSlotHeatmap.vue', () => ({
  default: {
    name: 'TimeSlotHeatmap',
    template: '<div class="mock-time-slot-heatmap"><slot /></div>',
    props: ['slots', 'loading']
  }
}))
vi.mock('../OptimalTimeSuggestions.vue', () => ({
  default: {
    name: 'OptimalTimeSuggestions',
    template: '<div class="mock-optimal-time-suggestions"><slot /></div>',
    props: ['suggestions', 'loading', 'showDetails']
  }
}))
vi.mock('@/components/common/UnsavedChangesWarning.vue', () => ({
  default: {
    name: 'UnsavedChangesWarning',
    template: '<div class="mock-unsaved-changes-warning"><slot /></div>',
    props: ['show']
  }
}))

describe('MeetingEditor', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  // Helper function to mount component for each test
  const mountComponent = (props = {}, initialState = {}) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        scheduling: {
          loading: false,
          loadingSuggestions: false,
          isDirty: false,
          currentMeeting: null,
          participants: [],
          equityScore: null,
          participantStatuses: [],
          heatmapData: [],
          ...initialState
        }
      }
    })
    setActivePinia(pinia)
    const wrapper = mount(MeetingEditor, {
      props,
      global: {
        plugins: [pinia]
      }
    })
    const store = useSchedulingStore()
    return { wrapper, store }
  }

  describe('Initial state', () => {
    it('should render "New Meeting" when meetingId is null', async () => {
      const { wrapper, store } = mountComponent({ meetingId: null })
      store.fetchMeetingById.mockResolvedValue(undefined)
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()
      expect(wrapper.find('h2').text()).toBe('New Meeting')
      expect(store.fetchMeetingById).not.toHaveBeenCalled()
      expect(store.fetchParticipants).toHaveBeenCalled()
      expect(wrapper.vm.localMeeting.title).toBe('')
      expect(wrapper.vm.localMeeting.proposed_time).toBeNull()
      expect(wrapper.vm.selectedParticipants).toEqual([])
    })

    it('should render "Edit Meeting" when meetingId is provided and load meeting data', async () => {
      const mockMeeting = {
        id: '123',
        title: 'Test Meeting',
        proposed_time: new Date().toISOString(),
        notes: 'Some notes',
        participants: [{ id: 'p1', name: 'Alice' }]
      }
      const { wrapper, store } = mountComponent(
        { meetingId: '123' },
        {
          currentMeeting: mockMeeting,
          equityScore: { score: 100, breakdown: {} },
          participantStatuses: [{ participantId: 'p1', status: 'green' }]
        }
      )
      store.fetchMeetingById.mockResolvedValue(undefined) // Mock fetchMeetingById to resolve to avoid errors later
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick() // Wait for component to re-render and onMounted to run
      await nextTick() // Wait for any subsequent updates from loadMeeting

      expect(store.fetchParticipants).toHaveBeenCalled()
      expect(store.fetchMeetingById).toHaveBeenCalledWith('123')
      expect(wrapper.find('h2').text()).toBe('Edit Meeting')
      expect(wrapper.vm.localMeeting.title).toBe(mockMeeting.title)
      expect(wrapper.vm.selectedParticipants).toEqual(mockMeeting.participants)
    })
  })
})
