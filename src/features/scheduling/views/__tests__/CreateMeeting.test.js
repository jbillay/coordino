import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import CreateMeeting from '../CreateMeeting.vue'
import { useSchedulingStore } from '../../store'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn()
  }))
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

const mockParticipants = [
  { id: 1, name: 'Alice', timezone: 'UTC' },
  { id: 2, name: 'Bob', timezone: 'UTC+1' }
]

describe('CreateMeeting.vue', () => {
  let wrapper
  let store
  let router
  let toast

  beforeEach(() => {
    router = { push: vi.fn(), back: vi.fn() }
    toast = { add: vi.fn() }
    useRouter.mockReturnValue(router)
    useToast.mockReturnValue(toast)

    const pinia = createTestingPinia({
      initialState: {
        scheduling: { participants: mockParticipants }
      },
      stubActions: false
    })
    store = useSchedulingStore(pinia)
    store.fetchParticipants = vi.fn().mockResolvedValue()
    store.createMeeting = vi.fn()
    store.addParticipantToMeeting = vi.fn()

    wrapper = mount(CreateMeeting, {
      global: {
        plugins: [pinia],
        stubs: {
          Card: { template: '<div><slot name="title" /><slot name="content" /></div>' },
          Button: {
            props: ['icon', 'label', 'severity'],
            template: '<button :class="icon" :aria-label="label"></button>'
          },
          Divider: true,
          MeetingForm: {
            template: '<form @submit.prevent="$emit(\'submit\', {})"></form>'
          }
        }
      }
    })
  })

  it('renders correctly and fetches participants', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.page-title').text()).toBe('Create Meeting')
    expect(store.fetchParticipants).toHaveBeenCalled()
  })

  it('displays available participants', () => {
    expect(wrapper.findAll('.participant-item').length).toBe(2)
    expect(wrapper.text()).toContain('Alice')
  })

  it('adds a participant to the selected list', async () => {
    await wrapper.find('.participant-item').trigger('click')
    expect(wrapper.vm.selectedParticipants.length).toBe(1)
    expect(wrapper.vm.selectedParticipants[0].name).toBe('Alice')
    expect(wrapper.vm.availableParticipants.length).toBe(1)
  })

  it('removes a participant from the selected list', async () => {
    wrapper.vm.addParticipant(mockParticipants[0])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.selectedParticipants.length).toBe(1)

    await wrapper.find('.participant-item.selected button.pi-times').trigger('click')

    expect(wrapper.vm.selectedParticipants.length).toBe(0)
    expect(wrapper.vm.availableParticipants.length).toBe(2)
  })

  it('navigates back when back button is clicked', async () => {
    await wrapper.find('.back-button').trigger('click')
    expect(router.back).toHaveBeenCalled()
  })

  it('navigates to participant management', async () => {
    await wrapper.find('button[aria-label="Manage Participants"]').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/scheduling/participants')
  })

  it('handles meeting creation and adds participants', async () => {
    const newMeeting = { id: 3, title: 'New Test Meeting' }
    store.createMeeting.mockResolvedValue(newMeeting)
    store.addParticipantToMeeting.mockResolvedValue({})

    wrapper.vm.addParticipant(mockParticipants[0])
    wrapper.vm.addParticipant(mockParticipants[1])
    await wrapper.vm.$nextTick()

    await wrapper.vm.handleCreateMeeting({ title: 'New Meeting' })

    expect(store.createMeeting).toHaveBeenCalledWith({ title: 'New Meeting' })
    expect(store.addParticipantToMeeting).toHaveBeenCalledWith(
      newMeeting.id,
      mockParticipants[0].id
    )
    expect(store.addParticipantToMeeting).toHaveBeenCalledWith(
      newMeeting.id,
      mockParticipants[1].id
    )
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(router.push).toHaveBeenCalledWith(`/scheduling/${newMeeting.id}`)
  })

  it('shows an error toast if meeting creation fails', async () => {
    const error = new Error('Creation failed')
    store.createMeeting.mockRejectedValue(error)

    await wrapper.vm.handleCreateMeeting({ title: 'Bad Meeting' })

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', detail: 'Creation failed' })
    )
  })
})
