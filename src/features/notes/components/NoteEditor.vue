<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import InputText from 'primevue/inputtext'
import { EditorContent } from '@tiptap/vue-3'
import { useNoteEditor } from '../composables/useNoteEditor'
import { useNoteAutosave } from '../composables/useNoteAutosave'
import { validateNote, formatNoteTimestamp } from '../utils'
import EditorToolbar from './EditorToolbar.vue'

const props = defineProps({
  note: {
    type: Object,
    default: null
  },
  topicId: {
    type: String,
    default: null
  }
})

defineEmits(['close', 'save', 'pin', 'archive', 'delete'])

const localTitle = ref('')
const localContent = ref('')
const errors = ref({})

// Initialize editor
const { editor, setContent, getWordCount, getCharacterCount } = useNoteEditor({
  content: props.note?.content || '',
  placeholder: 'Start writing your note...',
  onUpdate: handleContentChange
})

// Initialize autosave
const {
  saveStatus,
  isSaving,
  triggerAutosave: autosaveTrigger,
  forceSave,
  cancelAutosave
} = useNoteAutosave({
  noteId: computed(() => props.note?.id).value,
  topicId: computed(() => props.topicId).value,
  debounceMs: 3000
})

// Computed save status text
const saveStatusText = computed(() => {
  if (isSaving.value) {
    return 'Saving...'
  }
  if (saveStatus.value === 'Saved') {
    return 'Saved'
  }
  if (saveStatus.value === 'Error saving') {
    return 'Error saving'
  }
  return ''
})

// Computed properties
const wordCount = computed(() => getWordCount())
const characterCount = computed(() => getCharacterCount())

// Watch for note changes (when switching between notes)
watch(
  () => props.note,
  (newNote) => {
    if (newNote) {
      localTitle.value = newNote.title
      localContent.value = newNote.content
      setContent(newNote.content)
      errors.value = {}
    } else {
      // New note
      localTitle.value = ''
      localContent.value = ''
      setContent('')
      errors.value = {}
    }
  },
  { immediate: true }
)

// Handle title change
const handleTitleChange = () => {
  errors.value = {}
  triggerAutosaveInternal()
}

// Handle content change from editor
function handleContentChange(html) {
  localContent.value = html
  triggerAutosaveInternal()
}

// Trigger autosave
const triggerAutosaveInternal = () => {
  const noteData = {
    title: localTitle.value,
    content: localContent.value
  }

  // Validate before saving
  const validation = validateNote({
    ...noteData,
    id: props.note?.id,
    topic_id: props.topicId || props.note?.topic_id
  })

  if (!validation.valid) {
    errors.value = validation.errors
    return
  }

  // Clear errors and trigger autosave
  errors.value = {}
  autosaveTrigger(noteData)
}

// Format timestamp
const formatTimestamp = (timestamp) => formatNoteTimestamp(timestamp)

// Force save on unmount
onBeforeUnmount(() => {
  if (localTitle.value || localContent.value) {
    forceSave({
      id: props.note?.id,
      title: localTitle.value,
      content: localContent.value,
      topic_id: props.topicId || props.note?.topic_id
    })
  }
  cancelAutosave()
})
</script>

<template>
  <div class="note-editor h-full flex flex-col bg-white dark:bg-gray-900">
    <!-- Editor Header -->
    <div
      class="editor-header flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center space-x-4 flex-1 min-w-0">
        <!-- Back Button -->
        <Button
          v-tooltip.bottom="'Back to notes'"
          icon="pi pi-arrow-left"
          class="p-button-text p-button-sm"
          @click="$emit('close')"
        />

        <!-- Topic Badge -->
        <div
          v-if="note?.topic"
          class="px-3 py-1 rounded text-sm font-medium"
          :style="{
            backgroundColor: note.topic.color + '20',
            color: note.topic.color
          }"
        >
          {{ note.topic.name }}
        </div>

        <!-- Archived Badge -->
        <div
          v-if="note?.archived_at"
          class="px-3 py-1 rounded text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          Archived
        </div>
      </div>

      <!-- Actions and Status -->
      <div class="flex items-center space-x-3">
        <!-- Save Status -->
        <div class="flex items-center space-x-2 text-sm">
          <i v-if="saveStatus === 'saving'" class="pi pi-spin pi-spinner text-gray-500"></i>
          <i v-else-if="saveStatus === 'saved'" class="pi pi-check text-green-500"></i>
          <i v-else-if="saveStatus === 'error'" class="pi pi-exclamation-triangle text-red-500"></i>
          <span
            class="text-gray-600 dark:text-gray-400"
            :class="{
              'text-green-600 dark:text-green-400': saveStatus === 'saved',
              'text-red-600 dark:text-red-400': saveStatus === 'error'
            }"
          >
            {{ saveStatusText }}
          </span>
        </div>

        <!-- Editor Statistics -->
        <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-3">
          <span>{{ wordCount }} words</span>
          <span>{{ characterCount }} characters</span>
        </div>

        <!-- Pin Button -->
        <Button
          v-tooltip.bottom="note?.is_pinned ? 'Unpin note' : 'Pin note'"
          :icon="note?.is_pinned ? 'pi pi-star-fill' : 'pi pi-star'"
          class="p-button-rounded p-button-text"
          :class="{ 'text-primary-500': note?.is_pinned }"
          @click="$emit('pin')"
        />

        <!-- Archive Button -->
        <Button
          v-tooltip.bottom="note?.archived_at ? 'Unarchive note' : 'Archive note'"
          :icon="note?.archived_at ? 'pi pi-inbox' : 'pi pi-box'"
          class="p-button-rounded p-button-text"
          @click="$emit('archive')"
        />

        <!-- Delete Button -->
        <Button
          v-tooltip.bottom="'Delete note'"
          icon="pi pi-trash"
          class="p-button-rounded p-button-text p-button-danger"
          @click="$emit('delete')"
        />
      </div>
    </div>

    <!-- Title Input -->
    <div class="px-6 pt-6">
      <InputText
        v-model="localTitle"
        placeholder="Note title..."
        class="w-full text-3xl font-bold border-0 focus:ring-0 p-0"
        :class="{ 'p-invalid': errors.title }"
        @input="handleTitleChange"
      />
      <small v-if="errors.title" class="p-error block mt-2">{{ errors.title }}</small>
    </div>

    <!-- Editor Toolbar -->
    <div class="px-6 pt-4">
      <EditorToolbar v-if="editor" :editor="editor" />
    </div>

    <!-- Editor Content -->
    <div class="flex-1 overflow-y-auto px-6 py-4">
      <EditorContent :editor="editor" class="prose prose-lg max-w-none dark:prose-invert" />
    </div>

    <!-- Editor Footer with Metadata -->
    <div
      v-if="note"
      class="editor-footer px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
    >
      <div class="flex items-center justify-between">
        <span>Created {{ formatTimestamp(note.created_at) }}</span>
        <span>Last updated {{ formatTimestamp(note.updated_at) }}</span>
      </div>
    </div>
  </div>
</template>

<style>
/* Tiptap Editor Styles */
.ProseMirror {
  min-height: 300px;
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Prose styling for editor content */
.prose {
  color: #374151;
}

.dark .prose {
  color: #d1d5db;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: #111827;
}

.dark .prose h1,
.dark .prose h2,
.dark .prose h3,
.dark .prose h4,
.dark .prose h5,
.dark .prose h6 {
  color: #f9fafb;
}

.prose a {
  color: #3b82f6;
  text-decoration: underline;
}

.prose a:hover {
  color: #2563eb;
}

.prose code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.dark .prose code {
  background-color: #374151;
}

.prose pre {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.prose blockquote {
  border-left-color: #3b82f6;
  border-left-width: 4px;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
}

.dark .prose blockquote {
  color: #9ca3af;
}

.prose ul,
.prose ol {
  padding-left: 1.5rem;
}

.prose hr {
  border-color: #e5e7eb;
  margin: 2rem 0;
}

.dark .prose hr {
  border-color: #374151;
}
</style>
