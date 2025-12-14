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
  let _store

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
    _store = useSchedulingStore()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mountComponent()
  })

  it('renders as a layout wrapper without direct content', () => {
    // This wrapper component only provides layout, actual content comes from router-view
    expect(wrapper.findComponent({ name: 'MeetingList' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'MeetingEditor' }).exists()).toBe(false)
  })

  it('provides router-view as outlet for nested scheduling routes', () => {
    // The actual SchedulingView with MeetingList/MeetingEditor is rendered via router-view
    expect(wrapper.findComponent({ name: 'router-view' }).exists()).toBe(true)
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
