import { mount } from '@vue/test-utils'
import StatusManager from '../StatusManager.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/features/tasks/store'
import Button from 'primevue/button'

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

describe('StatusManager.vue', () => {
  const getWrapper = () =>
    mount(StatusManager, {
      props: {
        visible: true
      },
      global: {
        components: {
          Button
        },
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              tasks: {
                statuses: [
                  { id: 1, name: 'To Do', color: '#ff0000', user_id: 1 },
                  { id: 2, name: 'In Progress', color: '#00ff00', user_id: 1 }
                ]
              }
            }
          })
        ],
        stubs: {
          Dialog: {
            template:
              '<div><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>'
          },
          Card: {
            template: '<div><slot name="title"></slot><slot name="content"></slot></div>'
          },
          InputText: {
            props: ['modelValue'],
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
          },
          ColorPicker: {
            props: ['modelValue'],
            template:
              '<input type="color" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
          },
          ConfirmDialog: {
            template: '<div></div>'
          }
        }
      }
    })

  it('renders a list of statuses', () => {
    const wrapper = getWrapper()
    expect(wrapper.text()).toContain('To Do')
    expect(wrapper.text()).toContain('In Progress')
  })

  it('calls store action "createStatus" when a new status is added', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    store.createStatus.mockResolvedValue({ success: true })
    await wrapper.find('input[placeholder="Status name"]').setValue('New Status')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Add Status')
      .trigger('click')
    expect(store.createStatus).toHaveBeenCalled()
  })

  it('opens the confirm dialog when deleting a status', async () => {
    const wrapper = getWrapper()
    await wrapper.find('button[aria-label="Delete status"]').trigger('click')
    expect(wrapper.vm.showDeleteConfirm).toBe(true)
    expect(wrapper.vm.statusToDelete).toEqual({
      id: 1,
      name: 'To Do',
      color: '#ff0000',
      user_id: 1
    })
  })

  it('calls store action "deleteStatus" when a status is deleted', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    store.deleteStatus.mockResolvedValue({ success: true })
    wrapper.vm.statusToDelete = { id: 1, name: 'To Do', color: '#ff0000', user_id: 1 }
    await wrapper.vm.confirmDelete()
    expect(store.deleteStatus).toHaveBeenCalledWith(1)
  })
})
