<script setup>
import { ref, computed } from 'vue'
import Select from 'primevue/select'
import NoteCard from './NoteCard.vue'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Notes'
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyStateTitle: {
    type: String,
    default: 'No notes yet'
  },
  emptyStateMessage: {
    type: String,
    default:
      'Start capturing your thoughts, ideas, and important information by creating your first note.'
  }
})

defineEmits(['open', 'create', 'pin', 'archive', 'delete'])

const viewMode = ref('grid')
const sortBy = ref('updated')

const sortOptions = [
  { label: 'Last Updated', value: 'updated' },
  { label: 'Created Date', value: 'created' },
  { label: 'Title (A-Z)', value: 'title-asc' },
  { label: 'Title (Z-A)', value: 'title-desc' }
]

const pinnedNotes = computed(() => sortNotes(props.notes.filter((note) => note.is_pinned)))

const regularNotes = computed(() => sortNotes(props.notes.filter((note) => !note.is_pinned)))

const sortNotes = (notes) => {
  const notesCopy = [...notes]

  switch (sortBy.value) {
    case 'updated':
      return notesCopy.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    case 'created':
      return notesCopy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    case 'title-asc':
      return notesCopy.sort((a, b) => a.title.localeCompare(b.title))
    case 'title-desc':
      return notesCopy.sort((a, b) => b.title.localeCompare(a.title))
    default:
      return notesCopy
  }
}
</script>

<template>
  <div class="note-list h-full flex flex-col">
    <!-- Header with view controls -->
    <div
      class="note-list-header flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center space-x-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h2>
        <span v-if="notes.length > 0" class="text-sm text-gray-500 dark:text-gray-400">
          {{ notes.length }} {{ notes.length === 1 ? 'note' : 'notes' }}
        </span>
      </div>

      <div class="flex items-center space-x-2">
        <!-- View Mode Toggle -->
        <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            v-tooltip.bottom="'Grid view'"
            icon="pi pi-th-large"
            class="p-button-text p-button-sm"
            :class="{ 'bg-white dark:bg-gray-700': viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          />
          <Button
            v-tooltip.bottom="'List view'"
            icon="pi pi-list"
            class="p-button-text p-button-sm"
            :class="{ 'bg-white dark:bg-gray-700': viewMode === 'list' }"
            @click="viewMode = 'list'"
          />
        </div>

        <!-- Sort Select -->
        <Select
          v-model="sortBy"
          :options="sortOptions"
          option-label="label"
          option-value="value"
          placeholder="Sort by"
          class="w-40"
        />

        <!-- New Note Button -->
        <Button
          label="New Note"
          icon="pi pi-plus"
          data-testid="new-note-button"
          @click="$emit('create')"
        />
      </div>
    </div>

    <!-- Notes Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Pinned Notes Section -->
      <div v-if="pinnedNotes.length > 0" data-testid="pinned-notes" class="mb-8">
        <div class="flex items-center space-x-2 mb-4">
          <i class="pi pi-star-fill text-primary-500"></i>
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
          >
            Pinned Notes
          </h3>
        </div>
        <div
          class="notes-grid"
          :class="{
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4': viewMode === 'grid',
            'space-y-3': viewMode === 'list'
          }"
        >
          <NoteCard
            v-for="note in pinnedNotes"
            :key="note.id"
            :note="note"
            @click="$emit('open', note)"
            @pin="$emit('pin', note)"
            @archive="$emit('archive', note)"
            @delete="$emit('delete', note)"
          />
        </div>
      </div>

      <!-- Regular Notes Section -->
      <div v-if="regularNotes.length > 0" data-testid="regular-notes">
        <h3
          v-if="pinnedNotes.length > 0"
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4"
        >
          All Notes
        </h3>
        <div
          class="notes-grid"
          :class="{
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4': viewMode === 'grid',
            'space-y-3': viewMode === 'list'
          }"
        >
          <NoteCard
            v-for="note in regularNotes"
            :key="note.id"
            :note="note"
            @click="$emit('open', note)"
            @pin="$emit('pin', note)"
            @archive="$emit('archive', note)"
            @delete="$emit('delete', note)"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="notes.length === 0"
        data-testid="empty-state"
        class="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
      >
        <i class="pi pi-file text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {{ emptyStateTitle }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          {{ emptyStateMessage }}
        </p>
        <Button
          label="Create Your First Note"
          icon="pi pi-plus"
          size="large"
          @click="$emit('create')"
        />
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        data-testid="loading-indicator"
        class="flex items-center justify-center h-full min-h-[400px]"
      >
        <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-list {
  background: #f9fafb;
}

.dark .note-list {
  background: #111827;
}

/* List view specific styling */
.notes-grid.space-y-3 > * {
  width: 100%;
}
</style>
