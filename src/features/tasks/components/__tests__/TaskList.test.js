import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TaskList from '../TaskList.vue'
import TaskCard from '../TaskCard.vue'
import { nextTick } from 'vue'

// Mock utilities
vi.mock('../../utils', () => ({
  groupTasks: vi.fn((tasks, groupBy) => {
    if (groupBy === 'none' || !groupBy) {
      return { 'All Tasks': tasks }
    }

    const groups = {}
    tasks.forEach((task) => {
      let key
      switch (groupBy) {
        case 'status':
          key = task.status?.name || 'No Status'
          break
        case 'category':
          key = task.category?.name || 'No Category'
          break
        case 'priority':
          key = task.priority || 'No Priority'
          break
        default:
          key = 'All Tasks'
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    })

    return groups
  }),
  getPriorityConfig: vi.fn((priority) => {
    const configs = {
      low: { label: 'Low', color: '#3b82f6' },
      medium: { label: 'Medium', color: '#eab308' },
      high: { label: 'High', color: '#f97316' },
      urgent: { label: 'Urgent', color: '#ef4444' }
    }
    return configs[priority] || configs.medium
  }),
  formatTaskDate: vi.fn(() => 'Jan 1, 2025'),
  getDaysRemainingText: vi.fn(() => '5 days remaining'),
  isTaskOverdue: vi.fn(() => false)
}))

describe('TaskList.vue', () => {
  let wrapper

  const createTask = (overrides = {}) => ({
    id: Math.random().toString(),
    title: 'Test Task',
    description: 'Test Description',
    priority: 'medium',
    status: { id: 's1', name: 'Open', color: '#3b82f6' },
    category: { id: 'c1', name: 'Work', color: '#22c55e' },
    completed_at: null,
    ...overrides
  })

  const mountComponent = (props = {}) =>
    mount(TaskList, {
      props: {
        tasks: [],
        groupBy: 'none',
        emptyMessage: 'Get started by creating your first task',
        showCreateButton: true,
        ...props
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        stubs: {
          Button: {
            name: 'Button',
            template: '<button v-bind="$attrs">{{ label }}</button>',
            props: ['label', 'icon']
          }
        }
      }
    })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty State', () => {
    it('should display empty state when no tasks are provided', () => {
      wrapper = mountComponent({ tasks: [] })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No tasks found')
    })

    it('should display custom empty message', () => {
      wrapper = mountComponent({
        tasks: [],
        emptyMessage: 'Custom empty message'
      })

      expect(wrapper.text()).toContain('Custom empty message')
    })

    it('should show create button in empty state when showCreateButton is true', () => {
      wrapper = mountComponent({
        tasks: [],
        showCreateButton: true
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Create Your First Task')
    })

    it('should not show create button when showCreateButton is false', () => {
      wrapper = mountComponent({
        tasks: [],
        showCreateButton: false
      })

      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.exists()).toBe(false)
    })

    it('should emit create-task event when create button is clicked', async () => {
      wrapper = mountComponent({
        tasks: [],
        showCreateButton: true
      })

      const button = wrapper.findComponent({ name: 'Button' })
      await button.trigger('click')

      expect(wrapper.emitted('create-task')).toBeTruthy()
    })

    it('should display empty inbox icon', () => {
      wrapper = mountComponent({ tasks: [] })

      const icon = wrapper.find('.empty-state i.pi-inbox')
      expect(icon.exists()).toBe(true)
    })
  })

  describe('Flat List Rendering', () => {
    it('should render task cards in flat list when groupBy is "none"', () => {
      const tasks = [createTask({ id: '1' }), createTask({ id: '2' })]

      wrapper = mountComponent({
        tasks,
        groupBy: 'none'
      })

      const taskCards = wrapper.findAllComponents(TaskCard)
      expect(taskCards).toHaveLength(2)
    })

    it('should pass correct props to TaskCard components', () => {
      const task = createTask({ id: '1', title: 'Test Task Title' })

      wrapper = mountComponent({
        tasks: [task],
        groupBy: 'none'
      })

      const taskCard = wrapper.findComponent(TaskCard)
      expect(taskCard.props('task')).toEqual(task)
    })

    it('should render tasks in a task-list-container', () => {
      const tasks = [createTask()]

      wrapper = mountComponent({
        tasks,
        groupBy: 'none'
      })

      expect(wrapper.find('.task-list-container').exists()).toBe(true)
    })
  })

  describe('Grouped List Rendering', () => {
    it('should render grouped tasks when groupBy is set', () => {
      const tasks = [
        createTask({ id: '1', status: { name: 'Open' } }),
        createTask({ id: '2', status: { name: 'In Progress' } }),
        createTask({ id: '3', status: { name: 'Open' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      const groups = wrapper.findAll('.task-group')
      expect(groups.length).toBeGreaterThan(0)
    })

    it('should display group headers with names', () => {
      const tasks = [
        createTask({ id: '1', status: { name: 'Open' } }),
        createTask({ id: '2', status: { name: 'In Progress' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      expect(wrapper.text()).toContain('Open')
      expect(wrapper.text()).toContain('In Progress')
    })

    it('should display group count', () => {
      const tasks = [
        createTask({ id: '1', status: { name: 'Open' } }),
        createTask({ id: '2', status: { name: 'Open' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      const groupHeader = wrapper.find('.group-header')
      expect(groupHeader.text()).toContain('(2)')
    })

    it('should group tasks by category', () => {
      const tasks = [
        createTask({ id: '1', category: { name: 'Work' } }),
        createTask({ id: '2', category: { name: 'Personal' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'category'
      })

      expect(wrapper.text()).toContain('Work')
      expect(wrapper.text()).toContain('Personal')
    })

    it('should group tasks by priority', () => {
      const tasks = [
        createTask({ id: '1', priority: 'high' }),
        createTask({ id: '2', priority: 'low' })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'priority'
      })

      const groups = wrapper.findAll('.task-group')
      expect(groups.length).toBeGreaterThan(0)
    })

    it('should render TaskCards within each group', () => {
      const tasks = [
        createTask({ id: '1', status: { name: 'Open' } }),
        createTask({ id: '2', status: { name: 'Open' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      const taskCards = wrapper.findAllComponents(TaskCard)
      expect(taskCards).toHaveLength(2)
    })
  })

  describe('Event Handling', () => {
    it('should emit edit event when TaskCard emits edit', async () => {
      const task = createTask({ id: '1' })

      wrapper = mountComponent({
        tasks: [task],
        groupBy: 'none'
      })

      const taskCard = wrapper.findComponent(TaskCard)
      await taskCard.vm.$emit('edit', task)

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')[0]).toEqual([task])
    })

    it('should emit delete event when TaskCard emits delete', async () => {
      const task = createTask({ id: '1' })

      wrapper = mountComponent({
        tasks: [task],
        groupBy: 'none'
      })

      const taskCard = wrapper.findComponent(TaskCard)
      await taskCard.vm.$emit('delete', task)

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')[0]).toEqual([task])
    })

    it('should emit toggle-complete event when TaskCard emits toggle', async () => {
      const task = createTask({ id: '1' })

      wrapper = mountComponent({
        tasks: [task],
        groupBy: 'none'
      })

      const taskCard = wrapper.findComponent(TaskCard)
      await taskCard.vm.$emit('toggle', task)

      expect(wrapper.emitted('toggle-complete')).toBeTruthy()
      expect(wrapper.emitted('toggle-complete')[0]).toEqual([task])
    })

    it('should emit click event when TaskCard emits click', async () => {
      const task = createTask({ id: '1' })

      wrapper = mountComponent({
        tasks: [task],
        groupBy: 'none'
      })

      const taskCard = wrapper.findComponent(TaskCard)
      await taskCard.vm.$emit('click', task)

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')[0]).toEqual([task])
    })

    it('should forward all events in grouped view', async () => {
      const tasks = [
        createTask({ id: '1', status: { name: 'Open' } }),
        createTask({ id: '2', status: { name: 'Open' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      const firstTaskCard = wrapper.findAllComponents(TaskCard)[0]
      await firstTaskCard.vm.$emit('edit', tasks[0])
      await firstTaskCard.vm.$emit('delete', tasks[0])
      await firstTaskCard.vm.$emit('toggle', tasks[0])
      await firstTaskCard.vm.$emit('click', tasks[0])

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('toggle-complete')).toBeTruthy()
      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })

  describe('Computed Properties', () => {
    it('should compute groupedTasks as empty object when groupBy is "none"', () => {
      const tasks = [createTask()]

      wrapper = mountComponent({
        tasks,
        groupBy: 'none'
      })

      expect(wrapper.vm.groupedTasks).toEqual({})
    })

    it('should compute groupedTasks when groupBy is set', () => {
      const tasks = [
        createTask({ id: '1', status: { name: 'Open' } }),
        createTask({ id: '2', status: { name: 'In Progress' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      const grouped = wrapper.vm.groupedTasks
      expect(Object.keys(grouped).length).toBeGreaterThan(0)
    })

    it('should return empty object when tasks is undefined', () => {
      wrapper = mountComponent({
        tasks: null,
        groupBy: 'status'
      })

      // Component should handle null/undefined gracefully
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null tasks array', () => {
      wrapper = mountComponent({ tasks: null })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('should handle undefined tasks array', () => {
      wrapper = mountComponent({ tasks: undefined })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('should handle tasks with missing group properties', () => {
      const tasks = [
        createTask({ id: '1', status: null }),
        createTask({ id: '2', status: undefined })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      // Should not throw error
      expect(wrapper.exists()).toBe(true)
    })

    it.skip(
      'should handle very large task lists with virtual scrolling',
      { timeout: 30000 },
      () => {
        // NOTE: Virtual scrolling is tested in E2E performance tests (tests/e2e/performance.spec.js)
        // Unit tests can't properly test RecycleScroller as it requires viewport and proper mounting
        const manyTasks = Array.from({ length: 1000 }, (_, i) => createTask({ id: i.toString() }))

        wrapper = mountComponent({
          tasks: manyTasks,
          groupBy: 'none'
        })

        // With >100 tasks, virtual scrolling should be active
        const virtualScroller = wrapper.find('.virtual-scroller')
        expect(virtualScroller.exists()).toBe(true)
      }
    )

    it('should handle switching between grouped and flat views', async () => {
      const tasks = [
        createTask({ id: '1', status: { name: 'Open' } }),
        createTask({ id: '2', status: { name: 'In Progress' } })
      ]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      expect(wrapper.findAll('.task-group').length).toBeGreaterThan(0)

      await wrapper.setProps({ groupBy: 'none' })
      await nextTick()

      expect(wrapper.findAll('.task-group').length).toBe(0)
      expect(wrapper.find('.task-list-container').exists()).toBe(true)
    })
  })

  describe('Props Validation', () => {
    it('should use default props when not provided', () => {
      wrapper = mountComponent()

      expect(wrapper.vm.tasks).toEqual([])
      expect(wrapper.vm.groupBy).toBe('none')
      expect(wrapper.vm.emptyMessage).toBe('Get started by creating your first task')
      expect(wrapper.vm.showCreateButton).toBe(true)
    })

    it('should accept custom emptyMessage prop', () => {
      const customMessage = 'No tasks available'

      wrapper = mountComponent({
        tasks: [],
        emptyMessage: customMessage
      })

      expect(wrapper.text()).toContain(customMessage)
    })
  })

  describe('Rendering Performance', () => {
    it('should only render TaskCard for tasks in current view', () => {
      const tasks = [createTask({ id: '1' }), createTask({ id: '2' }), createTask({ id: '3' })]

      wrapper = mountComponent({
        tasks,
        groupBy: 'none'
      })

      const taskCards = wrapper.findAllComponents(TaskCard)
      expect(taskCards.length).toBe(3)
    })
  })

  describe('Accessibility', () => {
    it('should have semantic structure for groups', () => {
      const tasks = [createTask({ id: '1', status: { name: 'Open' } })]

      wrapper = mountComponent({
        tasks,
        groupBy: 'status'
      })

      const groupTitle = wrapper.find('.group-title')
      expect(groupTitle.exists()).toBe(true)
      expect(groupTitle.element.tagName).toBe('H3')
    })

    it('should have proper empty state structure', () => {
      wrapper = mountComponent({ tasks: [] })

      const heading = wrapper.find('.empty-state h3')
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('No tasks found')
    })
  })
})
