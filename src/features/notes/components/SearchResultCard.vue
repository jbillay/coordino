<script setup>
import { computed } from 'vue'
import SanitizedHtml from '~/components/common/SanitizedHtml.vue'
import {
  highlightSearchTerms,
  getSearchSnippet,
  formatNoteTimestamp,
  getWordCount,
  getReadingTime
} from '../utils'

const props = defineProps({
  note: {
    type: Object,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  },
  showRelevance: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

// Highlighted title
const highlightedTitle = computed(() => {
  if (!props.searchQuery) {
    return props.note.title
  }
  return highlightSearchTerms(props.note.title, props.searchQuery)
})

// Highlighted content snippet
const highlightedSnippet = computed(() => {
  if (!props.searchQuery) {
    // Return plain snippet if no search query
    const snippet = getSearchSnippet(props.note.content, '', 200)
    return snippet
  }

  // Get context around search terms
  const snippet = getSearchSnippet(props.note.content, props.searchQuery, 200)
  return highlightSearchTerms(snippet, props.searchQuery)
})

// Calculate relevance score (simplified - in production, this would come from the search engine)
const relevanceScore = computed(() => {
  if (!props.searchQuery) {
    return null
  }

  const query = props.searchQuery.toLowerCase()
  const title = props.note.title.toLowerCase()
  const content = props.note.content.toLowerCase()

  let score = 0

  // Title exact match: +50 points
  if (title === query) {
    score += 50
  } else if (title.includes(query)) {
    score += 30
  }

  // Content contains query: +20 points
  if (content.includes(query)) {
    score += 20
  }

  // Bonus for pinned notes: +10 points
  if (props.note.is_pinned) {
    score += 10
  }

  // Cap at 100
  return Math.min(score, 100)
})

const wordCount = computed(() => getWordCount(props.note.content))

const readingTime = computed(() => getReadingTime(props.note.content))

const formatTimestamp = (timestamp) => formatNoteTimestamp(timestamp)
</script>

<template>
  <Card
    class="search-result-card cursor-pointer hover:shadow-md transition-shadow"
    :class="{ 'border-l-4 border-primary-500': note.is_pinned }"
    @click="$emit('click')"
  >
    <template #content>
      <div class="space-y-2">
        <!-- Header with title and metadata -->
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <!-- Title with highlighting -->
            <div class="flex items-center space-x-2 mb-1">
              <i
                v-if="note.is_pinned"
                class="pi pi-star-fill text-primary-500 text-sm flex-shrink-0"
              ></i>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                <SanitizedHtml :html="highlightedTitle" />
              </h3>
            </div>

            <!-- Topic badge and archived status -->
            <div class="flex items-center space-x-2 mb-2">
              <div
                v-if="note.topic"
                class="px-2 py-0.5 rounded text-xs font-medium"
                :style="{
                  backgroundColor: note.topic.color + '20',
                  color: note.topic.color
                }"
              >
                {{ note.topic.name }}
              </div>
              <span
                v-if="note.archived_at"
                class="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                Archived
              </span>
            </div>
          </div>

          <!-- Relevance Score (optional) -->
          <div
            v-if="showRelevance && relevanceScore"
            class="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <i class="pi pi-chart-line"></i>
            <span>{{ relevanceScore }}%</span>
          </div>
        </div>

        <!-- Content snippet with highlighting -->
        <div class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          <SanitizedHtml :html="highlightedSnippet" />
        </div>

        <!-- Footer with metadata -->
        <div
          class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700"
        >
          <span>{{ formatTimestamp(note.updated_at) }}</span>
          <div class="flex items-center space-x-3">
            <span v-if="wordCount > 0">{{ wordCount }} words</span>
            <span v-if="readingTime > 0">{{ readingTime }} min read</span>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.search-result-card {
  position: relative;
}

/* Highlight styling */
:deep(mark) {
  background-color: #fef08a;
  color: #854d0e;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.dark :deep(mark) {
  background-color: #713f12;
  color: #fef08a;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

<style scoped>
.search-result-card {
  position: relative;
}

/* Highlight styling */
:deep(mark) {
  background-color: #fef08a;
  color: #854d0e;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.dark :deep(mark) {
  background-color: #713f12;
  color: #fef08a;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
