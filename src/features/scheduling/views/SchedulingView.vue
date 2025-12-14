<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import MeetingList from '../components/MeetingList.vue'
import MeetingEditor from '../components/MeetingEditor.vue'
import { useSchedulingStore } from '../store'

const store = useSchedulingStore()

const initialLoading = ref(true)
const selectedMeetingId = ref(null)
const showEditor = ref(false)
const editorKey = ref(0)
const deleteDialogVisible = ref(false)
const meetingToDelete = ref(null)
const deleting = ref(false)

const handleSelectMeeting = (meetingId) => {
  selectedMeetingId.value = meetingId
  showEditor.value = true
  editorKey.value++
}

const handleCreateMeeting = () => {
  selectedMeetingId.value = null
  showEditor.value = true
  editorKey.value++
}

const handleMeetingSaved = async (meetingId) => {
  // Refresh meeting list
  await store.fetchMeetings()

  // Select the saved meeting
  selectedMeetingId.value = meetingId
  showEditor.value = true
  editorKey.value++
}

const handleEditorCancelled = () => {
  showEditor.value = false
  selectedMeetingId.value = null
}

const handleDeleteMeeting = (meetingId) => {
  meetingToDelete.value = meetingId
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  if (!meetingToDelete.value) {
    return
  }

  deleting.value = true
  try {
    await store.deleteMeeting(meetingToDelete.value)

    // If we deleted the currently selected meeting, close the editor
    if (selectedMeetingId.value === meetingToDelete.value) {
      showEditor.value = false
      selectedMeetingId.value = null
    }

    deleteDialogVisible.value = false
    meetingToDelete.value = null
  } catch (error) {
    console.error('Failed to delete meeting:', error)
  } finally {
    deleting.value = false
  }
}

const handleSearch = (query) => {
  // Search is handled by the store's filteredMeetings computed property
  // The MeetingList component already filters locally, but we could
  // add server-side search here if needed
  console.log('Search query:', query)
}

const initializeData = async () => {
  try {
    initialLoading.value = true

    // Load all necessary data in parallel
    await Promise.all([
      store.fetchMeetings(),
      store.fetchParticipants(),
      store.fetchCountryConfigs()
    ])
  } catch (error) {
    console.error('Failed to initialize scheduling view:', error)
    store.error = 'Failed to load scheduling data. Please refresh the page.'
  } finally {
    initialLoading.value = false
  }
}

onMounted(async () => {
  await initializeData()
})
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Meeting Scheduler</h1>
      <p class="text-gray-600">Schedule international meetings with optimal timezone equity</p>
    </div>

    <!-- Loading State -->
    <div v-if="initialLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <ProgressSpinner style="width: 60px; height: 60px" />
        <p class="text-gray-500 mt-4">Loading scheduling assistant...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
      <!-- Left Panel: Meeting List (1/3 width on large screens) -->
      <div class="lg:col-span-1 overflow-auto">
        <MeetingList
          :meetings="store.filteredMeetings"
          :loading="store.loading"
          :selected-id="selectedMeetingId"
          @select="handleSelectMeeting"
          @create="handleCreateMeeting"
          @delete="handleDeleteMeeting"
          @search="handleSearch"
        />
      </div>

      <!-- Right Panel: Meeting Editor (2/3 width on large screens) -->
      <div class="lg:col-span-2 overflow-auto">
        <div v-if="showEditor" class="h-full">
          <MeetingEditor
            :key="editorKey"
            :meeting-id="selectedMeetingId"
            @saved="handleMeetingSaved"
            @cancelled="handleEditorCancelled"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="h-full flex items-center justify-center">
          <div class="text-center max-w-md">
            <i class="pi pi-calendar-plus text-8xl text-gray-300 mb-6"></i>
            <h2 class="text-2xl font-semibold text-gray-700 mb-3">Welcome to Meeting Scheduler</h2>
            <p class="text-gray-500 mb-6">
              Select a meeting from the list or create a new one to get started. Our intelligent
              scheduling assistant helps you find optimal meeting times across international
              timezones with color-coded equity scores.
            </p>
            <Button
              label="Create Your First Meeting"
              icon="pi pi-plus"
              size="large"
              @click="handleCreateMeeting"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Delete Meeting"
      :modal="true"
      :closable="true"
      style="width: 400px"
    >
      <div class="flex items-start space-x-3">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
        <div>
          <p class="mb-2">Are you sure you want to delete this meeting?</p>
          <p class="text-sm text-gray-500">This action cannot be undone.</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <Button label="Cancel" severity="secondary" text @click="deleteDialogVisible = false" />
          <Button label="Delete" severity="danger" :loading="deleting" @click="confirmDelete" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
