<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import { getNotePreview, formatNoteTimestamp, getWordCount, getReadingTime } from '../utils'

const props = defineProps({
  note: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'pin', 'archive', 'delete'])

const contentPreview = computed(() => getNotePreview(props.note.content, 200))

const wordCount = computed(() => getWordCount(props.note.content))

const readingTime = computed(() => getReadingTime(props.note.content))

const formatTimestamp = (timestamp) => formatNoteTimestamp(timestamp)
</script>

<template>
  <Card
    class="note-card cursor-pointer hover:shadow-md transition-shadow"
    :class="{
      'opacity-60': note.archived_at,
      'border-l-4 border-primary-500': note.is_pinned
    }"
    @click="$emit('click')"
  >
    <template #content>
      <div class="space-y-3">
        <!-- Header with title and actions -->
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <i v-if="note.is_pinned" class="pi pi-star-fill text-primary-500 text-sm"></i>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {{ note.title }}
              </h3>
            </div>

            <!-- Topic badge -->
            <div v-if="note.topic" class="flex items-center space-x-2">
              <div
                class="px-2 py-1 rounded text-xs font-medium"
                :style="{
                  backgroundColor: note.topic.color + '20',
                  color: note.topic.color
                }"
              >
                {{ note.topic.name }}
              </div>
              <span
                v-if="note.archived_at"
                class="px-2 py-1 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                Archived
              </span>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center space-x-1 note-actions">
            <Button
              v-tooltip.bottom="note.is_pinned ? 'Unpin note' : 'Pin note'"
              :icon="note.is_pinned ? 'pi pi-star-fill' : 'pi pi-star'"
              class="p-button-rounded p-button-text p-button-sm"
              :class="{ 'text-primary-500': note.is_pinned }"
              @click.stop="$emit('pin')"
            />
            <Button
              v-tooltip.bottom="note.archived_at ? 'Unarchive note' : 'Archive note'"
              :icon="note.archived_at ? 'pi pi-inbox' : 'pi pi-box'"
              class="p-button-rounded p-button-text p-button-sm"
              @click.stop="$emit('archive')"
            />
            <Button
              v-tooltip.bottom="'Delete note'"
              icon="pi pi-trash"
              class="p-button-rounded p-button-text p-button-sm p-button-danger"
              @click.stop="$emit('delete')"
            />
          </div>
        </div>

        <!-- Content Preview -->
        <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {{ contentPreview }}
        </p>

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
.note-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.note-card:hover .note-actions {
  opacity: 1;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
