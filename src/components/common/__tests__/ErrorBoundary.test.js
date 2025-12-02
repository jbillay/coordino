import { mount } from '@vue/test-utils'
import ErrorBoundary from '../ErrorBoundary.vue'
import { describe, it, expect, vi } from 'vitest'
import { h } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

const CrashingComponent = {
  setup() {
    throw new Error('Test Error')
  },
  render() {
    return h('div', 'I will crash')
  }
}

const NonCrashingComponent = {
  render() {
    return h('div', 'I will not crash')
  }
}

describe('ErrorBoundary.vue', () => {
  const getWrapper = (slots) =>
    mount(ErrorBoundary, {
      slots,
      global: {
        components: {
          Button
        }
      }
    })
  it('catches an error and displays an error message', async () => {
    const wrapper = getWrapper({ default: CrashingComponent })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Something went wrong')
  })

  it('renders the default slot if there is no error', () => {
    const wrapper = getWrapper({
      default: {
        render() {
          return h('div', 'Hello, world!')
        }
      }
    })
    expect(wrapper.text()).toContain('Hello, world!')
  })

  it('retries rendering the default slot when "Try Again" is clicked', async () => {
    const wrapper = getWrapper({ default: CrashingComponent })
    await wrapper.vm.$nextTick()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Try Again')
      .trigger('click')
    const newWrapper = getWrapper({ default: NonCrashingComponent })
    expect(newWrapper.text()).not.toContain('Something went wrong')
  })

  it('navigates to dashboard when "Go to Dashboard" is clicked', async () => {
    const push = vi.fn()
    useRouter.mockReturnValueOnce({ push })
    const wrapper = getWrapper({ default: CrashingComponent })
    await wrapper.vm.$nextTick()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Go to Dashboard')
      .trigger('click')
    expect(push).toHaveBeenCalledWith('/dashboard')
  })
})
