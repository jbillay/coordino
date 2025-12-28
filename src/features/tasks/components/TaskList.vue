<script setup>
import { computed } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import Button from 'primevue/button'
import TaskCard from './TaskCard.vue'
import { groupTasks } from '../utils'

/**
 * TaskList Component
 * Displays tasks in a list or grouped by specified field
 * Uses virtual scrolling for datasets >100 items (FR-029)
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

defineEmits(['edit', 'delete', 'toggle-complete', 'create-task', 'click'])

/**
 * Should use virtual scrolling (>100 tasks)
 */
const shouldUseVirtualScroll = computed(() => props.tasks.length > 100)

/**
 * Grouped tasks - memoized to avoid unnecessary recalculations (FR-031)
 */
const groupedTasks = computed(() => {
  if (!props.groupBy || props.groupBy === 'none') {
    return {}
  }
  return groupTasks(props.tasks, props.groupBy)
})
</script>

<template>
  <div class="task-list">
    <!-- Empty state -->
    <div v-if="!tasks || tasks.length === 0" class="empty-state">
      <i class="pi pi-inbox text-6xl opacity-30 mb-4"></i>
      <h3 class="text-xl font-semibold mb-2">No tasks found</h3>
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
    <div v-else-if="groupBy && groupBy !== 'none'" class="space-y-4">
      <div v-for="(tasksInGroup, groupName) in groupedTasks" :key="groupName" class="task-group">
        <div class="group-header">
          <h3 class="group-title">
            {{ groupName }}
            <span class="group-count">({{ tasksInGroup.length }})</span>
          </h3>
        </div>

        <div class="task-list-container">
          <TaskCard
            v-for="task in tasksInGroup"
            :key="task.id"
            :task="task"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @toggle="$emit('toggle-complete', $event)"
            @click="$emit('click', $event)"
          />
        </div>
      </div>
    </div>

    <!-- Flat list with virtual scrolling (>100 tasks) -->
    <div v-else-if="shouldUseVirtualScroll" class="task-list-container" data-testid="task-list">
      <RecycleScroller
        :items="tasks"
        :item-size="80"
        key-field="id"
        class="virtual-scroller"
        :buffer="200"
      >
        <template #default="{ item }">
          <TaskCard
            :task="item"
            data-testid="task-item"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @toggle="$emit('toggle-complete', $event)"
            @click="$emit('click', $event)"
          />
        </template>
      </RecycleScroller>
    </div>

    <!-- Flat list (≤100 tasks) -->
    <div v-else class="task-list-container" data-testid="task-list">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        data-testid="task-item"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle="$emit('toggle-complete', $event)"
        @click="$emit('click', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.task-list {
  min-height: 300px;
}

.task-list-container {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.virtual-scroller {
  height: 600px;
  max-height: calc(100vh - 400px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}

.task-group {
  background: transparent;
}

.group-header {
  margin-bottom: 0.75rem;
}

.group-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.group-count {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 0.5rem;
}
</style>
