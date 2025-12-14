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
          },
          Toast: true,
          'router-view': true
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

  it('renders AppLayout component', () => {
    const appLayout = wrapper.find('.app-layout')
    expect(appLayout.exists()).toBe(true)
  })

  it('renders Toast component for notifications', () => {
    expect(wrapper.findComponent({ name: 'Toast' }).exists()).toBe(true)
  })

  it('renders router-view for nested routes', () => {
    expect(wrapper.findComponent({ name: 'router-view' }).exists()).toBe(true)
  })

  it('has correct component structure', () => {
    // Should have AppLayout wrapping Toast and router-view
    const html = wrapper.html()
    expect(html).toContain('app-layout')
  })

  it('provides routing outlet for scheduling feature', () => {
    // The router-view allows nested routes like /scheduling/meetings/:id
    const routerView = wrapper.findComponent({ name: 'router-view' })
    expect(routerView.exists()).toBe(true)
  })
})
