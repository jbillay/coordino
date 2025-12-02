import { mount } from '@vue/test-utils'
import TaskList from '../TaskList.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import TaskCard from '../TaskCard.vue'

describe('TaskList.vue', () => {
  const tasks = [
    { id: 1, title: 'Task 1', description: 'Description 1' },
    { id: 2, title: 'Task 2', description: 'Description 2' }
  ]

  const getWrapper = (props) =>
    mount(TaskList, {
      props: {
        tasks,
        ...props
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        stubs: {
          TaskCard: true
        }
      }
    })

  it('renders a list of tasks', () => {
    const wrapper = getWrapper()
    const taskCards = wrapper.findAllComponents(TaskCard)
    expect(taskCards.length).toBe(2)
  })

  it('displays a message when there are no tasks', () => {
    const wrapper = mount(TaskList, {
      props: {
        tasks: []
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ]
      }
    })
    expect(wrapper.text()).toContain('No tasks found')
  })

  it('emits "edit" event when TaskCard emits "edit"', async () => {
    const wrapper = getWrapper()
    await wrapper.findComponent(TaskCard).vm.$emit('edit', tasks[0])
    expect(wrapper.emitted('edit')[0]).toEqual([tasks[0]])
  })
})
