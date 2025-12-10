import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MeetingForm from '../MeetingForm.vue'

describe('MeetingForm.vue', () => {
  const mockMeeting = {
    title: 'Quarterly Review',
    proposed_time: new Date('2025-12-15T14:00:00'),
    notes: 'Discuss Q4 results'
  }

  let wrapper

  beforeEach(() => {
    wrapper = mount(MeetingForm, {
      props: {
        meeting: mockMeeting
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
            props: [
              'modelValue',
              'showTime',
              'showSeconds',
              'showButtonBar',
              'dateFormat',
              'hourFormat',
              'invalid'
            ]
          },
          Textarea: {
            template:
              '<textarea class="textarea-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'rows']
          }
        }
      }
    })
  })

  it('renders the form', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('displays title input with label', () => {
    expect(wrapper.text()).toContain('Meeting Title *')
    expect(wrapper.find('.input-text-stub').exists()).toBe(true)
  })

  it('displays proposed time calendar with label', () => {
    expect(wrapper.text()).toContain('Proposed Meeting Time *')
    expect(wrapper.find('.datepicker-stub').exists()).toBe(true)
  })

  it('displays notes textarea with label', () => {
    expect(wrapper.text()).toContain('Notes (Optional)')
    expect(wrapper.find('.textarea-stub').exists()).toBe(true)
  })

  it('populates form with meeting data', () => {
    expect(wrapper.vm.localMeeting.title).toBe('Quarterly Review')
    expect(wrapper.vm.localMeeting.notes).toBe('Discuss Q4 results')
  })

  it('emits update:meeting when title changes', async () => {
    const input = wrapper.find('.input-text-stub')
    await input.setValue('New Title')
    await input.trigger('input')

    expect(wrapper.emitted('update:meeting')).toBeTruthy()
  })

  it('emits input event when form changes', async () => {
    const input = wrapper.find('.input-text-stub')
    await input.trigger('input')

    expect(wrapper.emitted('input')).toBeTruthy()
  })

  it('validates required title field', async () => {
    wrapper.vm.localMeeting.title = ''
    const isValid = wrapper.vm.validate()

    expect(isValid).toBe(false)
    expect(wrapper.vm.errors.title).toBe('Meeting title is required')
  })

  it('validates required proposed_time field', async () => {
    wrapper.vm.localMeeting.proposed_time = null
    const isValid = wrapper.vm.validate()

    expect(isValid).toBe(false)
    expect(wrapper.vm.errors.proposed_time).toBe('Proposed time is required')
  })

  it('passes validation with valid data', () => {
    const isValid = wrapper.vm.validate()

    expect(isValid).toBe(true)
    expect(Object.keys(wrapper.vm.errors).length).toBe(0)
  })

  it('shows error message for invalid title', async () => {
    wrapper.vm.localMeeting.title = ''
    wrapper.vm.validate()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Meeting title is required')
  })

  it('shows error message for invalid proposed_time', async () => {
    wrapper.vm.localMeeting.proposed_time = null
    wrapper.vm.validate()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Proposed time is required')
  })

  it('updates local meeting when prop changes', async () => {
    const newMeeting = {
      title: 'Updated Meeting',
      proposed_time: new Date('2025-12-20T10:00:00'),
      notes: 'New notes'
    }

    await wrapper.setProps({ meeting: newMeeting })

    expect(wrapper.vm.localMeeting.title).toBe('Updated Meeting')
    expect(wrapper.vm.localMeeting.notes).toBe('New notes')
  })

  it('exposes validate method', () => {
    expect(typeof wrapper.vm.validate).toBe('function')
  })

  it('trims whitespace when validating title', () => {
    wrapper.vm.localMeeting.title = '   '
    const isValid = wrapper.vm.validate()

    expect(isValid).toBe(false)
    expect(wrapper.vm.errors.title).toBe('Meeting title is required')
  })

  it('allows empty notes field', () => {
    wrapper.vm.localMeeting.notes = ''
    const isValid = wrapper.vm.validate()

    expect(isValid).toBe(true)
  })
})
