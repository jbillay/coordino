<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import {
  formatTaskDate,
  getDaysRemainingText,
  calculateDaysOpen,
  getPriorityClasses,
  getPriorityConfig,
  isTaskOverdue
} from '../utils'

/**
 * TaskCard Component
 * Displays a single task with all metadata and actions
 *
 * @component
 */

const props = defineProps({
  /**
   * Task object to display
   */
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-complete'])

/**
 * Priority display classes
 */
const priorityClasses = computed(() => getPriorityClasses(props.task.priority))

/**
 * Priority label
 */
const priorityLabel = computed(() => {
  const config = getPriorityConfig(props.task.priority)
  return config.label
})

/**
 * Days remaining text
 */
const daysRemainingText = computed(() => {
  if (!props.task.due_date || props.task.completed_at) {
    return ''
  }
  return getDaysRemainingText(props.task.due_date)
})

/**
 * Check if task is overdue
 */
const isOverdue = computed(() => {
  if (props.task.completed_at) {
    return false
  }
  return isTaskOverdue(props.task.due_date)
})

/**
 * Calculate days task has been open
 */
const daysOpen = computed(() => calculateDaysOpen(props.task.created_at))

/**
 * Handle toggle complete checkbox
 */
const handleToggleComplete = () => {
  emit('toggle-complete', props.task)
}
</script>

<template>
  <Card class="task-card mb-3 hover:shadow-md transition-shadow" data-testid="task-card">
    <template #content>
      <div class="flex items-start justify-between gap-4">
        <!-- Left side: Checkbox and content -->
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <!-- Completion checkbox -->
          <button
            :aria-label="task.completed_at ? 'Mark as incomplete' : 'Mark as complete'"
            class="flex-shrink-0 mt-1 text-2xl text-gray-400 hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            @click="handleToggleComplete"
          >
            <i :class="task.completed_at ? 'pi pi-check-square' : 'pi pi-square'"></i>
          </button>

          <!-- Task content -->
          <div class="flex-1 min-w-0">
            <!-- Title -->
            <h3
              class="font-medium text-gray-900 dark:text-white mb-1"
              :class="{ 'line-through text-gray-500 dark:text-gray-400': task.completed_at }"
            >
              {{ task.title }}
            </h3>

            <!-- Description -->
            <p
              v-if="task.description"
              class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2"
              :class="{ 'line-through': task.completed_at }"
            >
              {{ task.description }}
            </p>

            <!-- Tags/Badges -->
            <div class="flex flex-wrap gap-2 mb-2">
              <!-- Status badge -->
              <span
                v-if="task.status"
                class="px-2 py-1 rounded text-xs font-medium"
                :style="{
                  backgroundColor: task.status.color + '20',
                  color: task.status.color
                }"
              >
                {{ task.status.name }}
              </span>

              <!-- Category badge -->
              <span
                v-if="task.category"
                class="px-2 py-1 rounded text-xs font-medium"
                :style="{
                  backgroundColor: task.category.color + '20',
                  color: task.category.color
                }"
              >
                {{ task.category.name }}
              </span>

              <!-- Priority badge -->
              <span class="px-2 py-1 rounded text-xs font-medium" :class="priorityClasses">
                {{ priorityLabel }}
              </span>

              <!-- Owner badge -->
              <span
                vif="task.owner"
                class="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <i class="pi pi-user text-xs mr-1"></i>
                {{ task.owner }}
              </span>
            </div>

            <!-- Metadata -->
            <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <!-- Due date -->
              <span
                vif="task.due_date"
                :class="{ 'text-red-600 dark:text-red-400 font-medium': isOverdue }"
              >
                <i class="pi pi-calendar text-xs mr-1"></i>
                {{ formatTaskDate(task.due_date) }}
                <span v-if="daysRemainingText" class="ml-1">({{ daysRemainingText }})</span>
              </span>

              <!-- Days open -->
              <span>
                <i class="pi pi-clock text-xs mr-1"></i>
                Open {{ daysOpen }} {{ daysOpen === 1 ? 'day' : 'days' }}
              </span>

              <!-- Completed date -->
              <span v-if="task.completed_at" class="text-green-600 dark:text-green-400">
                <i class="pi pi-check text-xs mr-1"></i>
                Completed {{ formatTaskDate(task.completed_at) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right side: Action buttons -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-sm"
            aria-label="Edit task"
            data-testid="edit-button"
            @click="$emit('edit', task)"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-rounded p-button-text p-button-sm p-button-danger"
            aria-label="Delete task"
            data-testid="delete-button"
            @click="$emit('delete', task)"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.task-card {
  border-left: 3px solid transparent;
}

.task-card:hover {
  border-left-color: var(--primary-color);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
