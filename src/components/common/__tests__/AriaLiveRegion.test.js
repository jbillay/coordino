import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AriaLiveRegion from '../AriaLiveRegion.vue'

describe('AriaLiveRegion.vue', () => {
  it('renders with default polite priority and empty message', () => {
    const wrapper = mount(AriaLiveRegion)
    expect(wrapper.attributes('aria-live')).toBe('polite')
    expect(wrapper.text()).toBe('')
  })

  it('renders with a custom message and assertive priority', () => {
    const wrapper = mount(AriaLiveRegion, {
      props: {
        message: 'Action completed',
        priority: 'assertive'
      }
    })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
    expect(wrapper.text()).toBe('Action completed')
  })

  it('updates message when prop changes', async () => {
    const wrapper = mount(AriaLiveRegion)
    expect(wrapper.text()).toBe('')
    await wrapper.setProps({ message: 'New message' })
    expect(wrapper.text()).toBe('New message')
  })

  it('updates priority when prop changes', async () => {
    const wrapper = mount(AriaLiveRegion)
    expect(wrapper.attributes('aria-live')).toBe('polite')
    await wrapper.setProps({ priority: 'assertive' })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('renders with aria-atomic="true" and role="status"', () => {
    const wrapper = mount(AriaLiveRegion)
    expect(wrapper.attributes('aria-atomic')).toBe('true')
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('applies sr-only class by default', () => {
    const wrapper = mount(AriaLiveRegion)
    expect(wrapper.classes()).toContain('sr-only')
  })
})
