import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ParticipantDialog from '../ParticipantDialog.vue'

// Mock child components
const Dialog = {
  name: 'Dialog',
  template: '<div v-if="visible"><slot /><slot name="footer" /></div>',
  props: ['visible']
}
const CountrySelector = {
  name: 'CountrySelector',
  template: '<div class="mock-country-selector"></div>',
  props: ['modelValue', 'invalid']
}
const TimezoneSelector = {
  name: 'TimezoneSelector',
  template: '<div class="mock-timezone-selector"></div>',
  props: ['modelValue', 'invalid']
}

describe('ParticipantDialog.vue', () => {
  const mountComponent = (props = {}) =>
    mount(ParticipantDialog, {
      props: {
        visible: true,
        ...props
      },
      global: {
        stubs: {
          Dialog,
          CountrySelector,
          TimezoneSelector,
          InputText: true,
          Textarea: true,
          Button: {
            name: 'Button',
            template: '<button :disabled="loading"><slot>{{ label }}</slot></button>',
            props: ['label', 'loading']
          }
        }
      }
    })

  it('renders the dialog when visible is true', () => {
    const wrapper = mountComponent()
    expect(wrapper.findComponent(Dialog).props('visible')).toBe(true)
  })

  it('does not render when visible is false', () => {
    const wrapper = mountComponent({ visible: false })
    expect(wrapper.find('div > div').exists()).toBe(false)
  })

  it('shows "Add Participant" title in create mode', () => {
    const wrapper = mountComponent({ participant: null })
    // The header prop is passed to the Dialog, which we've stubbed.
    // We can check the computed property on the vm instead.
    expect(wrapper.vm.dialogTitle).toBe('Add Participant')
  })

  it('shows "Edit Participant" title and populates data in edit mode', async () => {
    const participant = {
      id: '1',
      name: 'Alice',
      country: 'US',
      timezone: 'America/New_York',
      notes: 'Test'
    }
    const wrapper = mountComponent({ participant })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.dialogTitle).toBe('Edit Participant')
    expect(wrapper.vm.localParticipant.name).toBe('Alice')
    expect(wrapper.vm.localParticipant.country).toBe('US')
  })

  it('emits save with correct payload on successful creation', async () => {
    const wrapper = mountComponent()

    wrapper.vm.localParticipant = {
      name: 'Bob',
      country: 'GB',
      timezone: 'Europe/London',
      notes: ''
    }
    await wrapper.vm.$nextTick()

    await wrapper.vm.handleSave()

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toEqual({
      id: null,
      name: 'Bob',
      country: 'GB',
      timezone: 'Europe/London',
      notes: ''
    })
  })

  it('emits save with participant ID on successful edit', async () => {
    const participant = {
      id: '123',
      name: 'Alice',
      country: 'US',
      timezone: 'America/New_York',
      notes: 'Test'
    }
    const wrapper = mountComponent({ participant })

    wrapper.vm.localParticipant.name = 'Alice V2'
    await wrapper.vm.$nextTick()

    await wrapper.vm.handleSave()

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toEqual(
      expect.objectContaining({
        id: '123',
        name: 'Alice V2'
      })
    )
  })

  it('shows validation errors and does not emit save', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.handleSave() // Try to save with empty form

    expect(wrapper.emitted('save')).toBeFalsy()
    expect(wrapper.vm.errors.name).toBe('Name is required')
    expect(wrapper.vm.errors.country).toBe('Country is required')
    expect(wrapper.vm.errors.timezone).toBe('Timezone is required')
    // Check if errors are rendered (optional)
    expect(wrapper.text()).toContain('Name is required')
  })

  it('emits update:visible when cancel button is clicked', async () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const cancelButton = buttons.find((b) => b.props('label') === 'Cancel')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')[0]).toEqual([false])
  })

  it('shows loading state on save button', () => {
    const wrapper = mountComponent({ saving: true })
    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const saveButton = buttons.find((b) => b.props('label') === 'Add Participant')
    expect(saveButton.props('loading')).toBe(true)
  })
})
