import { mount } from '@vue/test-utils'
import TaskDialog from '../TaskDialog.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/features/tasks/store'

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}))

describe('TaskDialog.vue', () => {
  const getWrapper = (props) =>
    mount(TaskDialog, {
      props: {
        visible: true,
        ...props
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        stubs: {
          Dialog: {
            template: `
              <div>
                <button aria-label="Close" @click="$emit('update:visible', false)"></button>
                <slot name="header"></slot>
                <slot></slot>
                <slot name="footer"></slot>
              </div>
            `,
            props: ['visible'],
            emits: ['update:visible']
          },
          Button: {
            props: ['label', 'icon', 'loading'],
            template: '<button :disabled="loading">{{ label }}</button>'
          },
          InputText: {
            props: ['modelValue'],
            template:
              '<input :id="$attrs.id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
          },
          Textarea: {
            props: ['modelValue'],
            template:
              '<textarea :id="$attrs.id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>'
          },
          Select: {
            props: ['modelValue', 'options'],
            template: `
              <select :id="$attrs.id" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
                <option v-for="option in options" :key="option.id || option" :value="option.id || option">
                  {{ option.name || option }}
                </option>
              </select>
            `
          },
          DatePicker: {
            props: ['modelValue'],
            template:
              '<input type="date" :id="$attrs.id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
          }
        }
      }
    })

  it('renders correctly when creating a new task', () => {
    const wrapper = getWrapper()
    expect(wrapper.text()).toContain('Create New Task')
  })

  it('renders correctly when editing an existing task', () => {
    const wrapper = getWrapper({
      task: { id: 1, title: 'Test Task' }
    })
    expect(wrapper.text()).toContain('Edit Task')
  })

  it('emits "update:visible" event when the cancel button is clicked', async () => {
    const wrapper = getWrapper()
    const buttons = wrapper.findAll('button')
    const cancelButton = buttons.find((b) => b.text() === 'Cancel')
    await cancelButton.trigger('click')
    expect(wrapper.emitted('update:visible')[0]).toEqual([false])
  })

  it('calls store action "createTask" when form is submitted for a new task', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    store.statuses = [{ id: 1, name: 'To Do' }]
    store.categories = [{ id: 1, name: 'Test Category' }]
    store.createTask.mockResolvedValue({ success: true, data: {} })

    await wrapper.find('input[id="task-title"]').setValue('Test Task')
    await wrapper.find('textarea[id="task-description"]').setValue('Test Description')
    await wrapper.find('select[id="task-status"]').setValue('1')
    await wrapper.find('select[id="task-category"]').setValue('1')
    await wrapper.find('select[id="task-priority"]').setValue('high')
    await wrapper.find('input[id="task-owner"]').setValue('John Doe')
    await wrapper.find('input[id="task-due-date"]').setValue('2025-12-31')

    const buttons = wrapper.findAll('button')
    const createButton = buttons.find((b) => b.text() === 'Create Task')
    await createButton.trigger('click')
    expect(store.createTask).toHaveBeenCalled()
  })

  it('calls store action "updateTask" when form is submitted for an existing task', async () => {
    const wrapper = getWrapper({
      task: { id: 1, title: 'Test Task', status_id: 1 }
    })
    const store = useTaskStore()
    store.updateTask.mockResolvedValue({ success: true, data: {} })

    await wrapper.find('input[id="task-title"]').setValue('Updated Task')
    const buttons = wrapper.findAll('button')
    const updateButton = buttons.find((b) => b.text() === 'Update Task')
    await updateButton.trigger('click')
    expect(store.updateTask).toHaveBeenCalled()
  })
})
