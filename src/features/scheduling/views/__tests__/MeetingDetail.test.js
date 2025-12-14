import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import MeetingDetail from '../MeetingDetail.vue'
import { useSchedulingStore } from '../../store'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

const mockMeeting = {
  id: '1',
  title: 'Detailed Meeting',
  proposed_time: '2025-12-20T12:00:00.000Z',
  duration_minutes: 60,
  participants: [{ id: 1, name: 'Alice' }],
  notes: 'Some notes'
}

const mockParticipants = [
  { id: 1, name: 'Alice', timezone: 'UTC' },
  { id: 2, name: 'Bob', timezone: 'UTC+1' }
]

describe('MeetingDetail.vue', () => {
  let wrapper
  let store
  let router
  let toast

  beforeEach(() => {
    useRoute.mockReturnValue({ params: { id: '1' } })
    router = { push: vi.fn() }
    toast = { add: vi.fn() }
    useRouter.mockReturnValue(router)
    useToast.mockReturnValue(toast)

    const pinia = createTestingPinia({
      initialState: {
        scheduling: {
          currentMeeting: mockMeeting,
          participants: mockParticipants,
          participantsWithStatus: [],
          equityScore: 85,
          holidaysFetchError: false,
          loading: false
        }
      },
      stubActions: false
    })
    store = useSchedulingStore(pinia)
    store.fetchMeeting = vi.fn().mockResolvedValue(mockMeeting)
    store.fetchParticipants = vi.fn().mockResolvedValue(mockParticipants)

    wrapper = mount(MeetingDetail, {
      global: {
        plugins: [pinia],
        stubs: {
          Button: {
            props: ['label'],
            template: '<button :aria-label="label"></button>'
          },
          Card: { template: '<div><slot name="title"/><slot name="content"/></div>' },
          Tag: true,
          ProgressSpinner: true,
          Dialog: true,
          Message: true,
          EquityScoreCard: true,
          TimezoneGrid: true,
          ParticipantList: true,
          TimeHeatmap: true,
          OptimalTimeSuggestions: true,
          HolidayAlert: true,
          DatePicker: true
        }
      }
    })
  })

  it('renders loading state initially', async () => {
    store.loading = true
    store.currentMeeting = null
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'ProgressSpinner' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading meeting details...')
  })

  it('fetches meeting details and participants on mount and displays title', async () => {
    await wrapper.vm.$nextTick() // Wait for onMounted
    expect(store.fetchMeeting).toHaveBeenCalledWith('1')
    expect(store.fetchParticipants).toHaveBeenCalled()
    expect(wrapper.find('.meeting-title').text()).toBe(mockMeeting.title)
  })

  it('enters edit mode and shows time controls', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.edit-card').exists()).toBe(false)
    wrapper.vm.editMode = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.edit-card').exists()).toBe(true)
    expect(wrapper.find('.time-controls').exists()).toBe(true)
  })

  it('saves meeting updates', async () => {
    const updateSpy = vi.spyOn(store, 'updateMeeting').mockResolvedValue({})
    const newTime = '2025-12-20T14:00:00.000Z'

    wrapper.vm.editMode = true
    await wrapper.vm.$nextTick()

    store.currentMeeting.proposed_time = newTime // Simulate time change
    await wrapper.vm.saveMeetingUpdate()

    expect(updateSpy).toHaveBeenCalledWith('1', { proposed_time: newTime })
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(wrapper.vm.editMode).toBe(false)
  })

  it('opens add participant dialog', async () => {
    expect(wrapper.vm.showAddParticipantDialog).toBe(false)
    await wrapper.find('[aria-label="Add Participant"]').trigger('click')
    expect(wrapper.vm.showAddParticipantDialog).toBe(true)
  })

  it('adds a participant to the meeting', async () => {
    const addSpy = vi.spyOn(store, 'addParticipantToMeeting').mockResolvedValue({})
    const participantToAdd = mockParticipants[1] // Bob

    await wrapper.vm.addParticipantToMeeting(participantToAdd)

    expect(addSpy).toHaveBeenCalledWith(mockMeeting.id, participantToAdd.id)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Added' })
    )
  })

  it('removes a participant from the meeting', async () => {
    const removeSpy = vi.spyOn(store, 'removeParticipantFromMeeting').mockResolvedValue({})
    const participantToRemove = mockParticipants[0] // Alice

    await wrapper.vm.removeParticipantFromMeeting(participantToRemove)

    expect(removeSpy).toHaveBeenCalledWith(mockMeeting.id, participantToRemove.id)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Removed' })
    )
  })

  it('deletes the meeting and navigates away', async () => {
    const deleteSpy = vi.spyOn(store, 'deleteMeeting').mockResolvedValue({})

    wrapper.vm.confirmDelete()
    await wrapper.vm.$nextTick()

    await wrapper.vm.deleteMeeting()

    expect(deleteSpy).toHaveBeenCalledWith(mockMeeting.id)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Deleted' })
    )
    expect(router.push).toHaveBeenCalledWith('/scheduling')
  })
})
