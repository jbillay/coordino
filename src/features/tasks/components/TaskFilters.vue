<script setup>
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '../store'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      status: null,
      category: null,
      priority: null,
      search: '',
      showCompleted: false
    })
  },
  sortBy: {
    type: String,
    default: 'created_at'
  },
  groupBy: {
    type: String,
    default: 'none'
  }
})

const emit = defineEmits(['update:modelValue', 'update:sortBy', 'update:groupBy'])

const taskStore = useTaskStore()

// Local state
const searchQuery = ref(props.modelValue.search || '')
const activeFilter = ref('all')

// Filter presets with dynamic counts
const filterPresets = computed(() => {
  const allTasks = taskStore.tasks || []

  return [
    {
      id: 'all',
      label: 'All Tasks',
      icon: 'pi-list',
      count: allTasks.length,
      filter: () => true
    },
    {
      id: 'today',
      label: 'Today',
      icon: 'pi-calendar',
      count: allTasks.filter((t) => isDueToday(t)).length,
      filter: (task) => isDueToday(task)
    },
    {
      id: 'high-priority',
      label: 'High Priority',
      icon: 'pi-exclamation-circle',
      count: allTasks.filter((t) => t.priority === 'high').length,
      filter: (task) => task.priority === 'high'
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      icon: 'pi-spinner',
      count: allTasks.filter((t) => t.status?.name === 'In Progress').length,
      filter: (task) => task.status?.name === 'In Progress'
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: 'pi-check-circle',
      count: allTasks.filter((t) => t.completed_at).length,
      filter: (task) => !!task.completed_at
    }
  ]
})

// Check if task is due today
const isDueToday = (task) => {
  if (!task.due_date) {
    return false
  }
  const today = new Date()
  const dueDate = new Date(task.due_date)
  return (
    dueDate.getDate() === today.getDate() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getFullYear() === today.getFullYear()
  )
}

// Toggle filter
const toggleFilter = (filterId) => {
  activeFilter.value = filterId

  // Update model value based on selected filter
  const newFilters = { ...props.modelValue }

  switch (filterId) {
    case 'all':
      newFilters.status = null
      newFilters.priority = null
      newFilters.showCompleted = true
      break
    case 'today':
      // Handle in parent component via filter preset
      break
    case 'high-priority':
      newFilters.priority = 'high'
      newFilters.status = null
      break
    case 'in-progress':
      newFilters.status = taskStore.statuses.find((s) => s.name === 'In Progress')?.id
      newFilters.priority = null
      break
    case 'completed':
      newFilters.showCompleted = true
      newFilters.status = null
      newFilters.priority = null
      break
  }

  emit('update:modelValue', newFilters)
}

// Handle search input
const handleSearch = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    search: searchQuery.value
  })
}

// Watch for external changes
watch(
  () => props.modelValue.search,
  (newVal) => {
    searchQuery.value = newVal
  }
)
</script>

<template>
  <div class="filter-bar">
    <!-- Prominent Search -->
    <div class="search-prominent">
      <i class="pi pi-search"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tasks... (⌘K for command palette)"
        class="search-input"
        @input="handleSearch"
      />
      <kbd v-if="!searchQuery" class="search-hint">⌘K</kbd>
    </div>

    <!-- Filter Chips -->
    <div class="filter-chips">
      <button
        v-for="preset in filterPresets"
        :key="preset.id"
        class="filter-chip"
        :class="{ active: activeFilter === preset.id }"
        @click="toggleFilter(preset.id)"
      >
        <i class="pi" :class="preset.icon"></i>
        <span class="chip-label">{{ preset.label }}</span>
        <span v-if="preset.count > 0" class="chip-count">{{ preset.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

/* Prominent Search */
.search-prominent {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-base);
  border: 2px solid var(--border-default);
  border-radius: 8px;
  transition: border-color 0.15s ease;
}

.search-prominent:focus-within {
  border-color: var(--brand-teal-500);
}

.search-prominent i {
  color: var(--text-tertiary);
  font-size: 1rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-hint {
  padding: 0.25rem 0.5rem;
  background: var(--bg-interactive);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-tertiary);
}

/* Filter Chips */
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-interactive);
  border: 1px solid var(--border-default);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: all 0.15s ease;
}

.filter-chip:hover {
  background: var(--bg-hover);
  border-color: var(--brand-teal-500);
}

.filter-chip.active {
  background: var(--brand-teal-500);
  border-color: var(--brand-teal-500);
  color: white;
}

.filter-chip i {
  font-size: 0.875rem;
}

.filter-chip.active i {
  color: white;
}

.chip-label {
  white-space: nowrap;
}

.chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.375rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-chip.active .chip-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Focus indicator */
.filter-chip:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: 2px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .filter-bar {
    padding: 0.75rem;
  }

  .search-prominent {
    padding: 0.625rem 0.75rem;
  }

  .filter-chip {
    font-size: 0.8125rem;
    padding: 0.4375rem 0.75rem;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .search-prominent,
  .filter-chip {
    transition: none;
  }
}
</style>
