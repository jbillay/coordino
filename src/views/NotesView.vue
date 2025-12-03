<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import Toast from 'primevue/toast'
import TopicList from '@/features/notes/components/TopicList.vue'
import NoteList from '@/features/notes/components/NoteList.vue'
import NoteEditor from '@/features/notes/components/NoteEditor.vue'
import NoteSearchBar from '@/features/notes/components/NoteSearchBar.vue'
import NoteSearchResults from '@/features/notes/components/NoteSearchResults.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import KeyboardShortcutsHelp from '@/features/notes/components/KeyboardShortcutsHelp.vue'
import AriaLiveRegion from '@/components/common/AriaLiveRegion.vue'
import { useNotesStore } from '@/features/notes/store'
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
 * Handle open note for editing
 */
const handleOpenNote = (note) => {
  selectedNote.value = note
  currentView.value = 'editor'
  announceNavigation(`editing note: ${note.title}`)
  // Update URL
  router.push({ name: 'notes', query: { noteId: note.id } })
}

/**
 * Handle close editor
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
    currentView.value = 'list'
    return
  }

  searchActive.value = true
  currentView.value = 'search'
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
  currentView.value = 'list'
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
    <div class="notes-view flex h-full">
      <!-- Topic Sidebar -->
      <TopicList class="flex-shrink-0" />

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header with Search -->
        <div
          class="notes-header px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
        >
          <div class="space-y-4">
            <!-- Title and Actions Row -->
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{
                    currentView === 'editor'
                      ? selectedNote
                        ? 'Edit Note'
                        : 'New Note'
                      : noteListTitle
                  }}
                </h1>
              </div>

              <div v-if="currentView === 'list'" class="flex items-center space-x-2">
                <Button
                  v-tooltip.bottom="'Keyboard Shortcuts'"
                  icon="pi pi-question-circle"
                  class="p-button-text p-button-rounded"
                  @click="showShortcutsHelp = true"
                />
                <Button label="New Note" icon="pi pi-plus" @click="handleCreateNote" />
              </div>
            </div>

            <!-- Search Bar (only show in list view) -->
            <div v-if="currentView === 'list'">
              <NoteSearchBar
                :result-count="searchActive ? searchResults.length : null"
                :search-time="searchTime"
                @search="handleSearch"
                @clear="handleClearSearch"
              />
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-hidden">
          <!-- Loading State -->
          <div v-if="notesStore.loading" class="flex items-center justify-center h-full">
            <div class="text-center">
              <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
              <p class="text-gray-600 dark:text-gray-400">Loading notes...</p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="notesStore.error" class="flex items-center justify-center h-full">
            <div class="text-center">
              <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-4"></i>
              <p class="text-red-600 dark:text-red-400 mb-4">{{ notesStore.error }}</p>
              <Button label="Retry" icon="pi pi-refresh" @click="notesStore.fetchNotes()" />
            </div>
          </div>

          <!-- Note List View -->
          <div v-else-if="currentView === 'list' && !searchActive" class="h-full">
            <NoteList
              :notes="displayedNotes"
              :title="noteListTitle"
              :loading="notesStore.loading"
              :empty-state-title="emptyStateTitle"
              :empty-state-message="emptyStateMessage"
              @open="handleOpenNote"
              @create="handleCreateNote"
              @pin="handleTogglePin"
              @archive="handleToggleArchive"
              @delete="handleDeleteNote"
            />
          </div>

          <!-- Search Results View -->
          <div
            v-else-if="currentView === 'search' && searchActive"
            class="h-full overflow-y-auto p-6"
          >
            <NoteSearchResults
              :results="searchResults"
              :loading="searchLoading"
              :search-query="searchQuery"
              @select="handleOpenNote"
            />
          </div>

          <!-- Editor View -->
          <div v-else-if="currentView === 'editor'" class="h-full">
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
.notes-view {
  height: calc(100vh - 64px); /* Adjust based on header height */
}

.notes-header {
  flex-shrink: 0;
}
</style>
