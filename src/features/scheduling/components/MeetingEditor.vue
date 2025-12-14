<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { format } from 'date-fns'
import Card from 'primevue/card'
import Button from 'primevue/button'
import MeetingForm from './MeetingForm.vue'
import ParticipantList from './ParticipantList.vue'
import EquityScoreDisplay from './EquityScoreDisplay.vue'
import ParticipantDialog from './ParticipantDialog.vue'
import TimeSlotHeatmap from './TimeSlotHeatmap.vue'
import OptimalTimeSuggestions from './OptimalTimeSuggestions.vue'
import UnsavedChangesWarning from '@/components/common/UnsavedChangesWarning.vue'
import { useSchedulingStore } from '../store'
import { calculateEquityScore } from '../utils/equityScorer'

const props = defineProps({
  meetingId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['saved', 'cancelled'])

const store = useSchedulingStore()
const meetingFormRef = ref(null)
const localMeeting = ref({
  title: '',
  proposed_time: null,
  notes: ''
})

const selectedParticipants = ref([])
const participantDialogVisible = ref(false)
const editingParticipant = ref(null)
const savingParticipant = ref(false)
const showUnsavedWarning = ref(false)
const pendingNavigation = ref(null)
const showOptimalAnalysis = ref(false)

const isNewMeeting = computed(() => !props.meetingId)

const canSave = computed(
  () => localMeeting.value.title && localMeeting.value.proposed_time && !store.loading
)

const formatDate = (dateString) => {
  if (!dateString) {
    return ''
  }
  return format(new Date(dateString), 'MMM d, yyyy h:mm a')
}

const handleMeetingUpdate = async (updatedMeeting) => {
  localMeeting.value = { ...updatedMeeting }

  // Recalculate equity score when proposed time changes
  if (selectedParticipants.value.length > 0 && localMeeting.value.proposed_time) {
    const statuses = await store.calculateParticipantStatuses(
      selectedParticipants.value,
      localMeeting.value.proposed_time
    )
    store.participantStatuses = statuses
    const scoreResult = calculateEquityScore(statuses)
    store.equityScore = scoreResult
  }
}

const markDirty = () => {
  store.markDirty()
}

const handleSave = async () => {
  // Validate form
  if (meetingFormRef.value && !meetingFormRef.value.validate()) {
    return
  }

  try {
    let { meetingId } = props

    if (isNewMeeting.value) {
      // Create new meeting
      const newMeeting = await store.createMeeting({
        title: localMeeting.value.title,
        proposed_time: localMeeting.value.proposed_time,
        notes: localMeeting.value.notes
      })
      meetingId = newMeeting.id

      // Add participants to meeting
      for (const participant of selectedParticipants.value) {
        await store.addParticipantToMeeting(meetingId, participant.id)
      }
    } else {
      // Update existing meeting
      store.currentMeeting = {
        ...store.currentMeeting,
        title: localMeeting.value.title,
        proposed_time: localMeeting.value.proposed_time,
        notes: localMeeting.value.notes
      }
      await store.saveMeeting()

      // Sync participants (remove old, add new)
      const currentParticipantIds = selectedParticipants.value.map((p) => p.id)
      const originalParticipantIds = store.currentMeeting.participants?.map((p) => p.id) || []

      // Remove participants no longer in the list
      for (const oldId of originalParticipantIds) {
        if (!currentParticipantIds.includes(oldId)) {
          await store.removeParticipantFromMeeting(meetingId, oldId)
        }
      }

      // Add new participants
      for (const newId of currentParticipantIds) {
        if (!originalParticipantIds.includes(newId)) {
          await store.addParticipantToMeeting(meetingId, newId)
        }
      }
    }

    store.isDirty = false
    emit('saved', meetingId)
  } catch (error) {
    console.error('Failed to save meeting:', error)
  }
}

const handleCancel = () => {
  if (store.isDirty) {
    showUnsavedWarning.value = true
    pendingNavigation.value = 'cancel'
  } else {
    emit('cancelled')
  }
}

const handleSaveFromWarning = async () => {
  showUnsavedWarning.value = false
  await handleSave()
  if (pendingNavigation.value === 'cancel') {
    emit('cancelled')
  }
}

const handleDiscardChanges = () => {
  showUnsavedWarning.value = false
  store.isDirty = false
  emit('cancelled')
}

const handleCancelWarning = () => {
  showUnsavedWarning.value = false
  pendingNavigation.value = null
}

const showAddParticipantDialog = () => {
  editingParticipant.value = null
  participantDialogVisible.value = true
}

const handleSaveParticipant = async (participantData) => {
  savingParticipant.value = true
  try {
    if (participantData.id) {
      // Update existing participant
      await store.updateParticipant(participantData.id, participantData)
      const index = selectedParticipants.value.findIndex((p) => p.id === participantData.id)
      if (index !== -1) {
        selectedParticipants.value[index] = { ...participantData }
      }
    } else {
      // Create new participant
      const newParticipant = await store.addParticipant({
        name: participantData.name,
        country: participantData.country,
        timezone: participantData.timezone,
        notes: participantData.notes
      })
      selectedParticipants.value.push(newParticipant)
    }

    // Recalculate equity score
    if (localMeeting.value.proposed_time) {
      const statuses = await store.calculateParticipantStatuses(
        selectedParticipants.value,
        localMeeting.value.proposed_time
      )
      store.participantStatuses = statuses
      const scoreResult = calculateEquityScore(statuses)
      store.equityScore = scoreResult
    }

    markDirty()
    participantDialogVisible.value = false
  } catch (error) {
    console.error('Failed to save participant:', error)
  } finally {
    savingParticipant.value = false
  }
}

const handleRemoveParticipant = async (participantId) => {
  const index = selectedParticipants.value.findIndex((p) => p.id === participantId)
  if (index !== -1) {
    selectedParticipants.value.splice(index, 1)

    // Recalculate equity score
    if (localMeeting.value.proposed_time) {
      const statuses = await store.calculateParticipantStatuses(
        selectedParticipants.value,
        localMeeting.value.proposed_time
      )
      store.participantStatuses = statuses
      const scoreResult = calculateEquityScore(statuses)
      store.equityScore = scoreResult
    }

    markDirty()
  }
}

const loadMeeting = async () => {
  if (props.meetingId) {
    await store.fetchMeeting(props.meetingId)
    if (store.currentMeeting) {
      localMeeting.value = {
        title: store.currentMeeting.title,
        proposed_time: new Date(store.currentMeeting.proposed_time),
        notes: store.currentMeeting.notes || '',
        created_at: store.currentMeeting.created_at,
        updated_at: store.currentMeeting.updated_at
      }
      selectedParticipants.value = [...(store.currentMeeting.participants || [])]

      // Calculate initial equity score
      if (localMeeting.value.proposed_time) {
        const statuses = await store.calculateParticipantStatuses(
          selectedParticipants.value,
          localMeeting.value.proposed_time
        )
        store.participantStatuses = statuses
        const scoreResult = calculateEquityScore(statuses)
        store.equityScore = scoreResult
      }
    }
  } else {
    // New meeting - reset everything
    localMeeting.value = {
      title: '',
      proposed_time: null,
      notes: ''
    }
    selectedParticipants.value = []
    store.equityScore = null
    store.participantStatuses = []
  }

  store.isDirty = false
}

const topSuggestions = computed(() => {
  if (!store.heatmapData || store.heatmapData.length === 0) {
    return []
  }

  // Sort by score descending and get top 3
  return [...store.heatmapData].sort((a, b) => b.score - a.score).slice(0, 3)
})

const handleAnalyzeOptimalTimes = async () => {
  if (!localMeeting.value.proposed_time) {
    return
  }

  showOptimalAnalysis.value = true

  // Use the proposed time's date for analysis
  await store.generateOptimalTimeSlots(localMeeting.value.proposed_time, selectedParticipants.value)
}

const handleSuggestionSelected = async (suggestion) => {
  // Update the meeting time to the selected suggestion
  localMeeting.value.proposed_time = new Date(suggestion.datetime)

  // Recalculate equity score with new time
  if (selectedParticipants.value.length > 0) {
    const statuses = await store.calculateParticipantStatuses(
      selectedParticipants.value,
      localMeeting.value.proposed_time
    )
    store.participantStatuses = statuses
    const scoreResult = calculateEquityScore(statuses)
    store.equityScore = scoreResult
  }

  markDirty()
}

const handleSlotSelected = async (slot) => {
  // Update the meeting time to the selected slot
  localMeeting.value.proposed_time = new Date(slot.datetime)

  // Recalculate equity score with new time
  if (selectedParticipants.value.length > 0) {
    const statuses = await store.calculateParticipantStatuses(
      selectedParticipants.value,
      localMeeting.value.proposed_time
    )
    store.participantStatuses = statuses
    const scoreResult = calculateEquityScore(statuses)
    store.equityScore = scoreResult
  }

  markDirty()
}

watch(() => props.meetingId, loadMeeting)

onMounted(async () => {
  // Ensure participants are loaded
  if (store.participants.length === 0) {
    await store.fetchParticipants()
  }

  // Load meeting data
  await loadMeeting()
})
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 pb-4 border-b">
      <h2 class="text-2xl font-bold">
        {{ isNewMeeting ? 'New Meeting' : 'Edit Meeting' }}
      </h2>
      <div class="flex items-center space-x-2">
        <Button label="Cancel" icon="pi pi-times" severity="secondary" text @click="handleCancel" />
        <Button
          label="Save"
          icon="pi pi-save"
          :loading="store.loading"
          :disabled="!canSave"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Content Grid -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
      <!-- Left Column: Meeting Details -->
      <div class="space-y-6">
        <!-- Meeting Form -->
        <Card>
          <template #title>
            <h3 class="text-lg font-semibold">Meeting Details</h3>
          </template>
          <template #content>
            <MeetingForm
              ref="meetingFormRef"
              :meeting="localMeeting"
              @update:meeting="handleMeetingUpdate"
              @input="markDirty"
            />
          </template>
        </Card>

        <!-- Participants -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Participants</h3>
              <Button
                label="Add"
                icon="pi pi-plus"
                size="small"
                @click="showAddParticipantDialog"
              />
            </div>
          </template>
          <template #content>
            <ParticipantList
              :participants="selectedParticipants"
              :participant-statuses="store.participantStatuses"
              :removable="true"
              @add="showAddParticipantDialog"
              @remove="handleRemoveParticipant"
            />
          </template>
        </Card>
      </div>

      <!-- Right Column: Equity Score and Analysis -->
      <div class="space-y-6">
        <EquityScoreDisplay
          :score="store.equityScore?.score || null"
          :breakdown="store.equityScore"
        />

        <!-- Meeting Summary -->
        <Card v-if="!isNewMeeting">
          <template #title>
            <h3 class="text-lg font-semibold">Meeting Summary</h3>
          </template>
          <template #content>
            <div class="space-y-3 text-sm">
              <div class="flex items-center space-x-2">
                <i class="pi pi-calendar text-gray-500"></i>
                <span class="font-medium">Created:</span>
                <span>{{ formatDate(localMeeting.created_at) }}</span>
              </div>
              <div v-if="localMeeting.updated_at" class="flex items-center space-x-2">
                <i class="pi pi-clock text-gray-500"></i>
                <span class="font-medium">Last Updated:</span>
                <span>{{ formatDate(localMeeting.updated_at) }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <i class="pi pi-users text-gray-500"></i>
                <span class="font-medium">Participants:</span>
                <span>{{ selectedParticipants.length }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Optimal Time Analysis Section -->
    <div v-if="selectedParticipants.length > 0 && localMeeting.proposed_time" class="mt-6">
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Optimal Time Analysis</h3>
            <Button
              label="Analyze Times"
              icon="pi pi-chart-bar"
              :loading="store.loadingSuggestions"
              @click="handleAnalyzeOptimalTimes"
            />
          </div>
        </template>
        <template #content>
          <div v-if="showOptimalAnalysis" class="space-y-6">
            <!-- Top 3 Suggestions -->
            <OptimalTimeSuggestions
              :suggestions="topSuggestions"
              :loading="store.loadingSuggestions"
              :show-details="true"
              @suggestion-selected="handleSuggestionSelected"
            />

            <!-- Heatmap -->
            <div class="border-t pt-6">
              <TimeSlotHeatmap
                :slots="store.heatmapData"
                :loading="store.loadingSuggestions"
                @slot-selected="handleSlotSelected"
              />
            </div>
          </div>
          <div v-else class="text-center p-4 text-gray-500">
            <p>
              Click "Analyze Times" to see optimal meeting time suggestions and a 24-hour heatmap.
            </p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Participant Dialog -->
    <ParticipantDialog
      v-model:visible="participantDialogVisible"
      :participant="editingParticipant"
      :saving="savingParticipant"
      @save="handleSaveParticipant"
    />

    <!-- Unsaved Changes Warning -->
    <UnsavedChangesWarning
      :show="showUnsavedWarning"
      @save="handleSaveFromWarning"
      @discard="handleDiscardChanges"
      @cancel="handleCancelWarning"
    />
  </div>
</template>
