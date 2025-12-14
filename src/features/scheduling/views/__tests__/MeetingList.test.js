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
})
