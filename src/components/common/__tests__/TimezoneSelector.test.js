import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TimezoneSelector from '../TimezoneSelector.vue'
import Select from 'primevue/select'

describe('TimezoneSelector.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(TimezoneSelector, {
      global: {
        components: {
          Select
        }
      }
    })
  })

  describe('Component Structure', () => {
    it('should render without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should render a label when label prop is provided', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          label: 'Select Timezone'
        },
        global: {
          components: { Select }
        }
      })
      expect(wrapper.text()).toContain('Select Timezone')
    })

    it('should not render label when label prop is empty', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          label: ''
        },
        global: {
          components: { Select }
        }
      })
      const label = wrapper.find('label')
      expect(label.exists()).toBe(false)
    })

    it('should render Select component', () => {
      expect(wrapper.findComponent(Select).exists()).toBe(true)
    })
  })

  describe('Props', () => {
    it('should accept modelValue prop', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          modelValue: 'America/New_York'
        },
        global: {
          components: { Select }
        }
      })
      expect(wrapper.props('modelValue')).toBe('America/New_York')
    })

    it('should accept placeholder prop', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          placeholder: 'Choose a timezone'
        },
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      expect(select.props('placeholder')).toBe('Choose a timezone')
    })

    it('should accept disabled prop', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          disabled: true
        },
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      expect(select.props('disabled')).toBe(true)
    })

    it('should accept invalid prop', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          invalid: true
        },
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      expect(select.props('invalid')).toBe(true)
    })

    it('should accept showClear prop', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          showClear: false
        },
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      expect(select.props('showClear')).toBe(false)
    })

    it('should accept countryCode prop', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          countryCode: 'US'
        },
        global: {
          components: { Select }
        }
      })
      expect(wrapper.props('countryCode')).toBe('US')
    })
  })

  describe('Timezone Data', () => {
    it('should have a list of timezones', () => {
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      expect(Array.isArray(options)).toBe(true)
      expect(options.length).toBeGreaterThan(0)
    })

    it('should include common US timezones', () => {
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      const values = options.map((tz) => tz.value)
      expect(values).toContain('America/New_York')
      expect(values).toContain('America/Los_Angeles')
      expect(values).toContain('America/Chicago')
    })

    it('should have timezone objects with value, label, offset, and country properties', () => {
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      options.forEach((timezone) => {
        expect(timezone).toHaveProperty('value')
        expect(timezone).toHaveProperty('label')
        expect(timezone).toHaveProperty('offset')
        expect(timezone).toHaveProperty('country')
      })
    })
  })

  describe('Country Filtering', () => {
    it('should show all timezones when countryCode is not provided', () => {
      wrapper = mount(TimezoneSelector, {
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      const countries = [...new Set(options.map((tz) => tz.country))]
      expect(countries.length).toBeGreaterThan(1)
    })

    it('should filter timezones by country code when provided', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          countryCode: 'US'
        },
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      options.forEach((timezone) => {
        expect(timezone.country).toBe('US')
      })
    })

    it('should update filtered timezones when countryCode changes', async () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          countryCode: 'US'
        },
        global: {
          components: { Select }
        }
      })

      let select = wrapper.findComponent(Select)
      let options = select.props('options')
      const usCount = options.length

      await wrapper.setProps({ countryCode: 'GB' })
      await wrapper.vm.$nextTick()

      select = wrapper.findComponent(Select)
      options = select.props('options')
      options.forEach((timezone) => {
        expect(timezone.country).toBe('GB')
      })
      expect(options.length).toBeLessThan(usCount)
    })
  })

  describe('Events', () => {
    it('should emit update:modelValue when selection changes', async () => {
      const select = wrapper.findComponent(Select)
      await select.vm.$emit('update:modelValue', 'America/New_York')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['America/New_York'])
    })

    it('should emit change event when selection changes', async () => {
      const select = wrapper.findComponent(Select)
      await select.vm.$emit('change', { value: 'Europe/London' })

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')[0]).toEqual(['Europe/London'])
    })
  })

  describe('Two-way Binding', () => {
    it('should update internal state when modelValue prop changes', async () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          modelValue: 'America/New_York'
        },
        global: {
          components: { Select }
        }
      })

      await wrapper.setProps({ modelValue: 'Europe/London' })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedTimezone).toBe('Europe/London')
    })
  })

  describe('Helper Functions', () => {
    it('should return timezone label for valid value', () => {
      const label = wrapper.vm.getTimezoneLabel('America/New_York')
      expect(label).toBe('Eastern Time (US)')
    })

    it('should return value for invalid timezone', () => {
      const label = wrapper.vm.getTimezoneLabel('Invalid/Timezone')
      expect(label).toBe('Invalid/Timezone')
    })
  })

  describe('Accessibility', () => {
    it('should have unique id generated', () => {
      expect(wrapper.vm.inputId).toMatch(/^timezone-/)
    })

    it('should pass id to Select component', () => {
      wrapper = mount(TimezoneSelector, {
        props: {
          label: 'Timezone'
        },
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      expect(select.attributes('id')).toBeTruthy()
    })

    it('should enable filtering for accessibility', () => {
      const select = wrapper.findComponent(Select)
      expect(select.props('filter')).toBe(true)
    })
  })
})
