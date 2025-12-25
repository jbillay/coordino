import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CountryConfigForm from '../CountryConfigForm.vue'
import { nextTick } from 'vue'

describe('CountryConfigForm.vue', () => {
  const mountComponent = (props = {}) =>
    mount(CountryConfigForm, {
      props,
      global: {
        stubs: {
          Card: { template: '<div><slot name="title" /><slot name="content" /></div>' },
          Select: {
            name: 'Select',
            template:
              '<select :disabled="disabled" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.code" :value="opt.code">{{ opt.name }}</option></select>',
            props: [
              'modelValue',
              'disabled',
              'invalid',
              'options',
              'optionLabel',
              'optionValue',
              'placeholder'
            ]
          },
          Checkbox: {
            name: 'Checkbox',
            template: '<input type="checkbox" :checked="checked" @change="onChange" />',
            props: ['modelValue', 'value', 'binary'],
            methods: {
              onChange(e) {
                if (this.binary) {
                  this.$emit('update:modelValue', e.target.checked)
                } else {
                  const currentValue = this.modelValue || []
                  if (e.target.checked) {
                    this.$emit('update:modelValue', [...currentValue, this.value])
                  } else {
                    this.$emit(
                      'update:modelValue',
                      currentValue.filter((v) => v !== this.value)
                    )
                  }
                }
              }
            },
            computed: {
              checked() {
                if (this.binary) {
                  return this.modelValue
                }
                return this.modelValue?.includes(this.value)
              }
            }
          },
          Button: {
            name: 'Button',
            template: '<button :disabled="loading"><slot>{{label}}</slot></button>',
            props: ['label', 'loading', 'type', 'icon', 'severity']
          }
        }
      }
    })

  it('renders in "Add" mode by default', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Add Custom Working Hours')
    expect(
      wrapper.find('button[aria-label="Save custom working hours configuration"]').text()
    ).toBe('Save')
  })

  it('renders in "Edit" mode and populates form with initialData', async () => {
    const initialData = {
      country_code: 'US',
      green_start: '10:00',
      green_end: '18:00',
      orange_morning_start: '09:00',
      orange_morning_end: '10:00',
      orange_evening_start: '18:00',
      orange_evening_end: '19:00',
      work_days: [1, 2, 3]
    }
    const wrapper = mountComponent({ initialData })
    await nextTick()

    expect(wrapper.text()).toContain('Edit Custom Working Hours')
    expect(
      wrapper.find('button[aria-label="Save custom working hours configuration"]').text()
    ).toBe('Update')
    expect(wrapper.find('#green-start').element.value).toBe('10:00')
    expect(wrapper.vm.formData.work_days).toEqual([1, 2, 3])
  })

  it('disables the country selector in edit mode', () => {
    const wrapper = mountComponent({ initialData: { country_code: 'US' } })
    const countrySelector = wrapper.findComponent({ name: 'Select' })
    expect(countrySelector.props('disabled')).toBe(true)
  })

  it('validates successfully with default data and a country', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual(expect.objectContaining({ country_code: 'US' }))
  })

  it('shows an error if country is not selected', async () => {
    const wrapper = mountComponent()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.find('.error-message').text()).toBe('Please select a country')
  })

  it('shows an error if green start time is after end time', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.green_start = '18:00'
    wrapper.vm.formData.green_end = '17:00'
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.text()).toContain('Start time must be before end time')
  })

  it('shows an error if orange morning overlaps with green hours', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.orange_morning_end = '09:01' // Default green start is 09:00
    await nextTick()

    await wrapper.find('form').trigger('submit')
    await nextTick()

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.text()).toContain('Should end before green hours start')
  })

  it('shows an error if no working days are selected', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.work_days = []
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.text()).toContain('Please select at least one working day')
  })

  it('emits "cancel" event when cancel button is clicked', async () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const cancelButton = buttons.find((b) => b.props('label') === 'Cancel')
    await cancelButton.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('shows loading state on submit button when loading prop is true', () => {
    const wrapper = mountComponent({ loading: true })
    const submitButton = wrapper
      .findAllComponents({ name: 'Button' })
      .find((b) => b.props('label') === 'Save')
    expect(submitButton.props('loading')).toBe(true)
  })

  it('validates orange evening start time must be after green end time', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.green_end = '17:00'
    wrapper.vm.formData.orange_evening_start = '16:00' // Before green end
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.text()).toContain('Should start after green hours end')
  })

  it('validates orange morning start must be before orange morning end', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.orange_morning_start = '08:00'
    wrapper.vm.formData.orange_morning_end = '07:00'
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.text()).toContain('Start time must be before end time')
  })

  it('validates orange evening start must be before orange evening end', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.orange_evening_start = '18:00'
    wrapper.vm.formData.orange_evening_end = '17:00'
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.text()).toContain('Start time must be before end time')
  })

  it('validates work_days contains valid day numbers', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.work_days = [1, 2, 8] // 8 is invalid
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.text()).toContain('Invalid day selected')
  })

  it('handles checkbox selection for working days', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'

    // Initially has Mon-Fri (1-5)
    expect(wrapper.vm.formData.work_days).toEqual([1, 2, 3, 4, 5])

    // Manually add Saturday to test the formData structure
    wrapper.vm.formData.work_days.push(6)
    await nextTick()

    // Should now include Saturday
    expect(wrapper.vm.formData.work_days).toContain(6)
  })

  it('resets errors when validation passes', async () => {
    const wrapper = mountComponent()

    // First submit without country - should show error
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Please select a country')

    // Now add country and submit again
    wrapper.vm.formData.country_code = 'US'
    await nextTick()
    await wrapper.find('form').trigger('submit')

    // Error should be cleared
    expect(wrapper.vm.errors.country_code).toBe('')
  })

  it('handles time input changes correctly', async () => {
    const wrapper = mountComponent()

    const greenStartInput = wrapper.find('#green-start')
    await greenStartInput.setValue('10:00')
    await nextTick()

    expect(wrapper.vm.formData.green_start).toBe('10:00')
  })

  it('applies invalid class to inputs with errors', async () => {
    const wrapper = mountComponent()
    await wrapper.find('form').trigger('submit')
    await nextTick()

    // Country selector should have invalid prop
    const countrySelect = wrapper.findComponent({ name: 'Select' })
    expect(countrySelect.props('invalid')).toBe(true)
  })

  it('displays all country options', () => {
    const wrapper = mountComponent()

    expect(wrapper.vm.countryOptions.length).toBe(15)
    expect(wrapper.vm.countryOptions[0]).toEqual({ code: 'US', name: 'United States' })
    expect(wrapper.vm.countryOptions.some((c) => c.code === 'JP')).toBe(true)
  })

  it('displays all days of week options', () => {
    const wrapper = mountComponent()

    expect(wrapper.vm.daysOfWeek.length).toBe(7)
    expect(wrapper.vm.daysOfWeek[0]).toEqual({ value: 1, label: 'Monday' })
    expect(wrapper.vm.daysOfWeek[6]).toEqual({ value: 7, label: 'Sunday' })
  })

  it('watchers update formData when initialData changes', async () => {
    const wrapper = mountComponent()

    expect(wrapper.vm.formData.country_code).toBe('')

    const newInitialData = {
      country_code: 'FR',
      green_start: '08:30',
      green_end: '16:30',
      orange_morning_start: '07:30',
      orange_morning_end: '08:30',
      orange_evening_start: '16:30',
      orange_evening_end: '17:30',
      work_days: [1, 2, 3, 4]
    }

    await wrapper.setProps({ initialData: newInitialData })
    await nextTick()

    expect(wrapper.vm.formData.country_code).toBe('FR')
    expect(wrapper.vm.formData.green_start).toBe('08:30')
    expect(wrapper.vm.formData.work_days).toEqual([1, 2, 3, 4])
  })

  it('uses default work_days when initialData has null work_days', async () => {
    const wrapper = mountComponent({
      initialData: {
        country_code: 'US',
        green_start: '09:00',
        green_end: '17:00',
        orange_morning_start: '08:00',
        orange_morning_end: '09:00',
        orange_evening_start: '17:00',
        orange_evening_end: '18:00',
        work_days: null
      }
    })

    await nextTick()

    expect(wrapper.vm.formData.work_days).toEqual([1, 2, 3, 4, 5])
  })

  it('renders all form sections with correct titles', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Optimal Working Hours (Green)')
    expect(wrapper.text()).toContain('Acceptable Early Hours (Orange)')
    expect(wrapper.text()).toContain('Acceptable Late Hours (Orange)')
    expect(wrapper.text()).toContain('Working Days')
  })

  it('renders all time input fields with correct labels', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('label[for="green-start"]').text()).toContain('Start Time')
    expect(wrapper.find('label[for="green-end"]').text()).toContain('End Time')
    expect(wrapper.find('label[for="orange-morning-start"]').exists()).toBe(true)
    expect(wrapper.find('label[for="orange-evening-end"]').exists()).toBe(true)
  })

  it('validates successfully with all valid data', async () => {
    const wrapper = mountComponent()

    wrapper.vm.formData.country_code = 'JP'
    wrapper.vm.formData.green_start = '09:00'
    wrapper.vm.formData.green_end = '18:00'
    wrapper.vm.formData.orange_morning_start = '08:00'
    wrapper.vm.formData.orange_morning_end = '09:00'
    wrapper.vm.formData.orange_evening_start = '18:00'
    wrapper.vm.formData.orange_evening_end = '20:00'
    wrapper.vm.formData.work_days = [1, 2, 3, 4, 5, 6]
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0].country_code).toBe('JP')
    expect(wrapper.emitted('submit')[0][0].work_days).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('shows multiple errors when multiple validations fail', async () => {
    const wrapper = mountComponent()

    wrapper.vm.formData.country_code = 'US'
    wrapper.vm.formData.green_start = '18:00'
    wrapper.vm.formData.green_end = '09:00' // Invalid: end before start
    wrapper.vm.formData.work_days = [] // Invalid: empty
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.vm.errors.green_start).toBeTruthy()
    expect(wrapper.vm.errors.green_end).toBeTruthy()
    expect(wrapper.vm.errors.work_days).toBeTruthy()
  })

  it('converts time strings to minutes correctly in validation', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'

    // Test edge case with same hour but different minutes
    wrapper.vm.formData.green_start = '09:30'
    wrapper.vm.formData.green_end = '09:15'
    await nextTick()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
    expect(wrapper.vm.errors.green_start).toBeTruthy()
  })

  it('handles form submission with prevent default', async () => {
    const wrapper = mountComponent()
    wrapper.vm.formData.country_code = 'US'
    await nextTick()

    const form = wrapper.find('form')
    const submitEvent = { preventDefault: vi.fn() }

    await form.trigger('submit', submitEvent)

    // Form uses @submit.prevent, so preventDefault is handled by Vue
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('renders aria-label attributes for accessibility', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('#country').attributes('aria-label')).toContain('Select country')
    expect(wrapper.find('#green-start').attributes('aria-label')).toContain(
      'Optimal hours start time'
    )
    expect(
      wrapper.find('button[aria-label="Save custom working hours configuration"]').exists()
    ).toBe(true)
  })
})
