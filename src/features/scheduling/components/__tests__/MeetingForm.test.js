import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MeetingForm from '../MeetingForm.vue'

describe('MeetingForm.vue', () => {
  const mockInitialData = {
    title: 'Quarterly Review',
    proposed_time: '2025-12-15T14:00:00.000Z',
    duration_minutes: 60,
    notes: 'Discuss Q4 results'
  }

  let wrapper

  beforeEach(() => {
    wrapper = mount(MeetingForm, {
      props: {
        initialData: mockInitialData
      },
      global: {
        stubs: {
          InputText: {
            template:
              '<input class="input-text-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'invalid']
          },
          DatePicker: {
            template:
              '<input class="datepicker-stub" type="datetime-local" :value="modelValue" @input="$emit(\'update:modelValue\', new Date($event.target.value))" />',
            props: ['modelValue', 'invalid', 'dateFormat', 'timeOnly', 'stepMinute', 'hourFormat']
          },
          Select: {
            template:
              '<select class="select-stub" :value="modelValue" @change="$emit(\'update:modelValue\', Number($event.target.value))"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'invalid', 'placeholder']
          },
          Textarea: {
            template:
              '<textarea class="textarea-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'rows', 'placeholder']
          },
          Button: {
            template:
              '<button class="button-stub" :type="type" :loading="loading" @click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
            props: ['label', 'type', 'severity', 'loading']
          }
        }
      }
    })
  })

  it('renders the form', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('displays title input with label', () => {
    expect(wrapper.text()).toContain('Meeting Title *')
    expect(wrapper.find('.input-text-stub').exists()).toBe(true)
  })

  it('displays date picker with label', () => {
    expect(wrapper.text()).toContain('Date *')
    const datepickers = wrapper.findAll('.datepicker-stub')
    expect(datepickers.length).toBeGreaterThan(0)
  })

  it('displays time picker with label and help text', () => {
    expect(wrapper.text()).toContain('Time *')
    expect(wrapper.text()).toContain('15-minute intervals (FR-002)')
  })

  it('displays duration select with label', () => {
    expect(wrapper.text()).toContain('Duration *')
    expect(wrapper.find('.select-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Duration must be between 15 minutes and 8 hours')
  })

  it('displays notes textarea with label', () => {
    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.find('.textarea-stub').exists()).toBe(true)
  })

  it('displays submit and cancel buttons', () => {
    const buttons = wrapper.findAll('.button-stub')
    expect(buttons.length).toBe(2)
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Save Meeting')
  })

  it('uses custom submit label when provided', async () => {
    await wrapper.setProps({ submitLabel: 'Update Meeting' })
    expect(wrapper.text()).toContain('Update Meeting')
  })

  it('emits submit event with correct data when form is valid', async () => {
    const form = wrapper.find('form')
    await form.trigger('submit')

    await nextTick()

    expect(wrapper.emitted('submit')).toBeTruthy()
    const emittedData = wrapper.emitted('submit')[0][0]
    expect(emittedData).toHaveProperty('title')
    expect(emittedData).toHaveProperty('proposed_time')
    expect(emittedData).toHaveProperty('duration_minutes')
    expect(emittedData).toHaveProperty('notes')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const cancelButton = wrapper.findAll('.button-stub')[0]
    await cancelButton.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('shows error message when title is empty', async () => {
    await wrapper.setProps({ initialData: { ...mockInitialData, title: '' } })

    const form = wrapper.find('form')
    await form.trigger('submit')
    await nextTick()

    expect(wrapper.text()).toContain('Meeting title is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('shows loading state on submit button when loading prop is true', async () => {
    await wrapper.setProps({ loading: true })

    const submitButton = wrapper.findAll('.button-stub')[1]
    expect(submitButton.attributes('loading')).toBeDefined()
  })

  it('trims whitespace from title on submit', async () => {
    const titleInput = wrapper.find('.input-text-stub')
    await titleInput.setValue('  Test Meeting  ')
    await titleInput.trigger('input')

    const form = wrapper.find('form')
    await form.trigger('submit')
    await nextTick()

    const emittedData = wrapper.emitted('submit')[0][0]
    expect(emittedData.title).toBe('Test Meeting')
  })

  it('allows empty notes field', async () => {
    const textarea = wrapper.find('.textarea-stub')
    await textarea.setValue('')
    await textarea.trigger('input')

    const form = wrapper.find('form')
    await form.trigger('submit')
    await nextTick()

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('initializes with provided data', () => {
    const titleInput = wrapper.find('.input-text-stub')
    expect(titleInput.element.value).toBe('Quarterly Review')
  })
})
