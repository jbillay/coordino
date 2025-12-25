import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import MeetingEditor from '../MeetingEditor.vue'
import { useSchedulingStore } from '../../store'
import { useAuthStore } from '@/stores/auth'
import { nextTick } from 'vue'

vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }
  })
}))

vi.mock('../ParticipantList.vue', () => ({
  default: {
    name: 'ParticipantList',
    template: '<div class="mock-participant-list"><slot /></div>',
    props: ['participants', 'participantStatuses', 'removable']
  }
}))
vi.mock('../EquityScoreCard.vue', () => ({
  default: {
    name: 'EquityScoreCard',
    template: '<div class="mock-equity-score-card"><slot /></div>',
    props: ['score']
  }
}))
vi.mock('../ParticipantBreakdown.vue', () => ({
  default: {
    name: 'ParticipantBreakdown',
    template: '<div class="mock-participant-breakdown"><slot /></div>',
    props: ['breakdown']
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
        },
        auth: {
          user: { id: 'test-user-id' },
          session: { access_token: 'test-token' }
        }
      },
      stubActions: true
    })
    setActivePinia(pinia)
    const wrapper = mount(MeetingEditor, {
      props,
      global: {
        plugins: [pinia],
        stubs: {
          MeetingForm: {
            name: 'MeetingForm',
            template: '<div class="meeting-form"></div>',
            methods: {
              validate() {
                return true
              }
            }
          }
        }
      }
    })
    const store = useSchedulingStore()
    const authStore = useAuthStore()
    // Add mocks for store methods if not already mocked
    if (!store.calculateParticipantStatuses) {
      store.calculateParticipantStatuses = vi.fn().mockResolvedValue([])
    }
    if (!store.markDirty) {
      store.markDirty = vi.fn()
    }
    return { wrapper, store, authStore }
  }

  describe('Initial state', () => {
    it('should render "New Meeting" when meetingId is null', async () => {
      const { wrapper, store } = mountComponent({ meetingId: null })
      store.fetchMeeting.mockResolvedValue(undefined)
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()
      expect(wrapper.find('h2').text()).toBe('New Meeting')
      expect(store.fetchMeeting).not.toHaveBeenCalled()
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
      store.fetchMeeting = vi.fn().mockResolvedValue(undefined)
      store.fetchParticipants.mockResolvedValue(undefined)
      store.currentMeeting = mockMeeting

      // Wait for onMounted and loadMeeting to complete
      await new Promise((resolve) => setTimeout(resolve, 100))
      await nextTick()

      expect(store.fetchParticipants).toHaveBeenCalled()
      expect(wrapper.find('h2').text()).toBe('Edit Meeting')
      expect(wrapper.vm.localMeeting.title).toBe(mockMeeting.title)
      expect(wrapper.vm.selectedParticipants).toEqual(mockMeeting.participants)
    })

    it('should not fetch participants if already loaded', async () => {
      const { wrapper: _wrapper, store } = mountComponent(
        { meetingId: null },
        { participants: [{ id: 'p1', name: 'Alice' }] }
      )
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()
      expect(store.fetchParticipants).not.toHaveBeenCalled()
    })
  })

  describe('Save functionality', () => {
    it('should disable save button when title is missing', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.loading = false
      await nextTick()

      wrapper.vm.localMeeting.title = ''
      wrapper.vm.localMeeting.proposed_time = new Date()
      await nextTick()

      expect(wrapper.vm.canSave).toBeFalsy()
    })

    it('should disable save button when proposed_time is missing', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.loading = false
      await nextTick()

      wrapper.vm.localMeeting.title = 'Test Meeting'
      wrapper.vm.localMeeting.proposed_time = null
      await nextTick()

      expect(wrapper.vm.canSave).toBeFalsy()
    })

    it('should enable save button when all required fields are filled', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.loading = false
      await nextTick()

      wrapper.vm.localMeeting.title = 'Test Meeting'
      wrapper.vm.localMeeting.proposed_time = new Date()
      await nextTick()

      expect(wrapper.vm.canSave).toBeTruthy()
    })

    it('should create new meeting and emit saved event', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.createMeeting = vi.fn().mockResolvedValue({ id: 'new-meeting-id' })
      store.addParticipantToMeeting = vi.fn().mockResolvedValue(undefined)
      await nextTick()

      const proposedTime = new Date('2025-12-25T10:00:00Z')
      wrapper.vm.localMeeting = {
        title: 'New Meeting',
        proposed_time: proposedTime,
        notes: 'Test notes'
      }
      wrapper.vm.selectedParticipants = [{ id: 'p1', name: 'Alice' }]

      await wrapper.vm.handleSave()

      expect(store.createMeeting).toHaveBeenCalledWith({
        title: 'New Meeting',
        proposed_time: proposedTime,
        notes: 'Test notes'
      })
      expect(store.addParticipantToMeeting).toHaveBeenCalledWith('new-meeting-id', 'p1')
      expect(wrapper.emitted('saved')).toBeTruthy()
      expect(wrapper.emitted('saved')[0]).toEqual(['new-meeting-id'])
    })

    it('should update existing meeting', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Old Title',
        proposed_time: new Date('2025-12-20T10:00:00Z').toISOString(),
        notes: 'Old notes',
        participants: []
      }

      const { wrapper, store } = mountComponent(
        { meetingId: 'meeting-1' },
        { currentMeeting: mockMeeting }
      )
      store.fetchMeeting.mockResolvedValue(undefined)
      store.fetchParticipants.mockResolvedValue(undefined)
      store.saveMeeting = vi.fn().mockResolvedValue(undefined)
      await nextTick()
      await nextTick()

      wrapper.vm.localMeeting.title = 'Updated Title'
      wrapper.vm.localMeeting.notes = 'Updated notes'

      await wrapper.vm.handleSave()

      expect(store.saveMeeting).toHaveBeenCalled()
      expect(store.currentMeeting.title).toBe('Updated Title')
      expect(wrapper.emitted('saved')).toBeTruthy()
    })

    it('should sync participants when updating existing meeting', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Test Meeting',
        proposed_time: new Date().toISOString(),
        participants: [
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' }
        ]
      }

      const { wrapper, store } = mountComponent(
        { meetingId: 'meeting-1' },
        { currentMeeting: mockMeeting }
      )
      store.fetchMeeting.mockResolvedValue(undefined)
      store.fetchParticipants.mockResolvedValue(undefined)
      store.saveMeeting = vi.fn().mockResolvedValue(undefined)
      store.removeParticipantFromMeeting = vi.fn().mockResolvedValue(undefined)
      store.addParticipantToMeeting = vi.fn().mockResolvedValue(undefined)
      await nextTick()
      await nextTick()

      wrapper.vm.selectedParticipants = [
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' }
      ]

      await wrapper.vm.handleSave()

      expect(store.removeParticipantFromMeeting).toHaveBeenCalledWith('meeting-1', 'p1')
      expect(store.addParticipantToMeeting).toHaveBeenCalledWith('meeting-1', 'p3')
    })
  })

  describe('Cancel functionality', () => {
    it('should emit cancelled event when cancel is clicked and no changes', async () => {
      const { wrapper, store } = mountComponent({}, { isDirty: false })
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()

      await wrapper.vm.handleCancel()

      expect(wrapper.emitted('cancelled')).toBeTruthy()
      expect(wrapper.vm.showUnsavedWarning).toBe(false)
    })

    it('should show unsaved warning when cancel is clicked with dirty state', async () => {
      const { wrapper, store } = mountComponent({}, { isDirty: true })
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()

      // Set isDirty after mounting
      store.isDirty = true

      await wrapper.vm.handleCancel()

      expect(wrapper.vm.showUnsavedWarning).toBe(true)
      expect(wrapper.emitted('cancelled')).toBeFalsy()
    })

    it('should discard changes and emit cancelled', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()

      wrapper.vm.showUnsavedWarning = true
      store.isDirty = true

      await wrapper.vm.handleDiscardChanges()

      expect(store.isDirty).toBe(false)
      expect(wrapper.emitted('cancelled')).toBeTruthy()
    })

    it('should close warning without action when cancel warning is clicked', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()

      wrapper.vm.showUnsavedWarning = true
      wrapper.vm.pendingNavigation = 'cancel'

      await wrapper.vm.handleCancelWarning()

      expect(wrapper.vm.showUnsavedWarning).toBe(false)
      expect(wrapper.vm.pendingNavigation).toBeNull()
    })
  })

  describe('Participant management', () => {
    it('should show add participant dialog', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()

      wrapper.vm.showAddParticipantDialog()

      expect(wrapper.vm.participantDialogVisible).toBe(true)
      expect(wrapper.vm.editingParticipant).toBeNull()
    })

    it('should add new participant and recalculate equity score', async () => {
      const newParticipant = {
        id: 'p-new',
        name: 'Charlie',
        country: 'US',
        timezone: 'America/New_York',
        notes: ''
      }

      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.addParticipant = vi.fn().mockResolvedValue(newParticipant)
      store.calculateParticipantStatuses = vi.fn().mockResolvedValue([])
      await nextTick()

      wrapper.vm.localMeeting.proposed_time = new Date('2025-12-25T10:00:00Z')

      await wrapper.vm.handleSaveParticipant({
        name: 'Charlie',
        country: 'US',
        timezone: 'America/New_York',
        notes: ''
      })

      // Wait for async operations
      await nextTick()

      expect(store.addParticipant).toHaveBeenCalled()
      expect(wrapper.vm.selectedParticipants).toContainEqual(newParticipant)
      expect(store.calculateParticipantStatuses).toHaveBeenCalled()
      expect(wrapper.vm.participantDialogVisible).toBe(false)
    })

    it('should update existing participant', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.updateParticipant = vi.fn().mockResolvedValue(undefined)
      await nextTick()

      wrapper.vm.selectedParticipants = [
        { id: 'p1', name: 'Alice', country: 'US', timezone: 'America/New_York' }
      ]

      await wrapper.vm.handleSaveParticipant({
        id: 'p1',
        name: 'Alice Updated',
        country: 'CA',
        timezone: 'America/Toronto'
      })

      expect(store.updateParticipant).toHaveBeenCalledWith('p1', {
        id: 'p1',
        name: 'Alice Updated',
        country: 'CA',
        timezone: 'America/Toronto'
      })
      expect(wrapper.vm.selectedParticipants[0].name).toBe('Alice Updated')
    })

    it('should remove participant and recalculate equity score', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.calculateParticipantStatuses.mockResolvedValue([])
      await nextTick()

      wrapper.vm.selectedParticipants = [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' }
      ]
      wrapper.vm.localMeeting.proposed_time = new Date('2025-12-25T10:00:00Z')

      await wrapper.vm.handleRemoveParticipant('p1')

      expect(wrapper.vm.selectedParticipants).toHaveLength(1)
      expect(wrapper.vm.selectedParticipants[0].id).toBe('p2')
      expect(store.calculateParticipantStatuses).toHaveBeenCalled()
    })
  })

  describe('Optimal time analysis', () => {
    it('should generate optimal time slots when analyze is clicked', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.generateOptimalTimeSlots = vi.fn().mockResolvedValue(undefined)
      await nextTick()

      wrapper.vm.localMeeting.proposed_time = new Date('2025-12-25T10:00:00Z')
      wrapper.vm.selectedParticipants = [{ id: 'p1', name: 'Alice' }]

      await wrapper.vm.handleAnalyzeOptimalTimes()

      expect(store.generateOptimalTimeSlots).toHaveBeenCalledWith(
        wrapper.vm.localMeeting.proposed_time,
        wrapper.vm.selectedParticipants
      )
      expect(wrapper.vm.showOptimalAnalysis).toBe(true)
    })

    it('should update meeting time when suggestion is selected', async () => {
      const { wrapper, store } = mountComponent()
      store.fetchParticipants.mockResolvedValue(undefined)
      store.calculateParticipantStatuses.mockResolvedValue([])
      await nextTick()

      wrapper.vm.selectedParticipants = [{ id: 'p1', name: 'Alice' }]

      const suggestion = {
        hour: 14,
        score: 90,
        datetime: new Date('2025-12-25T14:00:00Z')
      }

      await wrapper.vm.handleSuggestionSelected(suggestion)

      expect(wrapper.vm.localMeeting.proposed_time).toEqual(suggestion.datetime)
      expect(store.calculateParticipantStatuses).toHaveBeenCalled()
      expect(store.markDirty).toHaveBeenCalled()
    })

    it('should display top 3 suggestions sorted by score', async () => {
      const heatmapData = [
        { hour: 10, score: 75 },
        { hour: 14, score: 90 },
        { hour: 8, score: 60 },
        { hour: 16, score: 85 }
      ]

      const { wrapper, store } = mountComponent({}, { heatmapData })
      store.fetchParticipants.mockResolvedValue(undefined)
      store.heatmapData = heatmapData
      await nextTick()

      const { topSuggestions } = wrapper.vm

      expect(topSuggestions).toHaveLength(3)
      expect(topSuggestions[0].score).toBe(90)
      expect(topSuggestions[1].score).toBe(85)
      expect(topSuggestions[2].score).toBe(75)
    })
  })

  describe('Reactivity', () => {
    it('should reload meeting when meetingId prop changes', async () => {
      const { wrapper, store } = mountComponent({ meetingId: 'meeting-1' })
      store.fetchMeeting.mockResolvedValue(undefined)
      store.fetchParticipants.mockResolvedValue(undefined)
      await nextTick()
      await nextTick()

      store.fetchMeeting.mockClear()
      store.currentMeeting = {
        id: 'meeting-2',
        title: 'Different Meeting',
        proposed_time: new Date().toISOString(),
        participants: []
      }

      await wrapper.setProps({ meetingId: 'meeting-2' })
      await nextTick()

      expect(store.fetchMeeting).toHaveBeenCalledWith('meeting-2')
    })
  })
})
