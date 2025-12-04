import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import TasksView from '../TasksView.vue'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/features/tasks/store'
import { useToast } from 'primevue/usetoast'

// Mock composables
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn()
}))

// Create a mock that we can update
let mockDisplayedTasks = []

vi.mock('@/features/tasks/composables/useTaskFilters', () => ({
  useTaskFilters: vi.fn(() => ({
    filters: { status: null, category: null, priority: null, search: '' },
    sortBy: 'created_at',
    get displayedTasks() {
      return mockDisplayedTasks
    },
    getEmptyMessage: 'No tasks found'
  }))
}))

vi.mock('@/features/tasks/utils', () => ({
  getTaskStats: vi.fn(() => ({
    active: 5,
    completed: 3,
    overdue: 2,
    completionRate: 60
  }))
}))

describe('TasksView.vue', () => {
  let toast
  let pinia
  let taskStore

  const mockTasks = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      status_id: 'status1',
      completed_at: null,
      created_at: '2024-01-01'
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Description 2',
      status_id: 'status2',
      completed_at: '2024-01-02',
      created_at: '2024-01-01'
    }
  ]

  beforeEach(() => {
    // Reset mock displayed tasks
    mockDisplayedTasks = []

    // Setup toast mock
    toast = {
      add: vi.fn()
    }
    vi.mocked(useToast).mockReturnValue(toast)

    // Setup pinia
    pinia = createTestingPinia({
      stubActions: false
    })

    // Setup task store
    taskStore = useTaskStore(pinia)
    taskStore.tasks = [...mockTasks]
    taskStore.loading = false
    taskStore.error = null
    taskStore.hasMore = false
    taskStore.totalTasks = mockTasks.length

    // Mock store methods
    taskStore.initialize = vi.fn().mockResolvedValue({ success: true })
    taskStore.deleteTask = vi.fn().mockResolvedValue({ success: true })
    taskStore.completeTask = vi.fn().mockResolvedValue({ success: true })
    taskStore.reopenTask = vi.fn().mockResolvedValue({ success: true })
    taskStore.loadMoreTasks = vi.fn().mockResolvedValue({ success: true })
    taskStore.unsubscribeFromTasks = vi.fn().mockResolvedValue()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mountComponent = (options = {}) =>
    mount(TasksView, {
      global: {
        plugins: [pinia],
        stubs: {
          AppLayout: {
            template: '<div class="app-layout"><slot /></div>'
          },
          Card: {
            template: '<div class="card"><slot name="content" /></div>'
          },
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
            props: ['label', 'icon', 'class', 'loading'],
            emits: ['click']
          },
          Toast: {
            template: '<div class="toast"></div>'
          },
          TaskFilters: {
            template: '<div class="task-filters"></div>',
            props: ['modelValue', 'sortBy', 'groupBy']
          },
          TaskList: {
            name: 'TaskList',
            template: '<div class="task-list"></div>',
            props: ['tasks', 'groupBy', 'emptyMessage'],
            emits: ['edit', 'delete', 'toggle-complete', 'create-task']
          },
          TaskDialog: {
            name: 'TaskDialog',
            template: '<div class="task-dialog"></div>',
            props: ['visible', 'task'],
            emits: ['update:visible', 'saved']
          },
          StatusManager: {
            template: '<div class="status-manager"></div>',
            props: ['visible'],
            emits: ['update:visible']
          },
          CategoryManager: {
            template: '<div class="category-manager"></div>',
            props: ['visible'],
            emits: ['update:visible']
          },
          ConfirmDialog: {
            name: 'ConfirmDialog',
            template: '<div class="confirm-dialog"></div>',
            props: ['visible', 'header', 'message', 'severity', 'confirmLabel', 'confirmIcon'],
            emits: ['update:visible', 'confirm']
          }
        }
      },
      ...options
    })

  describe('Component Initialization', () => {
    it('renders correctly with default state', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.tasks-view').exists()).toBe(true)
      expect(wrapper.find('h1').text()).toBe('Tasks')
      expect(wrapper.text()).toContain('Manage your tasks with custom workflows')
    })

    it('initializes task store on mount', async () => {
      mountComponent()
      await flushPromises()

      expect(taskStore.initialize).toHaveBeenCalled()
    })

    it('displays task statistics', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Active Tasks')
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('Completed')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('Overdue')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('Completion Rate')
      expect(wrapper.text()).toContain('60%')
    })

    it('displays action buttons in header', () => {
      const wrapper = mountComponent()
      const buttons = wrapper.findAll('button')

      const buttonLabels = buttons.map((b) => b.text())
      expect(buttonLabels).toContain('Manage Statuses')
      expect(buttonLabels).toContain('Manage Categories')
      expect(buttonLabels).toContain('New Task')
    })

    it('displays loading state', async () => {
      taskStore.loading = true
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Loading tasks...')
    })

    it('displays error state', async () => {
      taskStore.loading = false
      taskStore.error = 'Failed to load tasks'
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Failed to load tasks')
      const retryButton = wrapper.findAll('button').find((b) => b.text().includes('Retry'))
      expect(retryButton).toBeDefined()
    })
  })

  describe('Task Creation', () => {
    it('opens task dialog when New Task button is clicked', async () => {
      const wrapper = mountComponent()

      const newTaskButton = wrapper.findAll('button').find((b) => b.text() === 'New Task')
      await newTaskButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showTaskDialog).toBe(true)
      expect(wrapper.vm.selectedTask).toBe(null)
    })

    it('closes task dialog after saving', async () => {
      const wrapper = mountComponent()

      wrapper.vm.showTaskDialog = true
      wrapper.vm.selectedTask = mockTasks[0]
      await nextTick()

      const taskDialog = wrapper.findComponent({ name: 'TaskDialog' })
      taskDialog.vm.$emit('saved')
      await nextTick()

      expect(wrapper.vm.selectedTask).toBe(null)
    })
  })

  describe('Task Editing', () => {
    it('opens task dialog with selected task when edit is triggered', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('edit', mockTasks[0])
      await nextTick()

      expect(wrapper.vm.showTaskDialog).toBe(true)
      expect(wrapper.vm.selectedTask).toEqual(mockTasks[0])
    })
  })

  describe('Task Deletion', () => {
    it('shows delete confirmation dialog when delete is triggered', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('delete', mockTasks[0])
      await nextTick()

      expect(wrapper.vm.showDeleteConfirm).toBe(true)
      expect(wrapper.vm.taskToDelete).toEqual(mockTasks[0])
    })

    it('deletes task after confirmation', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('delete', mockTasks[0])
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      confirmDialog.vm.$emit('confirm')
      await flushPromises()

      expect(taskStore.deleteTask).toHaveBeenCalledWith('1')
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Task Deleted'
        })
      )
    })

    it('shows error toast when deletion fails', async () => {
      taskStore.deleteTask.mockResolvedValueOnce({
        success: false,
        error: 'Delete failed'
      })

      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('delete', mockTasks[0])
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      confirmDialog.vm.$emit('confirm')
      await flushPromises()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Delete failed'
        })
      )
    })

    it('closes delete confirmation dialog after deletion', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('delete', mockTasks[0])
      await nextTick()

      const confirmDialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      confirmDialog.vm.$emit('confirm')
      await flushPromises()

      expect(wrapper.vm.showDeleteConfirm).toBe(false)
      expect(wrapper.vm.taskToDelete).toBe(null)
    })
  })

  describe('Task Completion Toggle', () => {
    it('completes an incomplete task', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('toggle-complete', mockTasks[0])
      await flushPromises()

      expect(taskStore.completeTask).toHaveBeenCalledWith('1')
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Task Completed'
        })
      )
    })

    it('reopens a completed task', async () => {
      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('toggle-complete', mockTasks[1])
      await flushPromises()

      expect(taskStore.reopenTask).toHaveBeenCalledWith('2')
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Task Reopened'
        })
      )
    })

    it('shows error toast when toggle fails', async () => {
      taskStore.completeTask.mockResolvedValueOnce({
        success: false,
        error: 'Update failed'
      })

      const wrapper = mountComponent()
      await nextTick()

      const taskList = wrapper.findComponent({ name: 'TaskList' })
      taskList.vm.$emit('toggle-complete', mockTasks[0])
      await flushPromises()

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Update failed'
        })
      )
    })
  })

  describe('Status and Category Management', () => {
    it('opens status manager dialog when Manage Statuses is clicked', async () => {
      const wrapper = mountComponent()

      const manageStatusButton = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Manage Statuses')
      await manageStatusButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showStatusManager).toBe(true)
    })

    it('opens category manager dialog when Manage Categories is clicked', async () => {
      const wrapper = mountComponent()

      const manageCategoryButton = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Manage Categories')
      await manageCategoryButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showCategoryManager).toBe(true)
    })
  })

  describe('Pagination', () => {
    it('displays load more button when hasMore is true', async () => {
      mockDisplayedTasks = [...mockTasks]
      taskStore.hasMore = true
      taskStore.loading = false
      const wrapper = mountComponent()
      await nextTick()

      const loadMoreButton = wrapper.findAll('button').find((b) => b.text() === 'Load More Tasks')
      expect(loadMoreButton).toBeDefined()
    })

    it('does not display load more button when hasMore is false', async () => {
      mockDisplayedTasks = [...mockTasks]
      taskStore.hasMore = false
      const wrapper = mountComponent()
      await nextTick()

      const loadMoreButton = wrapper.findAll('button').find((b) => b.text() === 'Load More Tasks')
      expect(loadMoreButton).toBeUndefined()
    })

    it('loads more tasks when load more button is clicked', async () => {
      mockDisplayedTasks = [...mockTasks]
      taskStore.hasMore = true
      taskStore.loading = false
      const wrapper = mountComponent()
      await nextTick()

      const loadMoreButton = wrapper.findAll('button').find((b) => b.text() === 'Load More Tasks')
      await loadMoreButton.trigger('click')
      await flushPromises()

      expect(taskStore.loadMoreTasks).toHaveBeenCalled()
    })

    it('displays pagination info', async () => {
      taskStore.totalTasks = 10
      taskStore.tasks = mockTasks
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Showing 2 of 10 tasks')
    })
  })

  describe('Error Handling', () => {
    it('retries initialization when retry button is clicked', async () => {
      taskStore.loading = false
      taskStore.error = 'Network error'
      const wrapper = mountComponent()
      await nextTick()

      const retryButton = wrapper.find('button')
      await retryButton.trigger('click')

      expect(taskStore.initialize).toHaveBeenCalled()
    })
  })

  describe('Component Cleanup', () => {
    it('unsubscribes from tasks on unmount', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      wrapper.unmount()
      await nextTick()

      expect(taskStore.unsubscribeFromTasks).toHaveBeenCalled()
    })
  })
})
