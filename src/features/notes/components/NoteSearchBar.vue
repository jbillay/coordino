<script setup>
import { ref, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import { useNotesStore } from '../store'
import { useDebounceFn } from '@vueuse/core'

defineProps({
  showFilters: {
    type: Boolean,
    default: true
  },
  resultCount: {
    type: Number,
    default: null
  },
  searchTime: {
    type: Number,
    default: null
  }
})

const emit = defineEmits([
  'search',
  'clear',
  'filter-change',
  'navigate-down',
  'navigate-up',
  'navigate-enter'
])

const notesStore = useNotesStore()

const searchQuery = ref('')
const selectedTopicId = ref(null)
const dateRange = ref('all')
const showPinnedOnly = ref(false)
const includeArchived = ref(false)

// Topic options for dropdown
const topicOptions = computed(() => [
  { label: 'All Topics', value: null },
  ...notesStore.topics.map((topic) => ({
    label: topic.name,
    value: topic.id
  }))
])

// Date range options
const dateRangeOptions = [
  { label: 'Any Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Last Year', value: 'year' }
]

// Debounced search handler
const debouncedSearch = useDebounceFn(() => {
  emitSearch()
}, 300)

// Handle search input
const handleSearchInput = () => {
  debouncedSearch()
}

// Handle filter changes
const handleFilterChange = () => {
  if (searchQuery.value) {
    emitSearch()
  }
}

// Emit search event with current filters
const emitSearch = () => {
  const filters = {
    query: searchQuery.value,
    topicId: selectedTopicId.value,
    dateRange: dateRange.value,
    pinnedOnly: showPinnedOnly.value,
    includeArchived: includeArchived.value
  }

  emit('search', filters)
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  selectedTopicId.value = null
  dateRange.value = 'all'
  showPinnedOnly.value = false
  includeArchived.value = false
  emit('clear')
}

// Handle escape key
const handleEscape = () => {
  if (searchQuery.value) {
    clearSearch()
  }
}

// Watch for external topic changes (e.g., from topic selection in sidebar)
watch(
  () => notesStore.selectedTopicId,
  (newTopicId) => {
    if (newTopicId !== selectedTopicId.value && !searchQuery.value) {
      selectedTopicId.value = newTopicId
    }
  }
)

// Expose methods for parent component
defineExpose({
  clearSearch,
  focus: () => {
    // Implementation could focus the input field if needed
  }
})
</script>

<template>
  <div class="note-search-bar">
    <!-- Search Input -->
    <div class="relative">
      <span class="p-input-icon-left w-full">
        <i class="pi pi-search" />
        <InputText
          v-model="searchQuery"
          placeholder="Search notes..."
          class="w-full"
          @input="handleSearchInput"
          @keydown.esc="handleEscape"
          @keydown.down="$emit('navigate-down')"
          @keydown.up="$emit('navigate-up')"
          @keydown.enter="$emit('navigate-enter')"
        />
      </span>

      <!-- Clear Button -->
      <Button
        v-if="searchQuery"
        v-tooltip.bottom="'Clear search'"
        icon="pi pi-times"
        class="p-button-text p-button-sm absolute right-2 top-1/2 -translate-y-1/2"
        @click="clearSearch"
      />
    </div>

    <!-- Search Filters - Compact inline layout -->
    <div v-if="showFilters" class="search-filters">
      <div class="filter-row">
        <!-- Topic Filter -->
        <Select
          v-model="selectedTopicId"
          :options="topicOptions"
          option-label="label"
          option-value="value"
          placeholder="All Topics"
          size="small"
          show-clear
          @change="handleFilterChange"
        />

        <!-- Date Range Filter -->
        <Select
          v-model="dateRange"
          :options="dateRangeOptions"
          option-label="label"
          option-value="value"
          placeholder="Any Time"
          size="small"
          @change="handleFilterChange"
        />
      </div>

      <div class="filter-checkboxes">
        <!-- Pinned Filter -->
        <div class="checkbox-item">
          <Checkbox
            v-model="showPinnedOnly"
            input-id="pinned-filter"
            :binary="true"
            @change="handleFilterChange"
          />
          <label for="pinned-filter">Pinned only</label>
        </div>

        <!-- Archived Filter -->
        <div class="checkbox-item">
          <Checkbox
            v-model="includeArchived"
            input-id="archived-filter"
            :binary="true"
            @change="handleFilterChange"
          />
          <label for="archived-filter">Include archived</label>
        </div>
      </div>
    </div>

    <!-- Search Info -->
    <div v-if="searchQuery && resultCount !== null" class="search-info">
      <span v-if="resultCount === 0">No results found</span>
      <span v-else>
        {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }} found
        <span v-if="searchTime">({{ searchTime }}ms)</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.note-search-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-filters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-row :deep(.p-select) {
  flex: 1;
  min-width: 140px;
}

.filter-checkboxes {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.checkbox-item label {
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
  cursor: pointer;
  user-select: none;
}

.search-info {
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
}
</style>
