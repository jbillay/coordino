import { mount } from '@vue/test-utils'
import TaskCard from '../TaskCard.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { formatTaskDate } from '../../utils'

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}))

describe('TaskCard.vue', () => {
  const task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    category: { id: 1, name: 'Test Category', color: '#000000' },
    status: { id: 1, name: 'To Do', color: '#000000' },
    due_date: '2025-12-31',
    priority: 'medium',
    owner: 'John Doe'
  }

  const getWrapper = (props) =>
    mount(TaskCard, {
      props: {
        task,
        ...props
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ]
      }
    })

  it('renders task details correctly', () => {
    const wrapper = getWrapper()
    expect(wrapper.text()).toContain('Test Task')
    expect(wrapper.text()).toContain('Test Category')
    expect(wrapper.text()).toContain('To Do')
    expect(wrapper.text()).toContain(formatTaskDate(task.due_date))
  })

  it('emits "edit" event when edit button is clicked', async () => {
    const wrapper = getWrapper()
    await wrapper.find('[data-testid="edit-button"]').trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
    expect(wrapper.emitted('edit')[0]).toEqual([task])
  })

  it('calls store action "deleteTask" when delete button is clicked', async () => {
    const wrapper = getWrapper()
    await wrapper.find('[data-testid="delete-button"]').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
    expect(wrapper.emitted('delete')[0]).toEqual([task])
  })

  it('emits "toggle-complete" event when checkbox is clicked', async () => {
    const wrapper = getWrapper()
    await wrapper.find('button[aria-label="Mark as complete"]').trigger('click')
    expect(wrapper.emitted('toggle-complete')).toHaveLength(1)
    expect(wrapper.emitted('toggle-complete')[0]).toEqual([task])
  })
})
