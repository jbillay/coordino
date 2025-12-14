import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import ParticipantManagement from '../ParticipantManagement.vue'
import { useSchedulingStore } from '../../store'
import { useToast } from 'primevue/usetoast'

// Mock useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

const mockParticipants = [
  { id: 1, name: 'John Doe', timezone: 'America/New_York', working_hours: '09:00-17:00' },
  { id: 2, name: 'Jane Smith', timezone: 'Europe/London', working_hours: '09:00-17:00' }
]

describe('ParticipantManagement.vue', () => {
  let wrapper
  let store
  let toast

  beforeEach(() => {
    toast = { add: vi.fn() }
    useToast.mockReturnValue(toast)

    const pinia = createTestingPinia({
      initialState: {
        scheduling: { participants: mockParticipants }
      },
      stubActions: false
    })
    store = useSchedulingStore(pinia)
    store.fetchParticipants = vi.fn().mockResolvedValue()

    wrapper = mount(ParticipantManagement, {
      global: {
        plugins: [pinia],
        stubs: {
          Card: { template: '<div><slot name="content" /></div>' },
          Button: {
            props: ['label'],
            template: "<button :class=\"label ? 'create-button' : ''\"></button>"
          },
          Dialog: {
            props: ['visible'],
            template: '<div v-if="visible"><slot /></div>'
          },
          ParticipantList: {
            props: ['participants'],
            template: '<div id="participant-list"></div>'
          },
          ParticipantForm: {
            props: ['initialData'],
            template: '<div id="participant-form"></div>'
          }
        }
      }
    })
  })

  it('renders the component and fetches participants on mount', async () => {
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.page-title').text()).toBe('Participants')
    expect(store.fetchParticipants).toHaveBeenCalled()
  })

  it('opens the create dialog when "Add Participant" is clicked', async () => {
    expect(wrapper.vm.dialogVisible).toBe(false)
    await wrapper.find('.create-button').trigger('click')
    expect(wrapper.vm.dialogVisible).toBe(true)
    expect(wrapper.vm.isEditing).toBe(false)
    expect(wrapper.vm.selectedParticipant).toBeNull()
  })

  it('opens the edit dialog when edit event is emitted from ParticipantList', async () => {
    const participantToEdit = mockParticipants[0]
    wrapper.vm.openEditDialog(participantToEdit)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.dialogVisible).toBe(true)
    expect(wrapper.vm.isEditing).toBe(true)
    expect(wrapper.vm.selectedParticipant).toEqual(participantToEdit)
  })

  it('handles create participant form submission', async () => {
    const createSpy = vi.spyOn(store, 'createParticipant').mockResolvedValue({})
    const newParticipant = { name: 'New Person', timezone: 'Asia/Tokyo' }

    wrapper.vm.openCreateDialog()
    await wrapper.vm.$nextTick()
    await wrapper.vm.handleSubmit(newParticipant)

    expect(createSpy).toHaveBeenCalledWith(newParticipant)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(wrapper.vm.dialogVisible).toBe(false)
  })

  it('handles update participant form submission', async () => {
    const updateSpy = vi.spyOn(store, 'updateParticipant').mockResolvedValue({})
    const participantToEdit = mockParticipants[0]
    const updatedData = { ...participantToEdit, name: 'Johnathan Doe' }

    wrapper.vm.openEditDialog(participantToEdit)
    await wrapper.vm.$nextTick()
    await wrapper.vm.handleSubmit(updatedData)

    expect(updateSpy).toHaveBeenCalledWith(participantToEdit.id, updatedData)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(wrapper.vm.dialogVisible).toBe(false)
  })

  it('opens delete confirmation dialog', async () => {
    const participantToDelete = mockParticipants[0]
    wrapper.vm.confirmDelete(participantToDelete)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.deleteDialogVisible).toBe(true)
    expect(wrapper.vm.participantToDelete).toEqual(participantToDelete)
  })

  it('deletes participant on confirmation', async () => {
    const deleteSpy = vi.spyOn(store, 'deleteParticipant').mockResolvedValue({})
    const participantToDelete = mockParticipants[0]

    wrapper.vm.confirmDelete(participantToDelete)
    await wrapper.vm.$nextTick()
    await wrapper.vm.deleteParticipant()

    expect(deleteSpy).toHaveBeenCalledWith(participantToDelete.id)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(wrapper.vm.deleteDialogVisible).toBe(false)
  })
})
