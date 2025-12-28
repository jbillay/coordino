<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
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
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  sortBy: {
    type: String,
    default: 'updated'
  }
})

const emit = defineEmits(['open-note', 'create', 'toggle-pin', 'archive', 'delete-note', 'open'])

const pinnedNotes = computed(() => sortNotes(props.notes.filter((note) => note.is_pinned)))

const regularNotes = computed(() => sortNotes(props.notes.filter((note) => !note.is_pinned)))

const sortNotes = (notes) => {
  const notesCopy = [...notes]

  switch (props.sortBy) {
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

// Arrow key navigation (FR-026)
const focusedNoteIndex = ref(-1)
const noteRefs = ref([])

// Combined list of all notes in display order (pinned first, then regular)
const allNotes = computed(() => [...pinnedNotes.value, ...regularNotes.value])

// Set note ref
const setNoteRef = (el, index) => {
  if (el) {
    noteRefs.value[index] = el
  }
}

// Handle keyboard navigation
const handleKeyDown = (event) => {
  if (allNotes.value.length === 0) {
    return
  }

  const { key } = event

  if (key === 'ArrowDown' || key === 'ArrowUp') {
    event.preventDefault()

    if (key === 'ArrowDown') {
      // Move focus down
      focusedNoteIndex.value =
        focusedNoteIndex.value < allNotes.value.length - 1
          ? focusedNoteIndex.value + 1
          : focusedNoteIndex.value
    } else if (key === 'ArrowUp') {
      // Move focus up
      focusedNoteIndex.value = focusedNoteIndex.value > 0 ? focusedNoteIndex.value - 1 : 0
    }

    // Focus the note element
    const noteElement = noteRefs.value[focusedNoteIndex.value]
    if (noteElement) {
      noteElement.$el?.focus() || noteElement.focus()
    }
  } else if (key === 'Enter') {
    // Open focused note
    if (focusedNoteIndex.value >= 0 && focusedNoteIndex.value < allNotes.value.length) {
      const note = allNotes.value[focusedNoteIndex.value]
      emit('open', note)
    }
  }
}

// Set up keyboard listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="note-list">
    <!-- Loading State -->
    <div v-if="loading" data-testid="loading-indicator" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading notes...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="notes.length === 0" data-testid="empty-state" class="empty-state">
      <i class="pi pi-file"></i>
      <h3>{{ emptyStateTitle }}</h3>
      <p>{{ emptyStateMessage }}</p>
      <Button
        label="Create Your First Note"
        icon="pi pi-plus"
        size="large"
        @click="$emit('create')"
      />
    </div>

    <!-- Notes Content -->
    <div v-else class="notes-content">
      <!-- Pinned Notes Section -->
      <div v-if="pinnedNotes.length > 0" data-testid="pinned-notes" class="notes-section">
        <div class="section-header">
          <i class="pi pi-star-fill"></i>
          <h3>Pinned</h3>
        </div>
        <div class="notes-grid" :class="viewMode">
          <NoteCard
            v-for="(note, index) in pinnedNotes"
            :key="note.id"
            :ref="(el) => setNoteRef(el, index)"
            :note="note"
            :tabindex="0"
            @click="$emit('open-note', note)"
            @pin="$emit('toggle-pin', note)"
            @archive="$emit('archive', note)"
            @delete="$emit('delete-note', note)"
          />
        </div>
      </div>

      <!-- Regular Notes Section -->
      <div v-if="regularNotes.length > 0" data-testid="regular-notes" class="notes-section">
        <div v-if="pinnedNotes.length > 0" class="section-header">
          <h3>Recent</h3>
        </div>
        <div class="notes-grid" :class="viewMode">
          <NoteCard
            v-for="(note, index) in regularNotes"
            :key="note.id"
            :ref="(el) => setNoteRef(el, index + pinnedNotes.length)"
            :note="note"
            :tabindex="0"
            @click="$emit('open-note', note)"
            @pin="$emit('toggle-pin', note)"
            @archive="$emit('archive', note)"
            @delete="$emit('delete-note', note)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 3rem 2rem;
  text-align: center;
}

.loading-state i {
  font-size: 2.5rem;
  color: var(--p-primary-color);
  margin-bottom: 1rem;
}

.loading-state p {
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}

.empty-state i {
  font-size: 4rem;
  color: var(--p-text-muted-color);
  opacity: 0.3;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--p-text-color);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--p-text-muted-color);
  max-width: 360px;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* Notes Content */
.notes-content {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

/* Notes Section */
.notes-section {
  margin-bottom: 2rem;
}

.notes-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
}

.section-header i {
  font-size: 0.75rem;
  color: var(--p-primary-color);
}

.section-header h3 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-text-muted-color);
}

/* Notes Grid */
.notes-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notes-grid.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

/* Smooth scrolling */
.notes-content {
  scroll-behavior: smooth;
}

.notes-content::-webkit-scrollbar {
  width: 6px;
}

.notes-content::-webkit-scrollbar-track {
  background: transparent;
}

.notes-content::-webkit-scrollbar-thumb {
  background: var(--p-surface-400);
  border-radius: 3px;
}

.notes-content::-webkit-scrollbar-thumb:hover {
  background: var(--p-surface-500);
}
</style>
