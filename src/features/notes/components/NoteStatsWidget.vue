<script setup>
import { computed, onMounted } from 'vue'
import { useNotesStore } from '../store'

const notesStore = useNotesStore()

// Calculate note statistics
const stats = computed(() => {
  const allNotes = notesStore.notes
  const activeNotes = allNotes.filter((n) => !n.archived_at)
  const archivedNotes = allNotes.filter((n) => n.archived_at)
  const pinnedNotes = allNotes.filter((n) => n.is_pinned && !n.archived_at)
  const { topics } = notesStore

  return {
    total: activeNotes.length,
    archived: archivedNotes.length,
    topics: topics.length,
    notesPerTopic:
      topics.length > 0 ? Math.round((activeNotes.length / topics.length) * 10) / 10 : 0,
    pinned: pinnedNotes.length
  }
})

// Fetch notes on mount
onMounted(() => {
  if (notesStore.notes.length === 0) {
    notesStore.fetchNotes()
  }
  if (notesStore.topics.length === 0) {
    notesStore.fetchTopics()
  }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Total Notes -->
    <div class="stat-card">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm text-gray-600 dark:text-gray-400">Total Notes</div>
        <i class="pi pi-file text-blue-500"></i>
      </div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ stats.total }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stats.archived }} archived</div>
    </div>

    <!-- Topics -->
    <div class="stat-card">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm text-gray-600 dark:text-gray-400">Topics</div>
        <i class="pi pi-folder text-purple-500"></i>
      </div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ stats.topics }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{ stats.notesPerTopic }} avg per topic
      </div>
    </div>

    <!-- Pinned Notes -->
    <div class="stat-card">
      <div class="flex items-center justify-between mb-2">
        <div class="text-sm text-gray-600 dark:text-gray-400">Pinned</div>
        <i class="pi pi-star-fill text-primary-500"></i>
      </div>
      <div class="text-3xl font-bold text-primary-600 dark:text-primary-500">
        {{ stats.pinned }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Quick access</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: white;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  padding: 1.25rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.dark .stat-card {
  background: rgb(31 41 55);
  border-color: rgb(55 65 81);
}
</style>
