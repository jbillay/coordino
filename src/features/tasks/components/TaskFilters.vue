<script setup>
import { ref, watch, computed } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useTaskStore } from '../store'
import { getPriorityOptions } from '../utils'

/**
 * TaskFilters Component
 * Provides comprehensive filtering and sorting controls for tasks
 *
 * @component
 */

const props = defineProps({
  /**
   * Current filter values
   */
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

  /**
   * Current sort by value
   */
  sortBy: {
    type: String,
    default: 'created_at'
  },

  /**
   * Current group by value
   */
  groupBy: {
    type: String,
    default: 'none'
  }
})

const emit = defineEmits(['update:modelValue', 'update:sortBy', 'update:groupBy'])

const taskStore = useTaskStore()

// Local state
const searchQuery = ref(props.modelValue.search || '')
const filters = ref({
  status: props.modelValue.status || null,
  category: props.modelValue.category || null,
  priority: props.modelValue.priority || null,
  showCompleted: props.modelValue.showCompleted || false
})

const sorting = ref({
  sortBy: props.sortBy,
  groupBy: props.groupBy
})

// Priority options with classes
const priorityOptions = computed(() => getPriorityOptions())

// Sort options
const sortOptions = [
  { label: 'Created Date (Newest)', value: 'created_at' },
  { label: 'Updated Date (Recent)', value: 'updated_at' },
  { label: 'Due Date', value: 'due_date' },
  { label: 'Priority', value: 'priority' },
  { label: 'Title (A-Z)', value: 'title' }
]

// Group options
const groupOptions = [
  { label: 'No Grouping', value: 'none' },
  { label: 'Status', value: 'status' },
  { label: 'Category', value: 'category' },
  { label: 'Priority', value: 'priority' }
]

/**
 * Watch filters and emit changes
 */
watch(
  [() => searchQuery.value, () => filters.value],
  () => {
    emit('update:modelValue', {
      ...filters.value,
      search: searchQuery.value
    })
  },
  { deep: true }
)

/**
 * Watch sorting and emit changes
 */
watch(
  () => sorting.value.sortBy,
  (newValue) => {
    emit('update:sortBy', newValue)
  }
)

watch(
  () => sorting.value.groupBy,
  (newValue) => {
    emit('update:groupBy', newValue)
  }
)

/**
 * Clear all filters
 */
const clearAllFilters = () => {
  searchQuery.value = ''
  filters.value = {
    status: null,
    category: null,
    priority: null,
    showCompleted: false
  }
  sorting.value = {
    sortBy: 'created_at',
    groupBy: 'none'
  }
}
</script>

<template>
  <Card class="filters-card">
    <template #content>
      <div class="space-y-4">
        <!-- Search -->
        <div class="w-full">
          <label for="task-search" class="sr-only">Search tasks</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              id="task-search"
              v-model="searchQuery"
              placeholder="Search tasks..."
              class="w-full"
            />
          </span>
        </div>

        <!-- Filters row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Status filter -->
          <div>
            <label for="filter-status" class="block text-sm font-medium mb-2">Status</label>
            <Select
              id="filter-status"
              v-model="filters.status"
              :options="taskStore.statuses"
              option-label="name"
              option-value="id"
              placeholder="All Statuses"
              class="w-full"
              show-clear
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: slotProps.option.color }"
                  ></span>
                  <span>{{ slotProps.option.name }}</span>
                </div>
              </template>
            </Select>
          </div>

          <!-- Category filter -->
          <div>
            <label for="filter-category" class="block text-sm font-medium mb-2">Category</label>
            <Select
              id="filter-category"
              v-model="filters.category"
              :options="taskStore.categories"
              option-label="name"
              option-value="id"
              placeholder="All Categories"
              class="w-full"
              show-clear
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: slotProps.option.color }"
                  ></span>
                  <span>{{ slotProps.option.name }}</span>
                </div>
              </template>
            </Select>
          </div>

          <!-- Priority filter -->
          <div>
            <label for="filter-priority" class="block text-sm font-medium mb-2">Priority</label>
            <Select
              id="filter-priority"
              v-model="filters.priority"
              :options="priorityOptions"
              option-label="label"
              option-value="value"
              placeholder="All Priorities"
              class="w-full"
              show-clear
            >
              <template #option="slotProps">
                <span class="px-2 py-1 rounded text-xs font-medium" :class="slotProps.option.class">
                  {{ slotProps.option.label }}
                </span>
              </template>
            </Select>
          </div>

          <!-- Show completed toggle -->
          <div class="flex items-end">
            <div class="flex items-center">
              <Checkbox id="show-completed" v-model="filters.showCompleted" :binary="true" />
              <label for="show-completed" class="ml-2 text-sm font-medium cursor-pointer">
                Show Completed
              </label>
            </div>
          </div>
        </div>

        <!-- Sort and Group row -->
        <div
          class="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <!-- Sort by -->
          <div class="flex items-center gap-2">
            <label for="sort-by" class="text-sm font-medium whitespace-nowrap">Sort by:</label>
            <Select
              id="sort-by"
              v-model="sorting.sortBy"
              :options="sortOptions"
              option-label="label"
              option-value="value"
              class="w-48"
            />
          </div>

          <!-- Group by -->
          <div class="flex items-center gap-2">
            <label for="group-by" class="text-sm font-medium whitespace-nowrap">Group by:</label>
            <Select
              id="group-by"
              v-model="sorting.groupBy"
              :options="groupOptions"
              option-label="label"
              option-value="value"
              class="w-48"
            />
          </div>

          <!-- Clear all filters -->
          <Button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            class="p-button-sm p-button-text"
            @click="clearAllFilters"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.filters-card {
  margin-bottom: 1.5rem;
}

:deep(.p-select),
:deep(.p-inputtext) {
  width: 100%;
}

:deep(.p-input-icon-left > .p-inputtext) {
  padding-left: 2.5rem;
}
</style>
