import { ref, computed } from 'vue'
import { useTaskStore } from '@/features/tasks/store'
import { filterTasks, sortTasks } from '@/features/tasks/utils'
import { DEFAULT_SORT_BY } from '@/constants'

/**
 * Composable for handling task filtering, sorting, and related computed properties.
 *
 * @returns {{
 *   filters: import('vue').Ref<object>,
 *   sortBy: import('vue').Ref<string>,
 *   displayedTasks: import('vue').ComputedRef<Array<object>>,
 *   getEmptyMessage: import('vue').ComputedRef<string>
 * }}
 */
export function useTaskFilters() {
  const taskStore = useTaskStore()

  const filters = ref({
    status: null,
    category: null,
    priority: null,
    search: '',
    showCompleted: false
  })

  const sortBy = ref(DEFAULT_SORT_BY)

  const filteredTasks = computed(() => filterTasks(taskStore.tasks, filters.value))

  const displayedTasks = computed(() => sortTasks(filteredTasks.value, sortBy.value))

  const getEmptyMessage = computed(() => {
    if (filters.value.search) {
      return `No tasks match your search "${filters.value.search}"`
    }

    const activeFilters = []
    if (filters.value.status) {
      activeFilters.push('status')
    }
    if (filters.value.category) {
      activeFilters.push('category')
    }
    if (filters.value.priority) {
      activeFilters.push('priority')
    }

    if (activeFilters.length > 0) {
      return `No tasks match the selected filters. Try adjusting your ${activeFilters.join(
        ', '
      )} filter.`
    }

    if (
      !filters.value.showCompleted &&
      taskStore.tasks.length > 0 &&
      filteredTasks.value.length === 0
    ) {
      return 'All tasks completed! Create a new task to get started.'
    }

    return 'Get started by creating your first task'
  })

  return {
    filters,
    sortBy,
    displayedTasks,
    getEmptyMessage
  }
}
