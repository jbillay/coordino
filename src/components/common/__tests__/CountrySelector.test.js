import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CountrySelector from '../CountrySelector.vue'
import Select from 'primevue/select'

describe('CountrySelector.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CountrySelector, {
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
      wrapper = mount(CountrySelector, {
        props: {
          label: 'Select Country'
        },
        global: {
          components: { Select }
        }
      })
      expect(wrapper.text()).toContain('Select Country')
    })

    it('should not render label when label prop is empty', () => {
      wrapper = mount(CountrySelector, {
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
      wrapper = mount(CountrySelector, {
        props: {
          modelValue: 'US'
        },
        global: {
          components: { Select }
        }
      })
      expect(wrapper.props('modelValue')).toBe('US')
    })

    it('should accept placeholder prop', () => {
      wrapper = mount(CountrySelector, {
        props: {
          placeholder: 'Choose a country'
        },
        global: {
          components: { Select }
        }
      })
      const select = wrapper.findComponent(Select)
      expect(select.props('placeholder')).toBe('Choose a country')
    })

    it('should accept disabled prop', () => {
      wrapper = mount(CountrySelector, {
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
      wrapper = mount(CountrySelector, {
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
      wrapper = mount(CountrySelector, {
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
  })

  describe('Country Data', () => {
    it('should have a list of countries', () => {
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      expect(Array.isArray(options)).toBe(true)
      expect(options.length).toBeGreaterThan(0)
    })

    it('should have countries sorted alphabetically by name', () => {
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      const names = options.map((c) => c.name)
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b))
      expect(names).toEqual(sortedNames)
    })

    it('should include common countries', () => {
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      const codes = options.map((c) => c.code)
      expect(codes).toContain('US')
      expect(codes).toContain('GB')
      expect(codes).toContain('FR')
      expect(codes).toContain('DE')
    })

    it('should have country objects with code and name properties', () => {
      const select = wrapper.findComponent(Select)
      const options = select.props('options')
      options.forEach((country) => {
        expect(country).toHaveProperty('code')
        expect(country).toHaveProperty('name')
        expect(typeof country.code).toBe('string')
        expect(typeof country.name).toBe('string')
      })
    })
  })

  describe('Events', () => {
    it('should emit update:modelValue when selection changes', async () => {
      const select = wrapper.findComponent(Select)
      await select.vm.$emit('update:modelValue', 'US')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['US'])
    })

    it('should emit change event when selection changes', async () => {
      const select = wrapper.findComponent(Select)
      await select.vm.$emit('change', { value: 'GB' })

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')[0]).toEqual(['GB'])
    })
  })

  describe('Two-way Binding', () => {
    it('should update internal state when modelValue prop changes', async () => {
      wrapper = mount(CountrySelector, {
        props: {
          modelValue: 'US'
        },
        global: {
          components: { Select }
        }
      })

      await wrapper.setProps({ modelValue: 'GB' })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedCountry).toBe('GB')
    })
  })

  describe('Helper Functions', () => {
    it('should return country name for valid code', () => {
      const countryName = wrapper.vm.getCountryName('US')
      expect(countryName).toBe('United States')
    })

    it('should return code for invalid country code', () => {
      const countryName = wrapper.vm.getCountryName('XX')
      expect(countryName).toBe('XX')
    })
  })

  describe('Accessibility', () => {
    it('should have unique id generated', () => {
      expect(wrapper.vm.inputId).toMatch(/^country-/)
    })

    it('should pass id to Select component', () => {
      wrapper = mount(CountrySelector, {
        props: {
          label: 'Country'
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
