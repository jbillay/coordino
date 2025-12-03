<script setup>
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useNotesStore } from '../store'
import TopicCard from './TopicCard.vue'
import TopicDialog from './TopicDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useToast } from 'primevue/usetoast'

const notesStore = useNotesStore()
const toast = useToast()

const showTopicDialog = ref(false)
const selectedTopic = ref(null)
const showDeleteConfirm = ref(false)
const topicToDelete = ref(null)

const sortedTopics = computed({
  get: () => notesStore.topics,
  set: () => {
    // Update will be handled in handleReorder
  }
})

const deleteConfirmMessage = computed(() => {
  const count = topicToDelete.value?.note_count || 0
  if (count === 0) {
    return 'Are you sure you want to delete this topic?'
  }
  return `This topic contains ${count} note${count === 1 ? '' : 's'}. Deleting this topic will also delete all notes within it. This action cannot be undone.`
})

const selectTopic = (topicId) => {
  notesStore.selectedTopicId = topicId
  notesStore.fetchNotes(topicId)
}

const selectAllNotes = () => {
  notesStore.selectedTopicId = null
  notesStore.fetchNotes()
}

const handleEditTopic = (topic) => {
  selectedTopic.value = topic
  showTopicDialog.value = true
}

const handleDeleteTopic = (topic) => {
  topicToDelete.value = topic
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!topicToDelete.value) {
    return
  }

  const result = await notesStore.deleteTopic(topicToDelete.value.id)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Topic Deleted',
      detail: `Topic "${topicToDelete.value.name}" deleted successfully`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to delete topic',
      life: 5000
    })
  }

  topicToDelete.value = null
}

const handleReorder = async () => {
  const result = await notesStore.reorderTopics(sortedTopics.value)

  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to reorder topics',
      life: 3000
    })
    // Refresh topics to restore original order
    await notesStore.fetchTopics()
  }
}

const handleTopicSaved = () => {
  selectedTopic.value = null
}

onMounted(() => {
  if (notesStore.topics.length === 0) {
    notesStore.fetchTopics()
  }
})
</script>

<template>
  <div
    class="topic-list h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
  >
    <!-- Header -->
    <div
      class="topic-list-header flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Topics</h2>
      <Button
        v-tooltip.bottom="'Create new topic'"
        icon="pi pi-plus"
        class="p-button-rounded p-button-text"
        @click="showTopicDialog = true"
      />
    </div>

    <!-- All Notes Option -->
    <div class="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
      <div
        class="topic-card flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors"
        :class="{
          'bg-primary-50 dark:bg-primary-900/20': !notesStore.selectedTopicId,
          'hover:bg-gray-50 dark:hover:bg-gray-800': notesStore.selectedTopicId
        }"
        @click="selectAllNotes"
      >
        <div class="flex items-center space-x-3 flex-1">
          <i class="pi pi-list text-gray-600 dark:text-gray-400"></i>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">All Notes</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ notesStore.activeNotesCount }} notes
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Topics List -->
    <div class="flex-1 overflow-y-auto px-2 py-2">
      <draggable
        v-model="sortedTopics"
        item-key="id"
        handle=".drag-handle"
        animation="200"
        ghost-class="opacity-50"
        @end="handleReorder"
      >
        <template #item="{ element: topic }">
          <div class="mb-2">
            <TopicCard
              :topic="topic"
              :selected="topic.id === notesStore.selectedTopicId"
              @select="selectTopic(topic.id)"
              @edit="handleEditTopic(topic)"
              @delete="handleDeleteTopic(topic)"
            />
          </div>
        </template>
      </draggable>

      <!-- Empty State -->
      <div v-if="sortedTopics.length === 0" class="text-center py-8 px-4">
        <i class="pi pi-folder-open text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          No topics yet.
          <br />
          Create your first topic to organize your notes!
        </p>
        <Button
          label="Create Topic"
          icon="pi pi-plus"
          size="small"
          @click="showTopicDialog = true"
        />
      </div>
    </div>

    <!-- Topic Dialog -->
    <TopicDialog
      v-model:visible="showTopicDialog"
      :topic="selectedTopic"
      @saved="handleTopicSaved"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:visible="showDeleteConfirm"
      :header="`Delete Topic: ${topicToDelete?.name}`"
      :message="deleteConfirmMessage"
      confirm-label="Delete"
      cancel-label="Cancel"
      severity="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.topic-list {
  width: 280px;
  min-width: 280px;
}

@media (max-width: 768px) {
  .topic-list {
    width: 100%;
  }
}
</style>
