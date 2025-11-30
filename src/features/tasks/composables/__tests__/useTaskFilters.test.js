import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskFilters } from '../useTaskFilters'
import { useTaskStore } from '@/features/tasks/store'
import { filterTasks, sortTasks } from '@/features/tasks/utils'
import { DEFAULT_SORT_BY } from '@/constants'
import { setActivePinia, createPinia } from 'pinia'

// Mock dependencies
vi.mock('@/features/tasks/store', () => ({
  useTaskStore: vi.fn()
}))

vi.mock('@/features/tasks/utils', () => ({
  filterTasks: vi.fn((tasks) => tasks),
  sortTasks: vi.fn((tasks) => tasks)
}))

describe('useTaskFilters', () => {
  let mockTaskStore

  beforeEach(() => {
    setActivePinia(createPinia())

    mockTaskStore = {
      tasks: [
        { id: 1, title: 'Task 1', status: 'todo', completed: false },
        { id: 2, title: 'Task 2', status: 'done', completed: true }
      ]
    }
    useTaskStore.mockReturnValue(mockTaskStore)

    vi.clearAllMocks()
  })

  it('initializes with default filters and sort order', () => {
    const { filters, sortBy } = useTaskFilters()

    expect(filters.value).toEqual({
      status: null,
      category: null,
      priority: null,
      search: '',
      showCompleted: false
    })
    expect(sortBy.value).toBe(DEFAULT_SORT_BY)
  })

  it('calls filterTasks when filters change', () => {
    const { filters, displayedTasks } = useTaskFilters()
    // access displayedTasks to trigger the computed property
    displayedTasks.value
    filters.value.search = 'test'
    // access it again to trigger the watcher
    displayedTasks.value
    expect(filterTasks).toHaveBeenCalledWith(mockTaskStore.tasks, filters.value)
  })

  it('calls sortTasks when sortBy changes', () => {
    const { sortBy, displayedTasks } = useTaskFilters()
    // access displayedTasks to trigger the computed property
    displayedTasks.value
    sortBy.value = 'title'
    // access it again to trigger the watcher
    displayedTasks.value
    expect(sortTasks).toHaveBeenCalled()
  })

  describe('getEmptyMessage', () => {
    it('returns a search message when there is a search filter', () => {
      const { filters, getEmptyMessage } = useTaskFilters()
      filters.value.search = 'query'
      expect(getEmptyMessage.value).toBe('No tasks match your search "query"')
    })

    it('returns a filter message when there are active filters', () => {
      const { filters, getEmptyMessage } = useTaskFilters()
      filters.value.status = 'in-progress'
      filters.value.priority = 'high'
      expect(getEmptyMessage.value).toBe('No tasks match the selected filters. Try adjusting your status, priority filter.')
    })

    it('returns a filter message when category filter is active', () => {
      const { filters, getEmptyMessage } = useTaskFilters()
      filters.value.category = 'work'
      expect(getEmptyMessage.value).toBe('No tasks match the selected filters. Try adjusting your category filter.')
    })

    it('returns a "all completed" message when no tasks are filtered and showCompleted is false', () => {
      filterTasks.mockReturnValue([])
      const { filters, getEmptyMessage } = useTaskFilters()
      filters.value.showCompleted = false
      expect(getEmptyMessage.value).toBe('All tasks completed! Create a new task to get started.')
    })

    it('returns a default message when no other conditions are met', () => {
      mockTaskStore.tasks = []
      filterTasks.mockReturnValue([])
      const { getEmptyMessage } = useTaskFilters()
      expect(getEmptyMessage.value).toBe('Get started by creating your first task')
    })
  })
})
