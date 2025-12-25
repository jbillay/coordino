import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CountryConfigList from '../CountryConfigList.vue'

describe('CountryConfigList.vue', () => {
  const mockConfigs = [
    {
      id: '1',
      country_code: 'US',
      green_start: '09:00',
      green_end: '17:00',
      orange_morning_start: '08:00',
      orange_morning_end: '09:00',
      orange_evening_start: '17:00',
      orange_evening_end: '18:00',
      work_days: [1, 2, 3, 4, 5]
    },
    {
      id: '2',
      country_code: 'JP',
      green_start: '10:00',
      green_end: '19:00',
      orange_morning_start: '09:00',
      orange_morning_end: '10:00',
      orange_evening_start: '19:00',
      orange_evening_end: '20:00',
      work_days: [1, 2, 3, 4, 5, 6]
    }
  ]

  const mountComponent = (props = {}) =>
    mount(CountryConfigList, {
      props: {
        configurations: mockConfigs,
        ...props
      },
      global: {
        stubs: {
          Dialog: {
            name: 'Dialog',
            template:
              '<div v-if="visible" class="mock-dialog"><slot /><slot name="footer" /></div>',
            props: ['visible', 'header']
          }
        }
      }
    })

  it('renders empty state when no configurations are provided', () => {
    const wrapper = mountComponent({ configurations: [] })
    expect(wrapper.find('.empty-message').exists()).toBe(true)
    expect(wrapper.text()).toContain('No custom working hours configured yet.')
  })

  it('renders a list of configurations', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('United States')
    expect(wrapper.text()).toContain('Japan')
    expect(wrapper.text()).toContain('09:00 - 17:00')
    expect(wrapper.text()).toContain('10:00 - 19:00')
  })

  it('formats working days correctly', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Mon, Tue, Wed, Thu, Fri')
    expect(wrapper.text()).toContain('Mon, Tue, Wed, Thu, Fri, Sat')
  })

  it('emits "edit" with the correct config when edit button is clicked', async () => {
    const wrapper = mountComponent()
    // Find all buttons with pencil icon (edit buttons)
    const editButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label')?.includes('Edit'))
    expect(editButtons.length).toBeGreaterThan(0)

    await editButtons[0].trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toEqual(mockConfigs[0])
  })

  it('opens delete confirmation dialog on delete button click', async () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.mock-dialog').exists()).toBe(false)

    // Find all buttons with trash icon (delete buttons)
    const deleteButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label')?.includes('Delete'))
    expect(deleteButtons.length).toBeGreaterThan(0)

    await deleteButtons[0].trigger('click')

    expect(wrapper.find('.mock-dialog').exists()).toBe(true)
    expect(wrapper.text()).toContain(
      'Are you sure you want to delete custom working hours for United States'
    )
  })

  it('emits "delete" with the ID when deletion is confirmed', async () => {
    const wrapper = mountComponent()

    // Open dialog
    const deleteButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label')?.includes('Delete'))
    await deleteButtons[0].trigger('click')
    expect(wrapper.find('.mock-dialog').exists()).toBe(true)

    // Find and click confirm delete button within the dialog
    const dialog = wrapper.findComponent({ name: 'Dialog' })
    const confirmButton = dialog.findAll('button').find((b) => b.text().includes('Delete'))
    await confirmButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0][0]).toBe('1')
  })

  it('closes the delete dialog when closeDeleteDialog is called', async () => {
    const wrapper = mountComponent()

    // Open dialog
    const deleteButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label')?.includes('Delete'))
    await deleteButtons[0].trigger('click')
    expect(wrapper.find('.mock-dialog').exists()).toBe(true)

    // Call exposed method
    wrapper.vm.closeDeleteDialog()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.mock-dialog').exists()).toBe(false)
  })
})
