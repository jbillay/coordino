import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ParticipantForm from '../ParticipantForm.vue'
import { nextTick } from 'vue'

// Mock the utils module
vi.mock('../utils', () => ({
  getIANATimezones: vi.fn(() => ['America/New_York', 'Europe/London']),
  getCountryCodes: vi.fn(() => [
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'GB' }
  ]),
  isValidTimezone: vi.fn((tz) => tz && tz.includes('/')),
  isValidCountryCode: vi.fn((code) => code && code.length === 2)
}))

describe('ParticipantForm.vue', () => {
  const mountComponent = (props = {}) =>
    mount(ParticipantForm, {
      props,
      global: {
        stubs: {
          InputText: true,
          Select: true,
          Textarea: true,
          Button: {
            name: 'Button',
            template: '<button :disabled="loading">{{ label }}</button>',
            props: ['label', 'loading']
          }
        }
      }
    })

  it('renders all form fields', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Name *')
    expect(wrapper.text()).toContain('Timezone *')
    expect(wrapper.text()).toContain('Country *')
    expect(wrapper.text()).toContain('Notes')
  })

  it('populates form with initialData', () => {
    const initialData = {
      name: 'Alice',
      timezone: 'Europe/London',
      country_code: 'GB',
      notes: 'Lead Dev'
    }
    const wrapper = mountComponent({ initialData })
    expect(wrapper.vm.formData.name).toBe('Alice')
    expect(wrapper.vm.formData.timezone).toBe('Europe/London')
  })

  it('updates form when initialData prop changes', async () => {
    const wrapper = mountComponent()
    expect(wrapper.vm.formData.name).toBe('')

    const newData = { name: 'Bob' }
    await wrapper.setProps({ initialData: newData })

    expect(wrapper.vm.formData.name).toBe('Bob')
  })

  it('shows validation error if name is empty', async () => {
    const wrapper = mountComponent()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.vm.errors.name).toBe('Name is required')
    expect(wrapper.text()).toContain('Name is required')
  })

  it('emits submit with form data when valid', async () => {
    const wrapper = mountComponent()

    wrapper.vm.formData = {
      name: '  Charlie  ',
      timezone: 'America/New_York',
      country_code: 'US',
      notes: 'QA'
    }
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    const submittedData = wrapper.emitted('submit')[0][0]
    expect(submittedData.name).toBe('Charlie') // Check for trimming
    expect(submittedData.country_code).toBe('US')
  })

  it('does not emit submit when invalid', async () => {
    const wrapper = mountComponent() // All fields empty
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mountComponent()
    // Find the cancel button specifically
    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const cancelButton = buttons.find((b) => b.props('label') === 'Cancel')
    await cancelButton.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('displays a custom submit label', () => {
    const wrapper = mountComponent({ submitLabel: 'Update Now' })
    expect(wrapper.text()).toContain('Update Now')
  })

  it('shows loading state on submit button', () => {
    const wrapper = mountComponent({ loading: true })
    const submitButton = wrapper
      .findAllComponents({ name: 'Button' })
      .find((b) => b.props('label') === 'Save Participant')
    expect(submitButton.props('loading')).toBe(true)
  })
})
