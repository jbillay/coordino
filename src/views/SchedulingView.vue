<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import MeetingList from '@/features/scheduling/components/MeetingList.vue'
import MeetingEditor from '@/features/scheduling/components/MeetingEditor.vue'
import { useSchedulingStore } from '@/features/scheduling/store'
import { storeToRefs } from 'pinia'

const schedulingStore = useSchedulingStore()
const { meetings, loading, error } = storeToRefs(schedulingStore)

const selectedMeetingId = ref(null)
const isCreatingNew = ref(false)

onMounted(() => {
  schedulingStore.fetchMeetings()
})

const handleSelectMeeting = (meetingId) => {
  selectedMeetingId.value = meetingId
  isCreatingNew.value = false
}

const handleCreateMeeting = () => {
  selectedMeetingId.value = null
  isCreatingNew.value = true
}

const handleDeleteMeeting = async (meetingId) => {
  await schedulingStore.deleteMeeting(meetingId)
  if (selectedMeetingId.value === meetingId) {
    selectedMeetingId.value = null
  }
}

const handleSave = () => {
  selectedMeetingId.value = null
  isCreatingNew.value = false
  schedulingStore.fetchMeetings()
}

const handleCancel = () => {
  selectedMeetingId.value = null
  isCreatingNew.value = false
}

const editorMeetingId = computed(() => (isCreatingNew.value ? null : selectedMeetingId.value))

const showEditor = computed(() => isCreatingNew.value || selectedMeetingId.value !== null)
</script>

<template>
  <AppLayout>
    <div class="flex h-full">
      <!-- Left column: Meeting List -->
      <div class="w-1/3 h-full overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <MeetingList
          :meetings="meetings"
          :loading="loading"
          :selected-id="selectedMeetingId"
          @select="handleSelectMeeting"
          @create="handleCreateMeeting"
          @delete="handleDeleteMeeting"
          @search="schedulingStore.setSearchQuery"
        />
      </div>

      <!-- Right column: Meeting Editor or Placeholder -->
      <div class="w-2/3 h-full overflow-y-auto">
        <div v-if="showEditor" class="p-4 h-full">
          <MeetingEditor
            :key="editorMeetingId"
            :meeting-id="editorMeetingId"
            @save="handleSave"
            @cancel="handleCancel"
          />
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400"
        >
          <i class="pi pi-calendar-plus text-6xl mb-4"></i>
          <h2 class="text-2xl font-semibold mb-2">Select a meeting or create a new one</h2>
          <p>
            Choose a meeting from the list on the left to see its details, or click "New Meeting" to
            get started.
          </p>
        </div>
      </div>
    </div>
    <div v-if="error" class="absolute bottom-0 right-0 p-4 m-4 bg-red-500 text-white rounded-lg">
      <p>An error occurred: {{ error.message }}</p>
    </div>
  </AppLayout>
</template>
