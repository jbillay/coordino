<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '../store'
import { getNotePreview, formatNoteTimestamp } from '../utils'

const router = useRouter()
const notesStore = useNotesStore()

const loading = computed(() => notesStore.loading)

// Get up to 5 most recent notes
const recentNotes = computed(() => notesStore.recentNotes.slice(0, 5))

// Get preview text (strip HTML and truncate)
const getPreviewText = (content) => getNotePreview(content, 100)

// Format timestamp
const formatTimestamp = (timestamp) => formatNoteTimestamp(timestamp)

// Open note in notes view
const openNote = (note) => {
  router.push({
    name: 'notes',
    query: { noteId: note.id }
  })
}

// Create new note
const createNote = () => {
  router.push({
    name: 'notes',
    query: { action: 'create' }
  })
}

// Toggle pin status
const togglePin = async (note) => {
  await notesStore.togglePin(note.id)
}

// Fetch notes on mount
onMounted(() => {
  if (notesStore.notes.length === 0) {
    notesStore.fetchNotes()
  }
})
</script>

<template>
  <div class="content-card">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Recent Notes</h2>
      <router-link
        :to="{ name: 'notes' }"
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        View All
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <i class="pi pi-spin pi-spinner text-2xl text-primary-500"></i>
    </div>

    <!-- Notes List -->
    <div v-else-if="recentNotes.length > 0" class="space-y-3">
      <div v-for="note in recentNotes" :key="note.id" class="note-item" @click="openNote(note)">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <i v-if="note.is_pinned" class="pi pi-star-fill text-primary-500 text-xs"></i>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ note.title }}
              </h3>
            </div>

            <!-- Topic Badge -->
            <div v-if="note.topic" class="flex items-center space-x-2 mb-1">
              <div
                class="px-2 py-0.5 rounded text-xs font-medium"
                :style="{
                  backgroundColor: note.topic.color + '20',
                  color: note.topic.color
                }"
              >
                {{ note.topic.name }}
              </div>
            </div>

            <!-- Content Preview -->
            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
              {{ getPreviewText(note.content) }}
            </p>

            <!-- Metadata -->
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Updated {{ formatTimestamp(note.updated_at) }}
            </p>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center space-x-1 ml-2 note-actions">
            <Button
              v-tooltip.bottom="note.is_pinned ? 'Unpin' : 'Pin'"
              :icon="note.is_pinned ? 'pi pi-star-fill' : 'pi pi-star'"
              class="p-button-rounded p-button-text p-button-sm"
              :class="{ 'text-primary-500': note.is_pinned }"
              @click.stop="togglePin(note)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <i class="pi pi-file text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        No notes yet. Start capturing your ideas!
      </p>
      <Button label="Create Note" icon="pi pi-plus" size="small" @click="createNote" />
    </div>
  </div>
</template>

<style scoped>
.note-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.note-item:hover {
  background-color: rgb(249 250 251);
}

.dark .note-item:hover {
  background-color: rgba(55, 65, 81, 0.5);
}

.note-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-card {
  background: white;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  padding: 1.25rem;
  transition: all 0.2s;
}

.content-card:hover {
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.dark .content-card {
  background: rgb(31 41 55);
  border-color: rgb(55 65 81);
}
</style>
