<script setup>
import { computed } from 'vue'
import SearchResultCard from './SearchResultCard.vue'

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  },
  groupByTopic: {
    type: Boolean,
    default: true
  }
})

defineEmits(['select'])

// Group results by topic
const groupedResults = computed(() => {
  const groups = new Map()

  props.results.forEach((note) => {
    const topicId = note.topic?.id || null

    if (!groups.has(topicId)) {
      groups.set(topicId, {
        topicId,
        topic: note.topic,
        notes: []
      })
    }

    groups.get(topicId).notes.push(note)
  })

  // Sort groups: topics with more results first
  return Array.from(groups.values()).sort((a, b) => {
    // No topic group goes last
    if (a.topicId === null) {
      return 1
    }
    if (b.topicId === null) {
      return -1
    }
    // Otherwise sort by number of notes
    return b.notes.length - a.notes.length
  })
})
</script>

<template>
  <div class="note-search-results">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
    </div>

    <!-- Results List -->
    <div v-else-if="results.length > 0" class="results-list space-y-3">
      <!-- Group results by topic if enabled -->
      <template v-if="groupByTopic">
        <div
          v-for="group in groupedResults"
          :key="group.topicId || 'no-topic'"
          class="result-group"
        >
          <!-- Topic Header -->
          <div v-if="group.topic" class="topic-header flex items-center space-x-2 px-3 py-2 mb-2">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: group.topic.color }"></div>
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {{ group.topic.name }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">({{ group.notes.length }})</span>
          </div>

          <!-- Notes in this topic -->
          <div class="space-y-2">
            <SearchResultCard
              v-for="note in group.notes"
              :key="note.id"
              :note="note"
              :search-query="searchQuery"
              @click="$emit('select', note)"
            />
          </div>
        </div>
      </template>

      <!-- Flat list of results -->
      <template v-else>
        <SearchResultCard
          v-for="note in results"
          :key="note.id"
          :note="note"
          :search-query="searchQuery"
          @click="$emit('select', note)"
        />
      </template>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="searchQuery && !loading"
      class="empty-state flex flex-col items-center justify-center py-12 px-4"
    >
      <i class="pi pi-search text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No results found</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        Try adjusting your search terms or filters. You can search by title, content, or topic.
      </p>
    </div>

    <!-- Initial State (no search) -->
    <div v-else class="initial-state flex flex-col items-center justify-center py-12 px-4">
      <i class="pi pi-search text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Search your notes</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        Enter keywords to find notes by title, content, or topic. Use filters to narrow your search.
      </p>
    </div>
  </div>
</template>

<style scoped>
.result-group + .result-group {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.dark .result-group + .result-group {
  border-top-color: #374151;
}
</style>
