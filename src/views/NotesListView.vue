<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import Button from 'primevue/button'
import TopicList from '@/features/notes/components/TopicList.vue'
import NoteList from '@/features/notes/components/NoteList.vue'
import NoteSearchBar from '@/features/notes/components/NoteSearchBar.vue'
import { useNotesStore } from '@/features/notes/store'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const notesStore = useNotesStore()
const toast = useToast()

// Load notes and topics when component mounts
onMounted(async () => {
  await Promise.all([notesStore.fetchNotes(), notesStore.fetchTopics()])
})

// View state
const viewMode = ref('list')
const sortBy = ref('updated')

// Search state
const searchActive = ref(false)
const searchResults = ref([])
const searchQuery = ref('')
const searchTime = ref(null)
const searchLoading = ref(false)

// Filter notes based on selected topic
const displayedNotes = computed(() => {
  if (searchActive.value) {
    return searchResults.value
  }
  return notesStore.filteredNotes
})

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
 * Handle create note - navigate to editor
 */
const handleCreateNote = () => {
  router.push({ name: 'notes-create' })
}

/**
 * Handle open note - navigate to editor
 */
const handleOpenNote = (note) => {
  router.push({ name: 'notes-edit', params: { id: note.id } })
}

/**
 * Handle search
 */
const handleSearch = async (query) => {
  if (!query || query.trim().length === 0) {
    handleClearSearch()
    return
  }

  searchQuery.value = query
  searchLoading.value = true
  const startTime = performance.now()

  const result = await notesStore.searchNotes(query)

  if (result.success) {
    const endTime = performance.now()
    searchTime.value = Math.round(endTime - startTime)
    searchResults.value = result.data
    searchActive.value = true
  } else {
    toast.add({
      severity: 'error',
      summary: 'Search Error',
      detail: result.error || 'Failed to search notes',
      life: 3000
    })
  }

  searchLoading.value = false
}

/**
 * Handle clear search
 */
const handleClearSearch = () => {
  searchActive.value = false
  searchResults.value = []
  searchQuery.value = ''
  searchTime.value = null
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
 * Handle delete note
 */
const handleDeleteNote = async (note) => {
  const result = await notesStore.deleteNote(note.id)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Note Deleted',
      detail: `"${note.title}" has been deleted`,
      life: 2000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to delete note',
      life: 5000
    })
  }
}
</script>

<template>
  <AppLayout>
    <div class="notes-list-view">
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
        </div>

        <!-- Notes List -->
        <NoteList
          :notes="displayedNotes"
          :view-mode="viewMode"
          :sort-by="sortBy"
          :empty-title="emptyStateTitle"
          :empty-message="emptyStateMessage"
          @open-note="handleOpenNote"
          @toggle-pin="handleTogglePin"
          @delete-note="handleDeleteNote"
        />
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.notes-list-view {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  height: calc(100vh - 80px);
  padding: 24px;
  background: var(--bg-base);
}

.notes-topic-sidebar {
  height: 100%;
  overflow-y: auto;
}

.notes-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--border-default);
}

.notes-list-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-default);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.note-count {
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg-base);
  padding: 4px 12px;
  border-radius: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .notes-list-view {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .notes-topic-sidebar {
    display: none;
  }
}
</style>
