import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ParticipantSelector from '../ParticipantSelector.vue'

describe('ParticipantSelector.vue', () => {
  const mockParticipants = [
    { id: '1', name: 'Alice', timezone: 'UTC', country: 'US' },
    { id: '2', name: 'Bob', timezone: 'GMT', country: 'GB' }
  ]

  const mountComponent = (props = {}) =>
    mount(ParticipantSelector, {
      props: {
        participants: mockParticipants,
        ...props
      },
      global: {
        stubs: {
          Select: {
            name: 'Select',
            template: `
              <div class="mock-select" :disabled="disabled" :class="{ 'p-invalid': invalid }">
                <slot name="value" :value="modelValue" :placeholder="placeholder"></slot>
                <div class="options">
                  <div v-for="option in options" :key="option.id" class="option">
                    <slot name="option" :option="option"></slot>
                  </div>
                </div>
              </div>
            `,
            props: [
              'modelValue',
              'options',
              'placeholder',
              'filter',
              'showClear',
              'disabled',
              'invalid'
            ]
          }
        }
      }
    })

  it('renders a label when provided', () => {
    const wrapper = mountComponent({ label: 'Select Participant' })
    expect(wrapper.find('label').exists()).toBe(true)
    expect(wrapper.find('label').text()).toBe('Select Participant')
  })

  it('does not render a label when not provided', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('label').exists()).toBe(false)
  })

  it('displays placeholder when no value is selected', () => {
    const wrapper = mountComponent({ placeholder: 'Choose one' })
    expect(wrapper.text()).toContain('Choose one')
  })

  it('displays the name of the selected participant', () => {
    const wrapper = mountComponent({ modelValue: '2' })
    // The #value slot is used, which calls getParticipantName
    expect(wrapper.text()).toContain('Bob')
  })

  it('renders all participant options in the slot', () => {
    const wrapper = mountComponent()
    const options = wrapper.findAll('.option')
    expect(options).toHaveLength(2)
    expect(options[0].text()).toContain('Alice')
    expect(options[0].text()).toContain('UTC (US)')
    expect(options[1].text()).toContain('Bob')
    expect(options[1].text()).toContain('GMT (GB)')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mountComponent()
    // Simulate the Select component emitting an update
    wrapper.findComponent({ name: 'Select' }).vm.$emit('update:modelValue', '1')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['1'])
  })

  it('passes disabled prop to Select component', () => {
    const wrapper = mountComponent({ disabled: true })
    expect(wrapper.find('.mock-select').attributes('disabled')).toBeDefined()
  })

  it('passes invalid prop to Select component', () => {
    const wrapper = mountComponent({ invalid: true })
    expect(wrapper.find('.mock-select').classes()).toContain('p-invalid')
  })
})
