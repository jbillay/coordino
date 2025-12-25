<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import NoteEditor from '@/features/notes/components/NoteEditor.vue'
import { useNotesStore } from '@/features/notes/store'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const toast = useToast()

// Component state
const note = ref(null)
const selectedTopicId = ref(null)
const loading = ref(false)
const saving = ref(false)

// Check if this is edit mode or create mode
const isEditMode = computed(() => !!route.params.id)

// Topic options for dropdown
const topicOptions = computed(() =>
  notesStore.topics.map((topic) => ({
    label: topic.name,
    value: topic.id
  }))
)

// Breadcrumb navigation
const breadcrumb = computed(() => {
  if (isEditMode.value && note.value) {
    const topicName = note.value.topic?.name || 'All Notes'
    return `Notes > ${topicName} > ${note.value.title || 'Untitled'}`
  }
  return 'Notes > New Note'
})

/**
 * Load note data if in edit mode
 */
onMounted(async () => {
  if (isEditMode.value) {
    loading.value = true
    await notesStore.fetchTopics()
    const noteId = route.params.id

    // Find note in store
    const existingNote = notesStore.notes.find((n) => n.id === noteId)

    if (existingNote) {
      note.value = { ...existingNote }
      selectedTopicId.value = existingNote.topic_id
    } else {
      // Note not found, redirect to list
      toast.add({
        severity: 'error',
        summary: 'Note Not Found',
        detail: 'The requested note could not be found',
        life: 3000
      })
      router.push({ name: 'notes' })
    }

    loading.value = false
  } else {
    // Create mode - initialize empty note
    await notesStore.fetchTopics()
    note.value = {
      title: '',
      content: '',
      topic_id: notesStore.selectedTopicId || null
    }
    selectedTopicId.value = notesStore.selectedTopicId
  }
})

/**
 * Watch for topic changes
 */
watch(selectedTopicId, (newTopicId) => {
  if (note.value) {
    note.value.topic_id = newTopicId
  }
})

/**
 * Handle save note
 */
const handleSave = async (noteData) => {
  saving.value = true

  let result
  const dataToSave = {
    ...noteData,
    topic_id: selectedTopicId.value
  }

  if (isEditMode.value && note.value.id) {
    // Update existing note
    result = await notesStore.updateNote(note.value.id, {
      title: dataToSave.title || 'Untitled',
      content: dataToSave.content || '',
      topic_id: dataToSave.topic_id
    })
  } else {
    // Create new note
    result = await notesStore.createNote({
      title: dataToSave.title || 'Untitled',
      content: dataToSave.content || '',
      topic_id: dataToSave.topic_id
    })
  }

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: isEditMode.value ? 'Note Updated' : 'Note Created',
      detail: `"${result.data.title}" has been saved`,
      life: 2000
    })

    // Navigate back to notes list
    router.push({ name: 'notes' })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to save note',
      life: 5000
    })
  }

  saving.value = false
}

/**
 * Handle cancel
 */
const handleCancel = () => {
  router.push({ name: 'notes' })
}

/**
 * Handle back button
 */
const handleBack = () => {
  router.push({ name: 'notes' })
}
</script>

<template>
  <AppLayout>
    <div class="note-editor-view">
      <!-- Header with breadcrumb and actions -->
      <div class="editor-header">
        <div class="breadcrumb">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            aria-label="Back to notes"
            @click="handleBack"
          />
          <span class="breadcrumb-text">{{ breadcrumb }}</span>
        </div>

        <div class="header-actions">
          <Button label="Cancel" severity="secondary" outlined @click="handleCancel" />
          <Button label="Save" icon="pi pi-save" :loading="saving" @click="handleSave(note)" />
        </div>
      </div>

      <!-- Topic Selector -->
      <div class="topic-selector">
        <label for="topic-select">Topic</label>
        <Select
          id="topic-select"
          v-model="selectedTopicId"
          :options="topicOptions"
          option-label="label"
          option-value="value"
          placeholder="Select a topic (optional)"
          show-clear
          class="w-full md:w-[300px]"
        />
      </div>

      <!-- Note Editor -->
      <div v-if="!loading" class="editor-container">
        <NoteEditor
          v-if="note"
          :note="note"
          :auto-focus="!isEditMode"
          @save="handleSave"
          @cancel="handleCancel"
        />
      </div>

      <!-- Loading state -->
      <div v-else class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Loading note...</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.note-editor-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  padding: 24px;
  background: var(--bg-base);
  gap: 16px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-default);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.topic-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--border-default);
}

.topic-selector label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 60px;
}

.editor-container {
  flex: 1;
  overflow: hidden;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--border-default);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  color: var(--text-secondary);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .note-editor-view {
    padding: 16px;
  }

  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .breadcrumb-text {
    font-size: 12px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }

  .topic-selector {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
