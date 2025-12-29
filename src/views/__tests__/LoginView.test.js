import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LoginView from '../LoginView.vue'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { nextTick } from 'vue'

// Mock the router and toast
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  })),
  useRoute: vi.fn(() => ({
    query: {}
  }))
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

describe('LoginView.vue', () => {
  let authStore
  let router
  let toast
  let pinia

  beforeEach(() => {
    router = {
      push: vi.fn()
    }
    toast = {
      add: vi.fn()
    }

    vi.mocked(useRouter).mockReturnValue(router)
    vi.mocked(useToast).mockReturnValue(toast)

    pinia = createTestingPinia({
      stubActions: false
    })

    authStore = useAuthStore(pinia)
    authStore.signIn = vi.fn()
    authStore.signInWithMagicLink = vi.fn()
  })

  const mountComponent = () =>
    mount(LoginView, {
      global: {
        plugins: [pinia],
        stubs: {
          InputText: {
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          Password: {
            template:
              '<input type="password" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'feedback', 'toggleMask', 'pt']
          },
          Button: {
            template: '<button :type="type" @click="$emit(\'click\', $event)">{{ label }}</button>',
            props: ['label', 'loading', 'type', 'icon', 'iconPos', 'class'],
            emits: ['click']
          },
          Toast: {
            template: '<div></div>'
          },
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

  it('renders the login form correctly', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Sign In')
  })

  it('shows validation errors for empty fields', async () => {
    const wrapper = mountComponent()
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    await nextTick()
    expect(authStore.signIn).not.toHaveBeenCalled()
    expect(wrapper.html()).toContain('Email is required')
    expect(wrapper.html()).toContain('Password is required')
  })

  it('shows validation error for invalid email', async () => {
    const wrapper = mountComponent()
    await wrapper.find('input[type="email"]').setValue('invalid-email')
    await wrapper.find('form').trigger('submit.prevent')
    expect(authStore.signIn).not.toHaveBeenCalled()
    expect(wrapper.html()).toContain('Email is invalid')
  })

  it('calls signIn on successful validation', async () => {
    authStore.signIn.mockResolvedValue({ success: true })
    const wrapper = mountComponent()
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')

    expect(authStore.signIn).toHaveBeenCalledWith('test@example.com', 'password', false)
  })

  it('redirects to dashboard on successful sign-in', async () => {
    authStore.signIn.mockResolvedValue({ success: true })
    const wrapper = mountComponent()
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')

    await nextTick()
    await nextTick()

    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(router.push).toHaveBeenCalledWith('/dashboard')
  })

  it('shows error toast on failed sign-in', async () => {
    authStore.signIn.mockResolvedValue({ success: false, error: 'Invalid credentials' })
    const wrapper = mountComponent()
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')

    await nextTick()
    await nextTick()

    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
    expect(router.push).not.toHaveBeenCalled()
  })

  it('toggles magic link form', async () => {
    const wrapper = mountComponent()
    const magicLinkButton = wrapper.findAll('button').find((b) => b.text() === 'Send Magic Link')
    expect(wrapper.vm.showMagicLink).toBe(false)
    await magicLinkButton.trigger('click')
    expect(wrapper.vm.showMagicLink).toBe(true)
    await magicLinkButton.trigger('click')
    expect(wrapper.vm.showMagicLink).toBe(false)
  })

  it('sends a magic link on valid email', async () => {
    authStore.signInWithMagicLink.mockResolvedValue({ success: true })
    const wrapper = mountComponent()
    wrapper.vm.showMagicLink = true
    await nextTick()
    wrapper.vm.magicEmail = 'magic@example.com'
    await wrapper.vm.handleMagicLink()

    expect(authStore.signInWithMagicLink).toHaveBeenCalledWith('magic@example.com')
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
  })

  it('shows error toast on failed magic link send', async () => {
    authStore.signInWithMagicLink.mockResolvedValue({
      success: false,
      error: 'Something went wrong'
    })
    const wrapper = mountComponent()
    wrapper.vm.showMagicLink = true
    await nextTick()
    wrapper.vm.magicEmail = 'magic@example.com'
    await wrapper.vm.handleMagicLink()

    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
  })
})
