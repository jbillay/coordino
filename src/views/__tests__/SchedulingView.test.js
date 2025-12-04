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
          }
        }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.app-layout').exists()).toBe(true)
  })

  it('displays the scheduling heading', () => {
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Scheduling')
  })

  it('displays the placeholder message', () => {
    expect(wrapper.text()).toContain('Meeting scheduler will be implemented in Phase 4')
  })

  it('displays the calendar icon', () => {
    const icon = wrapper.find('.pi-calendar')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('text-6xl')
  })

  it('applies correct styling classes', () => {
    const container = wrapper.find('.text-center')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toContain('py-12')
  })

  it('has accessible heading structure', () => {
    const heading = wrapper.find('h1')
    expect(heading.classes()).toContain('text-3xl')
    expect(heading.classes()).toContain('font-bold')
  })

  it('displays description text with appropriate styling', () => {
    const description = wrapper.find('p')
    expect(description.exists()).toBe(true)
    expect(description.classes()).toContain('text-gray-600')
    expect(description.classes()).toContain('dark:text-gray-400')
  })
})
