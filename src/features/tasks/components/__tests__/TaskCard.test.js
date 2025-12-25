import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCard from '../TaskCard.vue'

// Mock utility functions
vi.mock('../../utils', () => ({
  formatTaskDate: vi.fn((date) => {
    if (!date) {
      return ''
    }
    return 'Jan 1, 2025'
  }),
  getDaysRemainingText: vi.fn((date) => {
    if (!date) {
      return ''
    }
    return '5 days remaining'
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
  isTaskOverdue: vi.fn((date) => {
    if (!date) {
      return false
    }
    return false // Default to not overdue
  })
}))

describe('TaskCard.vue', () => {
  let wrapper

  const createTask = (overrides = {}) => ({
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    priority: 'medium',
    due_date: '2025-01-01',
    completed_at: null,
    status: { id: 's1', name: 'Open', color: '#3b82f6' },
    category: { id: 'c1', name: 'Work', color: '#22c55e' },
    created_at: '2024-12-20',
    updated_at: '2024-12-20',
    ...overrides
  })

  const mountComponent = (task = createTask(), options = {}) =>
    mount(TaskCard, {
      props: {
        task
      },
      global: {
        stubs: {
          Checkbox: {
            name: 'Checkbox',
            template:
              '<input type="checkbox" v-bind="$attrs" @click="$emit(\'update:modelValue\', !$attrs.modelValue)" />',
            props: ['modelValue', 'binary']
          },
          Button: {
            name: 'Button',
            template: '<button v-bind="$attrs"><i :class="icon"></i></button>',
            props: ['icon', 'text', 'rounded', 'size', 'severity']
          }
        },
        ...options
      }
    })

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render task card with basic task information', () => {
      wrapper = mountComponent()

      expect(wrapper.find('[data-testid="task-card"]').exists()).toBe(true)
      expect(wrapper.find('.task-title').text()).toBe('Test Task')
    })

    it('should render task title correctly', () => {
      const task = createTask({ title: 'My Important Task' })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-title').text()).toBe('My Important Task')
    })

    it('should render unchecked checkbox for incomplete task', () => {
      const task = createTask({ completed_at: null })
      wrapper = mountComponent(task)

      const checkbox = wrapper.findComponent({ name: 'Checkbox' })
      expect(checkbox.exists()).toBe(true)
      expect(checkbox.props('modelValue')).toBe(false)
    })

    it('should render checked checkbox for completed task', () => {
      const task = createTask({ completed_at: '2024-12-25T10:00:00Z' })
      wrapper = mountComponent(task)

      const checkbox = wrapper.findComponent({ name: 'Checkbox' })
      expect(checkbox.props('modelValue')).toBe(true)
    })

    it('should apply completed class when task is completed', () => {
      const task = createTask({ completed_at: '2024-12-25T10:00:00Z' })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-item').classes()).toContain('completed')
    })

    it('should not apply completed class when task is incomplete', () => {
      const task = createTask({ completed_at: null })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-item').classes()).not.toContain('completed')
    })

    it('should render status badge when status is present', () => {
      const task = createTask({ status: { id: 's1', name: 'In Progress', color: '#f97316' } })
      wrapper = mountComponent(task)

      const statusBadge = wrapper.find('.task-badge.status')
      expect(statusBadge.exists()).toBe(true)
      expect(statusBadge.text()).toBe('In Progress')
    })

    it('should not render status badge when status is null', () => {
      const task = createTask({ status: null })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-badge.status').exists()).toBe(false)
    })

    it('should render category badge when category is present', () => {
      const task = createTask({ category: { id: 'c1', name: 'Personal', color: '#ec4899' } })
      wrapper = mountComponent(task)

      const categoryBadge = wrapper.find('.task-badge.category')
      expect(categoryBadge.exists()).toBe(true)
      expect(categoryBadge.text()).toBe('Personal')
    })

    it('should not render category badge when category is null', () => {
      const task = createTask({ category: null })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-badge.category').exists()).toBe(false)
    })

    it('should render priority badge when priority is present', () => {
      const task = createTask({ priority: 'high' })
      wrapper = mountComponent(task)

      const priorityBadge = wrapper.find('.task-badge.priority')
      expect(priorityBadge.exists()).toBe(true)
      expect(priorityBadge.text()).toBe('High')
      expect(priorityBadge.classes()).toContain('priority-high')
    })

    it('should render priority badge with correct class for each priority level', () => {
      const priorities = ['low', 'medium', 'high']

      priorities.forEach((priority) => {
        const task = createTask({ priority })
        const wrapper = mountComponent(task)
        const priorityBadge = wrapper.find('.task-badge.priority')

        expect(priorityBadge.classes()).toContain(`priority-${priority}`)
      })
    })

    it('should not render priority badge when priority is null', () => {
      const task = createTask({ priority: null })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-badge.priority').exists()).toBe(false)
    })

    it('should render due date when present', () => {
      const task = createTask({ due_date: '2025-01-15', completed_at: null })
      wrapper = mountComponent(task)

      const dueDateElement = wrapper.find('.task-due')
      expect(dueDateElement.exists()).toBe(true)
      expect(dueDateElement.text()).toContain('Jan 1, 2025')
    })

    it('should render due date element but with empty text when task is completed', () => {
      const task = createTask({ due_date: '2025-01-15', completed_at: '2024-12-25T10:00:00Z' })
      wrapper = mountComponent(task)

      // The element exists due to v-if="task.due_date", but dueDateText is empty
      const dueDateElement = wrapper.find('.task-due')
      expect(dueDateElement.exists()).toBe(true)
      expect(wrapper.vm.dueDateText).toBe('')
    })

    it('should not render due date when due_date is null', () => {
      const task = createTask({ due_date: null })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-due').exists()).toBe(false)
    })

    it('should render edit and delete buttons', () => {
      wrapper = mountComponent()

      const editButton = wrapper.find('[data-testid="edit-button"]')
      const deleteButton = wrapper.find('[data-testid="delete-button"]')

      expect(editButton.exists()).toBe(true)
      expect(deleteButton.exists()).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    it('should compute priorityConfig correctly', async () => {
      const task = createTask({ priority: 'high' })
      wrapper = mountComponent(task)

      expect(wrapper.vm.priorityConfig).toEqual({ label: 'High', color: '#f97316' })
    })

    it('should compute dueDateText with days remaining', async () => {
      const task = createTask({ due_date: '2025-01-15', completed_at: null })
      wrapper = mountComponent(task)

      expect(wrapper.vm.dueDateText).toBe('Jan 1, 2025 (5 days remaining)')
    })

    it('should compute empty dueDateText when no due date', async () => {
      const task = createTask({ due_date: null })
      wrapper = mountComponent(task)

      expect(wrapper.vm.dueDateText).toBe('')
    })

    it('should compute empty dueDateText when task is completed', async () => {
      const task = createTask({ due_date: '2025-01-15', completed_at: '2024-12-25T10:00:00Z' })
      wrapper = mountComponent(task)

      expect(wrapper.vm.dueDateText).toBe('')
    })

    it('should compute isOverdue as false for completed tasks', async () => {
      const { isTaskOverdue } = await import('../../utils')
      isTaskOverdue.mockReturnValue(true)

      const task = createTask({ due_date: '2024-12-01', completed_at: '2024-12-25T10:00:00Z' })
      wrapper = mountComponent(task)

      expect(wrapper.vm.isOverdue).toBe(false)
    })

    it('should compute isOverdue correctly for incomplete tasks', async () => {
      const { isTaskOverdue } = await import('../../utils')
      isTaskOverdue.mockReturnValue(true)

      const task = createTask({ due_date: '2024-12-01', completed_at: null })
      wrapper = mountComponent(task)

      expect(wrapper.vm.isOverdue).toBe(true)
    })
  })

  describe('User Interactions', () => {
    it('should emit toggle event when checkbox is clicked', async () => {
      const task = createTask()
      wrapper = mountComponent(task)

      const checkbox = wrapper.findComponent({ name: 'Checkbox' })
      await checkbox.trigger('click')
      await checkbox.vm.$emit('update:modelValue', true)

      expect(wrapper.emitted('toggle')).toBeTruthy()
      expect(wrapper.emitted('toggle')[0]).toEqual([task])
    })

    it('should emit click event when task card is clicked', async () => {
      const task = createTask()
      wrapper = mountComponent(task)

      await wrapper.find('[data-testid="task-card"]').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')[0]).toEqual([task])
    })

    it('should emit click event when Enter key is pressed', async () => {
      const task = createTask()
      wrapper = mountComponent(task)

      await wrapper.find('[data-testid="task-card"]').trigger('keydown.enter')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')[0]).toEqual([task])
    })

    it('should emit edit event when edit button is clicked', async () => {
      const task = createTask()
      wrapper = mountComponent(task)

      await wrapper.find('[data-testid="edit-button"]').trigger('click')

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')[0]).toEqual([task])
    })

    it('should emit delete event when delete button is clicked', async () => {
      const task = createTask()
      wrapper = mountComponent(task)

      await wrapper.find('[data-testid="delete-button"]').trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')[0]).toEqual([task])
    })

    it('should not trigger card click when edit button is clicked', async () => {
      wrapper = mountComponent()

      await wrapper.find('[data-testid="edit-button"]').trigger('click')

      // Should emit edit but not click
      expect(wrapper.emitted('edit')).toBeTruthy()
      const clickEmits = wrapper.emitted('click')
      expect(clickEmits).toBeFalsy()
    })

    it('should not trigger card click when delete button is clicked', async () => {
      wrapper = mountComponent()

      await wrapper.find('[data-testid="delete-button"]').trigger('click')

      // Should emit delete but not click
      expect(wrapper.emitted('delete')).toBeTruthy()
      const clickEmits = wrapper.emitted('click')
      expect(clickEmits).toBeFalsy()
    })
  })

  describe('Hover State', () => {
    it('should set isHovered to true on mouseenter', async () => {
      wrapper = mountComponent()

      await wrapper.find('[data-testid="task-card"]').trigger('mouseenter')

      expect(wrapper.vm.isHovered).toBe(true)
    })

    it('should set isHovered to false on mouseleave', async () => {
      wrapper = mountComponent()

      await wrapper.find('[data-testid="task-card"]').trigger('mouseenter')
      expect(wrapper.vm.isHovered).toBe(true)

      await wrapper.find('[data-testid="task-card"]').trigger('mouseleave')
      expect(wrapper.vm.isHovered).toBe(false)
    })

    it('should show actions when hovered', async () => {
      wrapper = mountComponent()

      await wrapper.find('[data-testid="task-card"]').trigger('mouseenter')
      await wrapper.vm.$nextTick()

      const actions = wrapper.find('.task-actions')
      expect(actions.classes()).toContain('visible')
    })

    it('should hide actions when not hovered', async () => {
      wrapper = mountComponent()

      await wrapper.find('[data-testid="task-card"]').trigger('mouseenter')
      await wrapper.find('[data-testid="task-card"]').trigger('mouseleave')
      await wrapper.vm.$nextTick()

      const actions = wrapper.find('.task-actions')
      expect(actions.classes()).not.toContain('visible')
    })
  })

  describe('Accessibility', () => {
    it('should have role="button" on task card', () => {
      wrapper = mountComponent()

      expect(wrapper.find('[data-testid="task-card"]').attributes('role')).toBe('button')
    })

    it('should have tabindex="0" on task card', () => {
      wrapper = mountComponent()

      expect(wrapper.find('[data-testid="task-card"]').attributes('tabindex')).toBe('0')
    })

    it('should have correct aria-label on checkbox for incomplete task', () => {
      const task = createTask({ completed_at: null })
      wrapper = mountComponent(task)

      const checkbox = wrapper.findComponent({ name: 'Checkbox' })
      expect(checkbox.attributes('aria-label')).toBe('Mark as complete')
    })

    it('should have correct aria-label on checkbox for completed task', () => {
      const task = createTask({ completed_at: '2024-12-25T10:00:00Z' })
      wrapper = mountComponent(task)

      const checkbox = wrapper.findComponent({ name: 'Checkbox' })
      expect(checkbox.attributes('aria-label')).toBe('Mark as incomplete')
    })

    it('should have aria-label on edit button', () => {
      wrapper = mountComponent()

      expect(wrapper.find('[data-testid="edit-button"]').attributes('aria-label')).toBe('Edit task')
    })

    it('should have aria-label on delete button', () => {
      wrapper = mountComponent()

      expect(wrapper.find('[data-testid="delete-button"]').attributes('aria-label')).toBe(
        'Delete task'
      )
    })
  })

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on toggle if supported', async () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true
      })

      wrapper = mountComponent()
      await wrapper.vm.handleToggle()

      expect(vibrateMock).toHaveBeenCalledWith(10)
    })

    it('should not error if haptic feedback is not supported', async () => {
      const originalVibrate = navigator.vibrate
      delete navigator.vibrate

      wrapper = mountComponent()

      expect(() => wrapper.vm.handleToggle()).not.toThrow()

      // Restore
      if (originalVibrate) {
        navigator.vibrate = originalVibrate
      }
    })
  })

  describe('Style Bindings', () => {
    it('should apply correct background color to status badge', () => {
      const task = createTask({ status: { id: 's1', name: 'Open', color: '#3b82f6' } })
      wrapper = mountComponent(task)

      const statusBadge = wrapper.find('.task-badge.status')
      const style = statusBadge.attributes('style')

      expect(style).toContain('background-color: #3b82f620')
      expect(style).toContain('color: #3b82f6')
      expect(style).toContain('border-color: #3b82f6')
    })

    it('should apply correct background color to category badge', () => {
      const task = createTask({ category: { id: 'c1', name: 'Work', color: '#22c55e' } })
      wrapper = mountComponent(task)

      const categoryBadge = wrapper.find('.task-badge.category')
      const style = categoryBadge.attributes('style')

      expect(style).toContain('background-color: #22c55e20')
      expect(style).toContain('color: #22c55e')
      expect(style).toContain('border-color: #22c55e')
    })

    it('should apply overdue class to due date when task is overdue', async () => {
      const { isTaskOverdue } = await import('../../utils')
      isTaskOverdue.mockReturnValue(true)

      const task = createTask({ due_date: '2024-12-01', completed_at: null })
      wrapper = mountComponent(task)

      const dueDateElement = wrapper.find('.task-due')
      expect(dueDateElement.classes()).toContain('overdue')
    })

    it('should not apply overdue class when task is not overdue', async () => {
      const { isTaskOverdue } = await import('../../utils')
      isTaskOverdue.mockReturnValue(false)

      const task = createTask({ due_date: '2025-01-15', completed_at: null })
      wrapper = mountComponent(task)

      const dueDateElement = wrapper.find('.task-due')
      expect(dueDateElement.classes()).not.toContain('overdue')
    })
  })

  describe('Edge Cases', () => {
    it('should handle task with all metadata missing', () => {
      const task = createTask({
        status: null,
        category: null,
        priority: null,
        due_date: null
      })
      wrapper = mountComponent(task)

      expect(wrapper.find('.task-title').text()).toBe('Test Task')
      expect(wrapper.find('.task-badge.status').exists()).toBe(false)
      expect(wrapper.find('.task-badge.category').exists()).toBe(false)
      expect(wrapper.find('.task-badge.priority').exists()).toBe(false)
      expect(wrapper.find('.task-due').exists()).toBe(false)
    })

    it('should handle very long task titles', () => {
      const longTitle = 'A'.repeat(200)
      const task = createTask({ title: longTitle })
      wrapper = mountComponent(task)

      const titleElement = wrapper.find('.task-title')
      expect(titleElement.text()).toBe(longTitle)
      expect(titleElement.classes()).toContain('task-title')
    })

    it('should handle special characters in task title', () => {
      const task = createTask({ title: '<script>alert("xss")</script>' })
      wrapper = mountComponent(task)

      const titleText = wrapper.find('.task-title').text()
      expect(titleText).toBe('<script>alert("xss")</script>')
      // Vue should escape the content
      expect(wrapper.find('.task-title').element.innerHTML).not.toContain('<script>')
    })
  })

  describe('Multiple Events', () => {
    it('should handle rapid toggle clicks', async () => {
      wrapper = mountComponent()

      const checkbox = wrapper.findComponent({ name: 'Checkbox' })

      await checkbox.vm.$emit('update:modelValue', true)
      await checkbox.vm.$emit('update:modelValue', false)
      await checkbox.vm.$emit('update:modelValue', true)

      expect(wrapper.emitted('toggle')).toHaveLength(3)
    })

    it('should emit all events independently', async () => {
      wrapper = mountComponent()

      await wrapper.find('[data-testid="task-card"]').trigger('click')
      await wrapper.find('[data-testid="edit-button"]').trigger('click')
      await wrapper.find('[data-testid="delete-button"]').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })
})
