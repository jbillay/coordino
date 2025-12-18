<script setup>
import { ref, computed } from 'vue'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { formatTaskDate, getDaysRemainingText, getPriorityConfig, isTaskOverdue } from '../utils'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle', 'click'])

const isHovered = ref(false)

/**
 * Priority configuration for styling
 */
const priorityConfig = computed(() => getPriorityConfig(props.task.priority))

/**
 * Format due date with days remaining
 */
const dueDateText = computed(() => {
  if (!props.task.due_date || props.task.completed_at) {
    return ''
  }
  const formatted = formatTaskDate(props.task.due_date)
  const remaining = getDaysRemainingText(props.task.due_date)
  return remaining ? `${formatted} (${remaining})` : formatted
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
 * Handle checkbox toggle
 */
const handleToggle = () => {
  // Add haptic feedback on mobile if available
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
  emit('toggle', props.task)
}
</script>

<template>
  <div
    class="task-item"
    :class="{ completed: task.completed_at }"
    role="button"
    tabindex="0"
    data-testid="task-card"
    @click="emit('click', task)"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @keydown.enter="emit('click', task)"
  >
    <!-- Checkbox -->
    <Checkbox
      :model-value="!!task.completed_at"
      :binary="true"
      class="task-checkbox"
      :class="{ 'checkbox-checked': task.completed_at }"
      :aria-label="task.completed_at ? 'Mark as incomplete' : 'Mark as complete'"
      @click.stop
      @update:model-value="handleToggle"
    />

    <!-- Content -->
    <div class="task-content">
      <div class="task-title">
        {{ task.title }}
      </div>
      <div class="task-metadata">
        <!-- Status badge -->
        <span
          v-if="task.status"
          class="task-badge status"
          :style="{
            backgroundColor: task.status.color + '20',
            color: task.status.color,
            borderColor: task.status.color
          }"
        >
          {{ task.status.name }}
        </span>

        <!-- Category badge -->
        <span
          v-if="task.category"
          class="task-badge category"
          :style="{
            backgroundColor: task.category.color + '20',
            color: task.category.color,
            borderColor: task.category.color
          }"
        >
          {{ task.category.name }}
        </span>

        <!-- Priority badge -->
        <span v-if="task.priority" class="task-badge priority" :class="`priority-${task.priority}`">
          {{ priorityConfig.label }}
        </span>

        <!-- Due date -->
        <span v-if="task.due_date" class="task-due" :class="{ overdue: isOverdue }">
          <i class="pi pi-calendar"></i>
          {{ dueDateText }}
        </span>
      </div>
    </div>

    <!-- Actions (hover-only) -->
    <div class="task-actions" :class="{ visible: isHovered }">
      <Button
        icon="pi pi-pencil"
        text
        rounded
        size="small"
        severity="secondary"
        aria-label="Edit task"
        data-testid="edit-button"
        @click.stop="emit('edit', task)"
      />
      <Button
        icon="pi pi-trash"
        text
        rounded
        size="small"
        severity="danger"
        aria-label="Delete task"
        data-testid="delete-button"
        @click.stop="emit('delete', task)"
      />
    </div>
  </div>
</template>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem; /* Compact: 10px vertical */
  border-bottom: 1px solid var(--border-default);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.task-item:hover {
  background: var(--bg-hover);
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-checkbox {
  flex-shrink: 0;
}

.checkbox-checked {
  animation: checkmark-pop 0.3s ease-out;
}

@keyframes checkmark-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.task-content {
  flex: 1;
  min-width: 0; /* Allow text truncation */
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-metadata {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.task-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  background: var(--bg-interactive);
  color: var(--text-secondary);
  font-weight: 500;
  border: 1px solid transparent;
}

.task-badge.priority-high {
  background: var(--color-error-bg);
  color: var(--color-error);
  border-color: var(--color-error);
}

.task-badge.priority-medium {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-color: var(--color-warning);
}

.task-badge.priority-low {
  background: var(--color-info-bg);
  color: var(--color-info);
  border-color: var(--color-info);
}

.task-due {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.task-due i {
  font-size: 0.625rem;
}

.task-due.overdue {
  color: var(--color-error);
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.task-actions.visible {
  opacity: 1;
  pointer-events: all;
}

/* Keyboard focus: always show actions when focused */
.task-item:focus-within .task-actions {
  opacity: 1;
  pointer-events: all;
}

/* Focus indicator */
.task-item:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: -2px;
}

/* Mobile: Always show actions (no hover) */
@media (max-width: 768px) {
  .task-actions {
    opacity: 1;
    pointer-events: all;
  }

  .task-title {
    font-size: 0.9375rem; /* Slightly larger on mobile */
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .task-item,
  .task-actions,
  .checkbox-checked {
    transition: none;
    animation: none;
  }
}
</style>
