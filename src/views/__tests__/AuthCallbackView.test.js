import { mount } from '@vue/test-utils'
import AuthCallbackView from '../AuthCallbackView.vue'
import { describe, it, expect, vi } from 'vitest'
import { useRouter } from 'vue-router'
import { useSupabase } from '@/composables/useSupabase'
import { createTestingPinia } from '@pinia/testing'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

vi.mock('@/composables/useSupabase', () => ({
  useSupabase: vi.fn(() => ({
    supabase: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ error: null }))
      }
    }
  }))
}))

describe('AuthCallbackView.vue', () => {
  const getWrapper = () =>
    mount(AuthCallbackView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        stubs: {
          Card: true
        }
      }
    })

  it('redirects to the dashboard on successful auth callback', async () => {
    const push = vi.fn()
    useRouter.mockReturnValueOnce({ push })

    const wrapper = getWrapper()
    await wrapper.vm.$nextTick()

    // allow timers to run
    await new Promise((resolve) => setTimeout(resolve, 1100))

    expect(push).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to the login page on failed auth callback', async () => {
    const push = vi.fn()
    useRouter.mockReturnValueOnce({ push })
    useSupabase.mockReturnValueOnce({
      supabase: {
        auth: {
          getSession: vi.fn(() => Promise.resolve({ error: { message: 'Test Error' } }))
        }
      }
    })

    const wrapper = getWrapper()
    await wrapper.vm.$nextTick()

    // allow timers to run
    await new Promise((resolve) => setTimeout(resolve, 3100))

    expect(push).toHaveBeenCalledWith('/login')
  })
})
