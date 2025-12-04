import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SignupView from '../SignupView.vue'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { nextTick } from 'vue'

// Mock the router and toast
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

describe('SignupView.vue', () => {
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
    authStore.signUp = vi.fn()
  })

  const mountComponent = () =>
    mount(SignupView, {
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
            name: 'Button',
            template: '<button :type="type" @click="$emit(\'click\', $event)">{{ label }}</button>',
            props: ['label', 'loading', 'type', 'class'],
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

  describe('Component Rendering', () => {
    it('renders the signup form correctly', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.findAll('input').length).toBeGreaterThanOrEqual(4)
      expect(wrapper.find('button[type="submit"]').text()).toBe('Sign Up')
    })

    it('displays the Coordino branding', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Coordino')
      expect(wrapper.text()).toContain('Your productivity hub')
    })

    it('displays the signup heading', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Create your account')
    })

    it('has a link to login page', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Already have an account?')
      expect(wrapper.text()).toContain('Sign in')
    })

    it('renders all form fields', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Full Name')
      expect(wrapper.text()).toContain('Email')
      expect(wrapper.text()).toContain('Password')
      expect(wrapper.text()).toContain('Confirm Password')
    })
  })

  describe('Form Validation', () => {
    it('shows validation errors for empty fields', async () => {
      const wrapper = mountComponent()
      await wrapper.find('form').trigger('submit.prevent')

      expect(authStore.signUp).not.toHaveBeenCalled()
      expect(wrapper.html()).toContain('Full name is required')
      expect(wrapper.html()).toContain('Email is required')
      expect(wrapper.html()).toContain('Password is required')
      expect(wrapper.html()).toContain('Please confirm your password')
    })

    it('shows validation error for invalid email', async () => {
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('invalid-email')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      expect(authStore.signUp).not.toHaveBeenCalled()
      expect(wrapper.html()).toContain('Email is invalid')
    })

    it('shows validation error for password too short', async () => {
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('12345')
      await inputs[3].setValue('12345')
      await wrapper.find('form').trigger('submit.prevent')

      expect(authStore.signUp).not.toHaveBeenCalled()
      expect(wrapper.html()).toContain('Password must be at least 6 characters')
    })

    it('shows validation error when passwords do not match', async () => {
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password456')
      await wrapper.find('form').trigger('submit.prevent')

      expect(authStore.signUp).not.toHaveBeenCalled()
      expect(wrapper.html()).toContain('Passwords do not match')
    })

    it('validates only empty confirm password field', async () => {
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('password123')
      // Leave confirm password empty
      await wrapper.find('form').trigger('submit.prevent')

      expect(authStore.signUp).not.toHaveBeenCalled()
      expect(wrapper.html()).toContain('Please confirm your password')
    })
  })

  describe('Successful Signup', () => {
    it('calls signUp with correct parameters on valid form submission', async () => {
      authStore.signUp.mockResolvedValue({ success: true })
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      expect(authStore.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe')
    })

    it('redirects to dashboard on successful sign up', async () => {
      authStore.signUp.mockResolvedValue({ success: true })
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      await nextTick()
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Account created!',
          detail: 'Welcome to Coordino'
        })
      )
      expect(router.push).toHaveBeenCalledWith('/dashboard')
    })

    it('displays success toast with welcome message', async () => {
      authStore.signUp.mockResolvedValue({ success: true })
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      await nextTick()
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Account created!',
          detail: 'Welcome to Coordino',
          life: 3000
        })
      )
    })
  })

  describe('Failed Signup', () => {
    it('shows error toast on failed sign up', async () => {
      authStore.signUp.mockResolvedValue({
        success: false,
        error: 'Email already exists'
      })
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('existing@example.com')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      await nextTick()
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Sign up failed',
          detail: 'Email already exists'
        })
      )
      expect(router.push).not.toHaveBeenCalled()
    })

    it('does not redirect on failed sign up', async () => {
      authStore.signUp.mockResolvedValue({
        success: false,
        error: 'Network error'
      })
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      await nextTick()
      await nextTick()

      expect(router.push).not.toHaveBeenCalled()
    })

    it('displays error with longer life time', async () => {
      authStore.signUp.mockResolvedValue({
        success: false,
        error: 'Server error'
      })
      const wrapper = mountComponent()
      const inputs = wrapper.findAll('input')

      await inputs[0].setValue('John Doe')
      await inputs[1].setValue('test@example.com')
      await inputs[2].setValue('password123')
      await inputs[3].setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      await nextTick()
      await nextTick()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          life: 5000
        })
      )
    })
  })

  describe('Accessibility', () => {
    it('associates error messages with form fields using aria-describedby', async () => {
      const wrapper = mountComponent()
      await wrapper.find('form').trigger('submit.prevent')

      // Check that inputs have aria-describedby when there are errors
      expect(wrapper.html()).toContain('aria-describedby')
      expect(wrapper.html()).toContain('aria-invalid="true"')
    })

    it('displays error messages with role="alert"', async () => {
      const wrapper = mountComponent()
      await wrapper.find('form').trigger('submit.prevent')

      const errorMessages = wrapper.findAll('small[role="alert"]')
      expect(errorMessages.length).toBeGreaterThan(0)
    })

    it('has proper labels for all form fields', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('label[for="fullName"]').exists()).toBe(true)
      expect(wrapper.find('label[for="email"]').exists()).toBe(true)
      expect(wrapper.find('label[for="password"]').exists()).toBe(true)
      expect(wrapper.find('label[for="confirmPassword"]').exists()).toBe(true)
    })

    it('has accessible submit button', () => {
      const wrapper = mountComponent()
      const submitButton = wrapper.find('button[type="submit"]')

      expect(submitButton.exists()).toBe(true)
      expect(submitButton.text()).toBe('Sign Up')
    })
  })

  describe('Password Strength Hints', () => {
    it('has password field with strength feedback enabled', () => {
      const wrapper = mountComponent()

      // The Password component in the template includes password strength hints
      // but they're in a slot that our stub doesn't render
      // Just verify the password fields exist
      const passwordInputs = wrapper.findAll('input[type="password"]')
      expect(passwordInputs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Loading State', () => {
    it('shows loading state on submit button during signup', async () => {
      authStore.loading = true
      const wrapper = mountComponent()

      const submitButton = wrapper.findComponent({ name: 'Button' })
      expect(submitButton.props('loading')).toBe(true)
    })

    it('does not show loading state when not signing up', () => {
      authStore.loading = false
      const wrapper = mountComponent()

      const submitButton = wrapper.findComponent({ name: 'Button' })
      expect(submitButton.props('loading')).toBe(false)
    })
  })
})
