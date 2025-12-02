import { mount } from '@vue/test-utils'
import CategoryManager from '../CategoryManager.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/features/tasks/store'
import Button from 'primevue/button'

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

describe('CategoryManager.vue', () => {
  const getWrapper = () =>
    mount(CategoryManager, {
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
                categories: [
                  { id: 1, name: 'Category 1', color: '#ff0000' },
                  { id: 2, name: 'Category 2', color: '#00ff00' }
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

  it('renders a list of categories', () => {
    const wrapper = getWrapper()
    expect(wrapper.text()).toContain('Category 1')
    expect(wrapper.text()).toContain('Category 2')
  })

  it('calls store action "createCategory" when a new category is added', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    store.createCategory.mockResolvedValue({ success: true })
    await wrapper.find('input[placeholder="Category name"]').setValue('New Category')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Add Category')
      .trigger('click')
    expect(store.createCategory).toHaveBeenCalled()
  })

  it('opens the confirm dialog when deleting a category', async () => {
    const wrapper = getWrapper()
    await wrapper.find('button[aria-label="Delete category"]').trigger('click')
    expect(wrapper.vm.showDeleteConfirm).toBe(true)
    expect(wrapper.vm.categoryToDelete).toEqual({ id: 1, name: 'Category 1', color: '#ff0000' })
  })

  it('calls store action "deleteCategory" when a category is deleted', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    store.deleteCategory.mockResolvedValue({ success: true })
    wrapper.vm.categoryToDelete = { id: 1, name: 'Category 1', color: '#ff0000' }
    await wrapper.vm.confirmDelete()
    expect(store.deleteCategory).toHaveBeenCalledWith(1)
  })
})
