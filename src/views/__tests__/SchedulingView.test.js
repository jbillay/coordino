import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SchedulingView from '../SchedulingView.vue'
import { useSchedulingStore } from '@/features/scheduling/store'

vi.mock('@/features/scheduling/components/MeetingList.vue', () => ({
  default: {
    name: 'MeetingList',
    props: ['meetings', 'loading', 'selectedId'],
    emits: ['select', 'create', 'delete', 'search'],
    template: '<div data-testid="meeting-list"></div>'
  }
}))

vi.mock('@/features/scheduling/components/MeetingEditor.vue', () => ({
  default: {
    name: 'MeetingEditor',
    props: ['meetingId'],
    emits: ['save', 'cancel'],
    template: '<div data-testid="meeting-editor"></div>'
  }
}))

describe('SchedulingView.vue', () => {
  let wrapper
  let store

  const mountComponent = () => {
    wrapper = mount(SchedulingView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              scheduling: {
                meetings: [
                  { id: '1', title: 'Meeting 1' },
                  { id: '2', title: 'Meeting 2' }
                ],
                loading: false,
                error: null
              }
            }
          })
        ],
        stubs: {
          AppLayout: {
            template: '<div class="app-layout"><slot /></div>'
          }
        }
      }
    })
    store = useSchedulingStore()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mountComponent()
  })

  it('renders MeetingList and fetches meetings on mount', () => {
    expect(wrapper.findComponent({ name: 'MeetingList' }).exists()).toBe(true)
    expect(store.fetchMeetings).toHaveBeenCalled()
  })

  it('shows placeholder when no meeting is selected', () => {
    expect(wrapper.find('[data-testid="meeting-editor"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Select a meeting or create a new one')
  })

  it('shows MeetingEditor when a meeting is selected', async () => {
    await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('select', '1')
    expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(true)
  })

  it('shows MeetingEditor when create meeting is emitted', async () => {
    await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('create')
    expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(true)
    const editor = wrapper.findComponent({ name: 'MeetingEditor' })
    expect(editor.props('meetingId')).toBeNull()
  })

  it('calls deleteMeeting when delete event is emitted', async () => {
    await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('delete', '1')
    expect(store.deleteMeeting).toHaveBeenCalledWith('1')
  })

  it('handles save event from MeetingEditor', async () => {
    store.fetchMeetings.mockClear() // Clear mount call
    await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('select', '1')
    await wrapper.findComponent({ name: 'MeetingEditor' }).vm.$emit('save')
    expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(false)
    expect(store.fetchMeetings).toHaveBeenCalledTimes(1) // once on save
  })

  it('handles cancel event from MeetingEditor', async () => {
    await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('select', '1')
    await wrapper.findComponent({ name: 'MeetingEditor' }).vm.$emit('cancel')
    expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(false)
  })

  it('calls setSearchQuery on search event', async () => {
    const query = 'test query'
    await wrapper.findComponent({ name: 'MeetingList' }).vm.$emit('search', query)
    expect(store.setSearchQuery).toHaveBeenCalledWith(query)
  })
})
