<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import TaskFilters from '@/features/tasks/components/TaskFilters.vue'
import TaskList from '@/features/tasks/components/TaskList.vue'
import TaskDialog from '@/features/tasks/components/TaskDialog.vue'
import StatusManager from '@/features/tasks/components/StatusManager.vue'
import CategoryManager from '@/features/tasks/components/CategoryManager.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useTaskStore } from '@/features/tasks/store'
import { filterTasks, sortTasks, getTaskStats } from '@/features/tasks/utils'
import { useToast } from 'primevue/usetoast'

/**
 * TasksView
 * Main view for task management feature
 *
 * @component
 */

const taskStore = useTaskStore()
const toast = useToast()

// Dialog visibility
const showTaskDialog = ref(false)
const showStatusManager = ref(false)
const showCategoryManager = ref(false)
const showDeleteConfirm = ref(false)

// Selected task for editing
const selectedTask = ref(null)
const taskToDelete = ref(null)

// Filters and sorting
const filters = ref({
  status: null,
  category: null,
  priority: null,
  search: '',
  showCompleted: false
})

const sortBy = ref('created_at')
const groupBy = ref('none')

/**
 * Filtered tasks based on current filters
 */
const filteredTasks = computed(() => filterTasks(taskStore.tasks, filters.value))

/**
 * Sorted and filtered tasks
 */
const displayedTasks = computed(() => sortTasks(filteredTasks.value, sortBy.value))

/**
 * Task statistics
 */
const taskStats = computed(() => getTaskStats(taskStore.tasks))

/**
 * Empty message based on filters
 */
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
    return `No tasks match the selected filters. Try adjusting your ${activeFilters.join(', ')} filter.`
  }

  if (!filters.value.showCompleted && taskStore.tasks.length > 0) {
    return 'All tasks completed! Create a new task to get started.'
  }

  return 'Get started by creating your first task'
})

/**
 * Handle create task button
 */
const handleCreateTask = () => {
  selectedTask.value = null
  showTaskDialog.value = true
}

/**
 * Handle edit task
 */
const handleEditTask = (task) => {
  selectedTask.value = task
  showTaskDialog.value = true
}

/**
 * Handle delete task - show confirmation dialog
 */
const handleDeleteTask = (task) => {
  taskToDelete.value = task
  showDeleteConfirm.value = true
}

/**
 * Confirm delete task - actually perform deletion
 */
const confirmDelete = async () => {
  if (!taskToDelete.value) {
    return
  }

  const task = taskToDelete.value
  const result = await taskStore.deleteTask(task.id)

  showDeleteConfirm.value = false

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Task Deleted',
      detail: `"${task.title}" has been deleted`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to delete task',
      life: 5000
    })
  }

  taskToDelete.value = null
}

/**
 * Handle toggle task completion
 */
const handleToggleComplete = async (task) => {
  let result

  if (task.completed_at) {
    result = await taskStore.reopenTask(task.id)
  } else {
    result = await taskStore.completeTask(task.id)
  }

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: task.completed_at ? 'Task Reopened' : 'Task Completed',
      detail: `"${task.title}" ${task.completed_at ? 'marked as incomplete' : 'completed'}`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to update task',
      life: 5000
    })
  }
}

/**
 * Handle task saved (created or updated)
 */
const handleTaskSaved = () => {
  selectedTask.value = null
}

/**
 * Initialize on mount
 */
onMounted(async () => {
  await taskStore.initialize()
})

/**
 * Clean up subscriptions on unmount
 */
onBeforeUnmount(async () => {
  await taskStore.unsubscribeFromTasks()
})
</script>

<template>
  <AppLayout>
    <div class="tasks-view">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
          <p class="text-gray-600 dark:text-gray-400">Manage your tasks with custom workflows</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            label="Manage Statuses"
            icon="pi pi-tag"
            class="p-button-outlined"
            @click="showStatusManager = true"
          />
          <Button
            label="Manage Categories"
            icon="pi pi-folder"
            class="p-button-outlined"
            @click="showCategoryManager = true"
          />
          <Button label="New Task" icon="pi pi-plus" @click="handleCreateTask" />
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card class="stat-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Tasks</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ taskStats.active }}
                </p>
              </div>
              <div
                class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
              >
                <i class="pi pi-list text-blue-600 dark:text-blue-400 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ taskStats.completed }}
                </p>
              </div>
              <div
                class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
              >
                <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Overdue</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ taskStats.overdue }}
                </p>
              </div>
              <div
                class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center"
              >
                <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ taskStats.completionRate }}%
                </p>
              </div>
              <div
                class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center"
              >
                <i class="pi pi-chart-bar text-purple-600 dark:text-purple-400 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Filters -->
      <TaskFilters v-model="filters" v-model:sort-by="sortBy" v-model:group-by="groupBy" />

      <!-- Loading State -->
      <div v-if="taskStore.loading" class="text-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
        <p class="text-gray-600 dark:text-gray-400">Loading tasks...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="taskStore.error" class="text-center py-12">
        <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-4"></i>
        <p class="text-red-600 dark:text-red-400 mb-4">{{ taskStore.error }}</p>
        <Button label="Retry" icon="pi pi-refresh" @click="taskStore.initialize()" />
      </div>

      <!-- Task List -->
      <TaskList
        v-else
        :tasks="displayedTasks"
        :group-by="groupBy"
        :empty-message="getEmptyMessage"
        @edit="handleEditTask"
        @delete="handleDeleteTask"
        @toggle-complete="handleToggleComplete"
        @create-task="handleCreateTask"
      />

      <!-- Load More Button -->
      <div
        v-if="taskStore.hasMore && !taskStore.loading && displayedTasks.length > 0"
        class="flex justify-center mt-6"
      >
        <Button
          label="Load More Tasks"
          icon="pi pi-arrow-down"
          class="p-button-outlined"
          @click="taskStore.loadMoreTasks()"
        />
      </div>

      <!-- Pagination Info -->
      <div
        v-if="taskStore.totalTasks > 0"
        class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4"
      >
        Showing {{ taskStore.tasks.length }} of {{ taskStore.totalTasks }} tasks
      </div>

      <!-- Task Dialog -->
      <TaskDialog v-model:visible="showTaskDialog" :task="selectedTask" @saved="handleTaskSaved" />

      <!-- Status Manager Dialog -->
      <StatusManager v-model:visible="showStatusManager" />

      <!-- Category Manager Dialog -->
      <CategoryManager v-model:visible="showCategoryManager" />

      <!-- Confirm Delete Dialog -->
      <ConfirmDialog
        v-model:visible="showDeleteConfirm"
        header="Delete Task"
        :message="`Are you sure you want to delete &quot;${taskToDelete?.title}&quot;? This action cannot be undone.`"
        severity="danger"
        confirm-label="Delete"
        confirm-icon="pi pi-trash"
        @confirm="confirmDelete"
      />

      <!-- Toast for notifications -->
      <Toast />
    </div>
  </AppLayout>
</template>

<style scoped>
.tasks-view {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.stat-card:hover {
  border-left-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.p-card-body) {
  padding: 1.25rem;
}

:deep(.p-card-content) {
  padding: 0;
}
</style>
