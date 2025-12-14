import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SchedulingView from '../SchedulingView.vue'

describe('SchedulingView.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(SchedulingView, {
      global: {
        stubs: {
          AppLayout: {
            template: '<div class="app-layout"><slot /></div>'
          },
          Toast: true,
          'router-view': true
        }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.app-layout').exists()).toBe(true)
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
