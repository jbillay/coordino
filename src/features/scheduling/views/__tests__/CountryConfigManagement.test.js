import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import CountryConfigManagement from '../CountryConfigManagement.vue'
import { useSchedulingStore } from '../../store'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

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

const mockConfigs = [
  {
    id: 1,
    country_code: 'US',
    work_days: [1, 2, 3, 4, 5],
    work_hours: { start: '09:00', end: '17:00' }
  },
  {
    id: 2,
    country_code: 'FR',
    work_days: [1, 2, 3, 4, 5],
    work_hours: { start: '10:00', end: '18:00' }
  }
]

describe('CountryConfigManagement.vue', () => {
  let wrapper
  let store
  let router
  let toast

  beforeEach(() => {
    router = { push: vi.fn() }
    toast = { add: vi.fn() }
    useRouter.mockReturnValue(router)
    useToast.mockReturnValue(toast)

    const pinia = createTestingPinia({
      initialState: {
        scheduling: { countryConfigurations: mockConfigs }
      },
      stubActions: false
    })
    store = useSchedulingStore(pinia)
    store.fetchCountryConfigurations = vi.fn().mockResolvedValue()
    store.createCountryConfiguration = vi.fn()
    store.updateCountryConfiguration = vi.fn()
    store.deleteCountryConfiguration = vi.fn()

    wrapper = mount(CountryConfigManagement, {
      global: {
        plugins: [pinia],
        stubs: {
          Button: true,
          Card: { template: '<div><slot name="title"/><slot name="content"/></div>' },
          Tag: true,
          Toast: true,
          ProgressSpinner: true,
          CountryConfigForm: {
            template: '<form @submit.prevent="$emit(\'submit\', {})"></form>'
          },
          CountryConfigList: {
            props: ['configurations'],
            template: '<div></div>'
          }
        }
      }
    })
  })

  it('renders correctly and fetches configurations', async () => {
    // onMounted is async, we need to let the promise resolve
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(store.fetchCountryConfigurations).toHaveBeenCalled()
    expect(wrapper.find('.page-title').text()).toBe('Custom Working Hours')
  })

  it('handles new configuration submission', async () => {
    const newConfig = {
      country_code: 'DE',
      work_days: [1, 2, 3, 4, 5],
      work_hours: { start: '08:00', end: '16:00' }
    }
    store.createCountryConfiguration.mockResolvedValue(newConfig)

    await wrapper.vm.handleSubmit(newConfig)

    expect(store.createCountryConfiguration).toHaveBeenCalledWith(newConfig)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Created' })
    )
  })

  it('handles updating an existing configuration', async () => {
    const configToEdit = mockConfigs[0]
    const updatedData = { ...configToEdit, work_hours: { start: '09:30', end: '17:30' } }
    store.updateCountryConfiguration.mockResolvedValue(updatedData)

    wrapper.vm.handleEdit(configToEdit) // Set editing state
    await wrapper.vm.$nextTick()

    await wrapper.vm.handleSubmit(updatedData)

    expect(store.updateCountryConfiguration).toHaveBeenCalledWith(configToEdit.id, updatedData)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Updated' })
    )
    expect(wrapper.vm.editingConfig).toBeNull()
  })

  it('sets editing state when handleEdit is called', async () => {
    const configToEdit = mockConfigs[0]
    wrapper.vm.handleEdit(configToEdit)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.editingConfig).toEqual(configToEdit)
  })

  it('clears editing state on cancel', async () => {
    wrapper.vm.handleEdit(mockConfigs[0])
    await wrapper.vm.$nextTick()
    wrapper.vm.handleCancel()
    expect(wrapper.vm.editingConfig).toBeNull()
  })

  it('handles deleting a configuration', async () => {
    const configToDelete = mockConfigs[1]
    store.deleteCountryConfiguration.mockResolvedValue({})

    await wrapper.vm.handleDelete(configToDelete.id)

    expect(store.deleteCountryConfiguration).toHaveBeenCalledWith(configToDelete.id)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', summary: 'Deleted' })
    )
  })

  it('navigates back when back button is clicked', async () => {
    await wrapper.find('.back-button').trigger('click')
    expect(router.push).toHaveBeenCalledWith('/scheduling')
  })
})
