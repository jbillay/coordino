<template>
  <div class="task-list">
    <!-- Empty state -->
    <div v-if="!tasks || tasks.length === 0" class="empty-state text-center py-12">
      <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No tasks found</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{ emptyMessage }}
      </p>
      <Button
        v-if="showCreateButton"
        label="Create Your First Task"
        icon="pi pi-plus"
        @click="$emit('create-task')"
      />
    </div>

    <!-- Grouped tasks -->
    <div v-else-if="groupBy && groupBy !== 'none'" class="space-y-6">
      <div v-for="(groupTasks, groupName) in groupedTasks" :key="groupName" class="task-group">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ groupName }}
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({{ groupTasks.length }})
            </span>
          </h3>
        </div>

        <div class="space-y-0">
          <TaskCard
            v-for="task in groupTasks"
            :key="task.id"
            :task="task"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @toggle-complete="$emit('toggle-complete', $event)"
          />
        </div>
      </div>
    </div>

    <!-- Flat list -->
    <div v-else class="space-y-0">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle-complete="$emit('toggle-complete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import TaskCard from './TaskCard.vue'
import { groupTasks } from '../utils'

/**
 * TaskList Component
 * Displays tasks in a list or grouped by specified field
 *
 * @component
 */

const props = defineProps({
  /**
   * Array of tasks to display
   */
  tasks: {
    type: Array,
    default: () => []
  },

  /**
   * Group tasks by field (status, category, priority, none)
   */
  groupBy: {
    type: String,
    default: 'none'
  },

  /**
   * Custom empty state message
   */
  emptyMessage: {
    type: String,
    default: 'Get started by creating your first task'
  },

  /**
   * Show create button in empty state
   */
  showCreateButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-complete', 'create-task'])

/**
 * Grouped tasks
 */
const groupedTasks = computed(() => {
  if (!props.groupBy || props.groupBy === 'none') {
    return {}
  }
  return groupTasks(props.tasks, props.groupBy)
})
</script>

<style scoped>
.task-list {
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.task-group {
  background: transparent;
  border-radius: 8px;
}
</style>
