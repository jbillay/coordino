<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import Select from 'primevue/select'
import TopicList from '@/features/notes/components/TopicList.vue'
import NoteList from '@/features/notes/components/NoteList.vue'
import NoteEditor from '@/features/notes/components/NoteEditor.vue'
import NoteSearchBar from '@/features/notes/components/NoteSearchBar.vue'
import NoteSearchResults from '@/features/notes/components/NoteSearchResults.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import KeyboardShortcutsHelp from '@/features/notes/components/KeyboardShortcutsHelp.vue'
import AriaLiveRegion from '@/components/common/AriaLiveRegion.vue'
import { useNotesStore } from '@/features/notes/store'
import { useActivityStore } from '@/stores/activity'
import { useToast } from 'primevue/usetoast'
import { useNoteKeyboardShortcuts } from '@/features/notes/composables/useNoteKeyboardShortcuts'
import { useAccessibilityAnnouncements } from '@/features/notes/composables/useAccessibilityAnnouncements'

/**
 * NotesView
 * Main view for notes management feature with topic organization
 *
 * @component
 */

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const activityStore = useActivityStore()
const toast = useToast()

// Accessibility announcements
const { announcement, announcementPriority, announceSearchResults, announceNavigation } =
  useAccessibilityAnnouncements()

// View state
const currentView = ref('list') // 'list', 'editor', 'search'
const selectedNote = ref(null)
const showDeleteConfirm = ref(false)
const noteToDelete = ref(null)
const showShortcutsHelp = ref(false)

// Note list view controls
const viewMode = ref('list')
const sortBy = ref('updated')

const sortOptions = [
  { label: 'Last Updated', value: 'updated' },
  { label: 'Created Date', value: 'created' },
  { label: 'Title (A-Z)', value: 'title-asc' },
  { label: 'Title (Z-A)', value: 'title-desc' }
]

// Search state
const searchActive = ref(false)
const searchResults = ref([])
const searchQuery = ref('')
const searchTime = ref(null)
const searchLoading = ref(false)

// Filter notes based on selected topic
const displayedNotes = computed(() => notesStore.filteredNotes)

// Get title for note list
const noteListTitle = computed(() => {
  if (notesStore.selectedTopicId) {
    const topic = notesStore.selectedTopic
    return topic ? topic.name : 'Notes'
  }
  return 'All Notes'
})

// Get empty state message
const emptyStateTitle = computed(() => {
  if (notesStore.selectedTopicId) {
    return 'No notes in this topic'
  }
  return 'No notes yet'
})

const emptyStateMessage = computed(() => {
  if (notesStore.selectedTopicId) {
    return 'Create your first note in this topic to get started.'
  }
  return 'Start capturing your thoughts, ideas, and important information by creating your first note.'
})

/**
 * Handle create note
 */
const handleCreateNote = () => {
  selectedNote.value = null
  currentView.value = 'editor'
  announceNavigation('new note editor')
  // Update URL
  router.push({ name: 'notes', query: { action: 'create' } })
}

/**
 * Handle open note for editing (side-by-side view)
 */
const handleOpenNote = (note) => {
  // Track activity
  activityStore.trackActivity('note', note.id, note.title, {
    topic: note.topic?.name,
    pinned: note.is_pinned
  })

  selectedNote.value = note
  // Note: currentView stays as 'list' - we show editor alongside list now
  announceNavigation(`editing note: ${note.title}`)
  // Update URL
  router.push({ name: 'notes', query: { noteId: note.id } })
}

/**
 * Handle close editor (returns to empty state in side-by-side view)
 */
const handleCloseEditor = () => {
  selectedNote.value = null
  currentView.value = 'list'
  searchActive.value = false
  announceNavigation('notes list')
  // Clear URL query params
  router.push({ name: 'notes' })
}

/**
 * Handle save note
 */
const handleSaveNote = async (noteData) => {
  let result

  if (noteData.id) {
    // Update existing note
    result = await notesStore.updateNote(noteData.id, {
      title: noteData.title,
      content: noteData.content
    })
  } else {
    // Create new note
    result = await notesStore.createNote({
      title: noteData.title || 'Untitled',
      content: noteData.content || '',
      topic_id: notesStore.selectedTopicId || noteData.topic_id
    })

    if (result.success) {
      // Update selected note to the newly created one
      selectedNote.value = result.data
      // Update URL with new note ID
      router.push({ name: 'notes', query: { noteId: result.data.id } })
    }
  }

  if (result.success) {
    // Toast notification handled by autosave composable
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to save note',
      life: 5000
    })
  }
}

/**
 * Handle toggle pin
 */
const handleTogglePin = async (note) => {
  const result = await notesStore.togglePin(note.id)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: note.is_pinned ? 'Note Unpinned' : 'Note Pinned',
      detail: `"${note.title}" ${note.is_pinned ? 'unpinned' : 'pinned'}`,
      life: 2000
    })

    // Update selected note if it's the one being pinned/unpinned
    if (selectedNote.value?.id === note.id) {
      selectedNote.value = { ...selectedNote.value, is_pinned: !note.is_pinned }
    }
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to update note',
      life: 5000
    })
  }
}

/**
 * Handle toggle archive
 */
const handleToggleArchive = async (note) => {
  const result = await notesStore.toggleArchive(note.id)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: note.archived_at ? 'Note Unarchived' : 'Note Archived',
      detail: `"${note.title}" ${note.archived_at ? 'unarchived' : 'archived'}`,
      life: 2000
    })

    // Update selected note if it's the one being archived/unarchived
    if (selectedNote.value?.id === note.id) {
      selectedNote.value = {
        ...selectedNote.value,
        archived_at: note.archived_at ? null : new Date().toISOString()
      }
    }
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to update note',
      life: 5000
    })
  }
}

/**
 * Handle delete note - show confirmation dialog
 */
const handleDeleteNote = (note) => {
  noteToDelete.value = note
  showDeleteConfirm.value = true
}

/**
 * Confirm delete note - actually perform deletion
 */
const confirmDelete = async () => {
  if (!noteToDelete.value) {
    return
  }

  const note = noteToDelete.value
  const result = await notesStore.deleteNote(note.id)

  showDeleteConfirm.value = false

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Note Deleted',
      detail: `"${note.title}" has been deleted`,
      life: 3000
    })

    // If we're viewing the deleted note, go back to list
    if (selectedNote.value?.id === note.id) {
      handleCloseEditor()
    }
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to delete note',
      life: 5000
    })
  }

  noteToDelete.value = null
}

/**
 * Handle search
 */
const handleSearch = async (filters) => {
  if (!filters.query || filters.query.trim() === '') {
    searchActive.value = false
    return
  }

  searchActive.value = true
  searchQuery.value = filters.query
  searchLoading.value = true

  const startTime = Date.now()

  const result = await notesStore.searchNotes(filters.query)

  searchTime.value = Date.now() - startTime
  searchLoading.value = false

  if (result.success) {
    searchResults.value = result.data
    announceSearchResults(result.data.length, filters.query)
  } else {
    toast.add({
      severity: 'error',
      summary: 'Search Error',
      detail: result.error || 'Failed to search notes',
      life: 5000
    })
    searchResults.value = []
  }
}

/**
 * Handle clear search
 */
const handleClearSearch = () => {
  searchActive.value = false
  searchQuery.value = ''
  searchResults.value = []
  searchTime.value = null
}

/**
 * Handle URL query parameters
 */
const handleRouteQuery = () => {
  const { noteId, action } = route.query

  if (action === 'create') {
    handleCreateNote()
  } else if (noteId) {
    const note = notesStore.notes.find((n) => n.id === noteId)
    if (note) {
      handleOpenNote(note)
    }
  }
}

/**
 * Focus search bar
 */
const focusSearch = () => {
  if (currentView.value !== 'list') {
    handleCloseEditor()
  }
  // Focus will be handled by the search bar component
  // You can add a ref and call focus() if needed
}

/**
 * Force save current note
 */
const forceSave = () => {
  if (currentView.value === 'editor' && selectedNote.value) {
    // The autosave composable in NoteEditor handles this
    toast.add({
      severity: 'info',
      summary: 'Autosaving',
      detail: 'Your note is being saved...',
      life: 2000
    })
  }
}

/**
 * Set up keyboard shortcuts
 */
useNoteKeyboardShortcuts({
  onNewNote: () => {
    if (currentView.value !== 'editor') {
      handleCreateNote()
    }
  },
  onSearch: focusSearch,
  onSave: forceSave,
  onClose: () => {
    if (currentView.value === 'editor' || searchActive.value) {
      handleCloseEditor()
    }
  },
  onTogglePin: () => {
    if (currentView.value === 'editor' && selectedNote.value) {
      handleTogglePin(selectedNote.value)
    }
  },
  onDelete: () => {
    if (currentView.value === 'editor' && selectedNote.value) {
      handleDeleteNote(selectedNote.value)
    }
  }
})

/**
 * Initialize on mount
 */
onMounted(async () => {
  await Promise.all([notesStore.fetchTopics(), notesStore.fetchNotes()])

  notesStore.setupRealtimeSubscriptions()

  // Handle URL query parameters after data is loaded
  handleRouteQuery()
})

/**
 * Clean up subscriptions on unmount
 */
onBeforeUnmount(() => {
  // Clean up real-time subscriptions if needed
})

/**
 * Watch for route changes
 */
watch(
  () => route.query,
  () => {
    if (route.name === 'notes') {
      handleRouteQuery()
    }
  }
)
</script>

<template>
  <AppLayout>
    <div class="notes-view-container">
      <!-- Topic Sidebar -->
      <TopicList class="notes-topic-sidebar" />

      <!-- Notes List Panel -->
      <div class="notes-list-panel">
        <!-- Header with Search and Actions -->
        <div class="notes-list-header">
          <div class="header-top">
            <div class="header-title">
              <h2>{{ noteListTitle }}</h2>
              <span v-if="displayedNotes.length > 0" class="note-count">
                {{ displayedNotes.length }} {{ displayedNotes.length === 1 ? 'note' : 'notes' }}
              </span>
            </div>
            <div class="header-actions">
              <Button
                v-tooltip.bottom="'Keyboard Shortcuts'"
                icon="pi pi-question-circle"
                text
                rounded
                size="small"
                @click="showShortcutsHelp = true"
              />
              <Button label="New Note" icon="pi pi-plus" @click="handleCreateNote" />
            </div>
          </div>

          <!-- Search Bar -->
          <NoteSearchBar
            :result-count="searchActive ? searchResults.length : null"
            :search-time="searchTime"
            @search="handleSearch"
            @clear="handleClearSearch"
          />

          <!-- View Controls -->
          <div class="view-controls">
            <!-- View Mode Toggle -->
            <div class="view-mode-toggle">
              <Button
                v-tooltip.bottom="'List view'"
                icon="pi pi-list"
                text
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
              />
              <Button
                v-tooltip.bottom="'Grid view'"
                icon="pi pi-th-large"
                text
                :class="{ active: viewMode === 'grid' }"
                @click="viewMode = 'grid'"
              />
            </div>

            <!-- Sort Select -->
            <Select
              v-model="sortBy"
              :options="sortOptions"
              option-label="label"
              option-value="value"
              placeholder="Sort by"
              size="small"
              class="sort-select"
            />
          </div>
        </div>

        <!-- Notes List Content -->
        <div class="notes-list-content">
          <!-- Loading State -->
          <div v-if="notesStore.loading" class="loading-state">
            <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400">Loading notes...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="notesStore.error" class="error-state">
            <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-4"></i>
            <p class="text-red-600 dark:text-red-400 mb-4">{{ notesStore.error }}</p>
            <Button label="Retry" icon="pi pi-refresh" @click="notesStore.fetchNotes()" />
          </div>

          <!-- Note List (always visible unless loading/error) -->
          <div v-else-if="!searchActive">
            <NoteList
              :notes="displayedNotes"
              :title="noteListTitle"
              :loading="notesStore.loading"
              :empty-state-title="emptyStateTitle"
              :empty-state-message="emptyStateMessage"
              :view-mode="viewMode"
              :sort-by="sortBy"
              @open="handleOpenNote"
              @create="handleCreateNote"
              @pin="handleTogglePin"
              @archive="handleToggleArchive"
              @delete="handleDeleteNote"
            />
          </div>

          <!-- Search Results -->
          <div v-else class="search-results-container">
            <NoteSearchResults
              :results="searchResults"
              :loading="searchLoading"
              :search-query="searchQuery"
              @select="handleOpenNote"
            />
          </div>
        </div>
      </div>

      <!-- Editor Panel (side-by-side with list) -->
      <div class="notes-editor-panel">
        <!-- Empty State -->
        <div v-if="currentView !== 'editor' && !selectedNote" class="editor-empty-state">
          <i class="pi pi-file-edit text-6xl opacity-30 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No note selected
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Select a note from the list or create a new one
          </p>
        </div>

        <!-- Note Editor -->
        <div v-else class="note-editor-container">
          <NoteEditor
            :note="selectedNote"
            :topic-id="notesStore.selectedTopicId"
            @close="handleCloseEditor"
            @save="handleSaveNote"
            @pin="handleTogglePin(selectedNote)"
            @archive="handleToggleArchive(selectedNote)"
            @delete="handleDeleteNote(selectedNote)"
          />
        </div>
      </div>

      <!-- Confirm Delete Dialog -->
      <ConfirmDialog
        v-model:visible="showDeleteConfirm"
        header="Delete Note"
        :message="`Are you sure you want to delete &quot;${noteToDelete?.title}&quot;? This action cannot be undone.`"
        severity="danger"
        confirm-label="Delete"
        confirm-icon="pi pi-trash"
        @confirm="confirmDelete"
      />

      <!-- Keyboard Shortcuts Help Dialog -->
      <KeyboardShortcutsHelp v-model:visible="showShortcutsHelp" />

      <!-- Accessibility Announcements -->
      <AriaLiveRegion :message="announcement" :priority="announcementPriority" />

      <!-- Toast for notifications -->
      <Toast />
    </div>
  </AppLayout>
</template>

<style scoped>
/* Main Grid Layout: Topic Sidebar | Notes List | Editor */
.notes-view-container {
  display: grid;
  grid-template-columns: 240px 380px 1fr;
  gap: 1.5rem;
  height: calc(100vh - 120px);
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
}

/* Topic Sidebar */
.notes-topic-sidebar {
  overflow-y: auto;
}

/* Notes List Panel */
.notes-list-panel {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.dark .notes-list-panel {
  background: var(--bg-surface, #1f1f1f);
  border-color: var(--border-default, #374151);
}

.notes-list-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--p-surface-border);
  background: var(--p-surface-0);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--p-text-color);
  margin: 0;
}

.note-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
  padding: 0.25rem 0.625rem;
  background: var(--p-surface-100);
  border-radius: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--p-surface-border);
}

.view-mode-toggle {
  display: flex;
  align-items: center;
  background: var(--p-surface-100);
  border-radius: 8px;
  padding: 0.125rem;
}

.view-mode-toggle :deep(.p-button) {
  border-radius: 6px;
  transition: all 0.2s ease;
}

.view-mode-toggle :deep(.p-button.active) {
  background: var(--p-surface-0);
  color: var(--p-primary-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.sort-select {
  min-width: 160px;
}

.notes-list-content {
  flex: 1;
  overflow-y: auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.search-results-container {
  height: 100%;
  overflow-y: auto;
}

/* Editor Panel */
.notes-editor-panel {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.dark .notes-editor-panel {
  background: var(--bg-surface, #1f1f1f);
  border-color: var(--border-default, #374151);
}

.editor-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 3rem;
  text-align: center;
}

.note-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Tablet: Collapse to 2 columns (hide topics on smaller screens) */
@media (max-width: 1200px) {
  .notes-view-container {
    grid-template-columns: 320px 1fr;
  }

  .notes-topic-sidebar {
    display: none;
  }
}

/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .notes-view-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    gap: 1rem;
    padding: 1rem;
    height: calc(100vh - 100px);
  }

  .notes-list-panel {
    max-height: 40vh;
  }

  .notes-editor-panel {
    min-height: 50vh;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
