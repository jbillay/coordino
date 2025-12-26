<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSchedulingStore } from '../store'
import { useActivityStore } from '@/stores/activity'
import EquityScoreCard from '../components/EquityScoreCard.vue'
import ParticipantBreakdown from '../components/ParticipantBreakdown.vue'
import TimezoneGrid from '../components/TimezoneGrid.vue'
import ParticipantList from '../components/ParticipantList.vue'
import TimeHeatmap from '../components/TimeHeatmap.vue'
import OptimalTimeSuggestions from '../components/OptimalTimeSuggestions.vue'
import HolidayAlert from '../components/HolidayAlert.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { format } from 'date-fns'

const route = useRoute()
const router = useRouter()
const store = useSchedulingStore()
const activityStore = useActivityStore()
const toast = useToast()

// State
const editMode = ref(false)
const editDate = ref(null)
const editTime = ref(null)
const showAddParticipantDialog = ref(false)
const deleteDialogVisible = ref(false)
const heatmapLoading = ref(false)
const screenReaderMessage = ref('')

// Computed - Available participants to add
const availableParticipants = computed(() => {
  if (!store.currentMeeting?.participants) {
    return store.participants
  }

  const currentIds = new Set(store.currentMeeting.participants.map((p) => p.id))
  return store.participants.filter((p) => !currentIds.has(p.id))
})

// Computed - Current hour from meeting time
const currentHour = computed(() => {
  if (!store.currentMeeting?.proposed_time) {
    return null
  }
  return new Date(store.currentMeeting.proposed_time).getUTCHours()
})

// Format helpers
function formatDateTime(isoString) {
  return format(new Date(isoString), 'EEEE, MMMM dd, yyyy - h:mm a')
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// Edit mode - Update proposed time instantly (FR-019, T052)
function updateProposedTime() {
  if (!editDate.value || !editTime.value) {
    return
  }

  const proposedDate = new Date(editDate.value)
  const proposedTime = new Date(editTime.value)

  proposedDate.setHours(proposedTime.getHours())
  proposedDate.setMinutes(proposedTime.getMinutes())
  proposedDate.setSeconds(0)
  proposedDate.setMilliseconds(0)

  // Update current meeting's proposed time for instant recalculation
  store.currentMeeting.proposed_time = proposedDate.toISOString()
}

function cancelEdit() {
  editMode.value = false
  // Reset to original time
  const originalTime = new Date(store.currentMeeting.proposed_time)
  editDate.value = originalTime
  editTime.value = originalTime
}

async function saveMeetingUpdate() {
  try {
    await store.updateMeeting(store.currentMeeting.id, {
      proposed_time: store.currentMeeting.proposed_time
    })

    toast.add({
      severity: 'success',
      summary: 'Updated',
      detail: 'Meeting time updated successfully',
      life: 3000
    })

    editMode.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to update meeting',
      life: 5000
    })
  }
}

// Add participant to meeting
async function addParticipantToMeeting(participant) {
  try {
    await store.addParticipantToMeeting(store.currentMeeting.id, participant.id)

    toast.add({
      severity: 'success',
      summary: 'Added',
      detail: `${participant.name} added to meeting`,
      life: 3000
    })

    showAddParticipantDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to add participant',
      life: 5000
    })
  }
}

// Remove participant from meeting
async function removeParticipantFromMeeting(participant) {
  try {
    await store.removeParticipantFromMeeting(store.currentMeeting.id, participant.id)

    toast.add({
      severity: 'success',
      summary: 'Removed',
      detail: `${participant.name} removed from meeting`,
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to remove participant',
      life: 5000
    })
  }
}

// Heatmap hour selection (US2 - T072, FR-030)
function handleHourSelection(hour) {
  // Create new date with selected hour
  const currentDate = new Date(store.currentMeeting.proposed_time)
  currentDate.setUTCHours(hour, 0, 0, 0)

  // Update meeting time
  store.currentMeeting.proposed_time = currentDate.toISOString()

  // Update edit fields if in edit mode
  editDate.value = currentDate
  editTime.value = currentDate

  // Announce to screen readers
  screenReaderMessage.value = `Selected ${formatHour(hour)} UTC. Equity score updated.`

  // Toast notification
  toast.add({
    severity: 'info',
    summary: 'Time Updated',
    detail: `Meeting time set to ${formatHour(hour)} UTC`,
    life: 3000
  })
}

// Optimal time suggestion selection (US2 - T074, FR-029)
function handleTimeSelection(suggestion) {
  // Update meeting time using the suggestion's ISO timestamp
  store.currentMeeting.proposed_time = suggestion.meetingTime

  // Update edit fields
  const newTime = new Date(suggestion.meetingTime)
  editDate.value = newTime
  editTime.value = newTime

  // Announce to screen readers
  screenReaderMessage.value = `Selected optimal time: ${formatHour(suggestion.hour)} UTC with equity score ${Math.round(suggestion.score)}`

  // Toast notification
  toast.add({
    severity: 'success',
    summary: 'Optimal Time Selected',
    detail: `Meeting set to ${formatHour(suggestion.hour)} UTC (Score: ${Math.round(suggestion.score)}/100)`,
    life: 4000
  })
}

// Format hour for messages
function formatHour(hour) {
  if (hour === 0) {
    return '12:00 AM'
  }
  if (hour < 12) {
    return `${hour}:00 AM`
  }
  if (hour === 12) {
    return '12:00 PM'
  }
  return `${hour - 12}:00 PM`
}

// Delete meeting
function confirmDelete() {
  deleteDialogVisible.value = true
}

async function deleteMeeting() {
  try {
    await store.deleteMeeting(store.currentMeeting.id)

    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Meeting deleted successfully',
      life: 3000
    })

    router.push('/scheduling')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to delete meeting',
      life: 5000
    })
  }
}

// Load meeting on mount
onMounted(async () => {
  const meetingId = route.params.id

  try {
    await store.fetchParticipants()
    await store.fetchMeeting(meetingId)

    // Track activity
    activityStore.trackActivity('meeting', store.currentMeeting.id, store.currentMeeting.title, {
      participantCount: store.currentMeeting.participants?.length || 0,
      proposedTime: store.currentMeeting.proposed_time
    })

    // Initialize edit fields
    const currentTime = new Date(store.currentMeeting.proposed_time)
    editDate.value = currentTime
    editTime.value = currentTime
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to load meeting: ${error.message}`,
      life: 5000
    })
    router.push('/scheduling')
  }
})
</script>

<template>
  <div class="meeting-detail-view">
    <div v-if="store.loading && !store.currentMeeting" class="loading-state">
      <ProgressSpinner />
      <p>Loading meeting details...</p>
    </div>

    <div v-else-if="store.currentMeeting" class="meeting-content">
      <!-- Header -->
      <div class="view-header">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          aria-label="Back to meetings"
          class="back-button"
          @click="router.push('/scheduling')"
        />
        <div class="header-content">
          <h1 class="meeting-title">{{ store.currentMeeting.title }}</h1>
          <div class="meeting-meta">
            <Tag :value="formatDateTime(store.currentMeeting.proposed_time)" severity="secondary" />
            <Tag
              :value="formatDuration(store.currentMeeting.duration_minutes)"
              severity="secondary"
            />
          </div>
        </div>
        <div class="header-actions">
          <Button
            label="Edit"
            icon="pi pi-pencil"
            severity="secondary"
            @click="editMode = !editMode"
          />
          <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDelete" />
        </div>
      </div>

      <!-- Time Adjustment Panel (T052: Instant updates) -->
      <Card v-if="editMode" class="edit-card">
        <template #title>Adjust Meeting Time</template>
        <template #content>
          <div class="time-controls">
            <div class="control-field">
              <label for="edit-date">Date</label>
              <DatePicker
                id="edit-date"
                v-model="editDate"
                date-format="yy-mm-dd"
                @update:model-value="updateProposedTime"
              />
            </div>
            <div class="control-field">
              <label for="edit-time">Time</label>
              <DatePicker
                id="edit-time"
                v-model="editTime"
                time-only
                :step-minute="15"
                hour-format="24"
                @update:model-value="updateProposedTime"
              />
            </div>
            <div class="control-actions">
              <Button
                label="Save Changes"
                icon="pi pi-check"
                :loading="store.loading"
                @click="saveMeetingUpdate"
              />
              <Button label="Cancel" icon="pi pi-times" severity="secondary" @click="cancelEdit" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Equity Score and Participant Breakdown Row -->
      <div class="equity-section">
        <EquityScoreCard :score="store.equityScore?.score || null" />
        <ParticipantBreakdown :breakdown="store.equityScore" />
      </div>

      <!-- Participant Details Table -->
      <Card class="list-card">
        <template #title>
          <div class="card-title-row">
            <span>Participant Details</span>
            <Button
              label="Add Participant"
              icon="pi pi-plus"
              size="small"
              @click="showAddParticipantDialog = true"
            />
          </div>
        </template>
        <template #content>
          <ParticipantList
            :participants="store.participantsWithStatus"
            :loading="store.loading"
            :show-actions="true"
            @delete="removeParticipantFromMeeting"
          />
        </template>
      </Card>

      <!-- Optimal Time Suggestions (US2 - T073, T074, T076) -->
      <Card
        v-if="store.currentMeeting.participants && store.currentMeeting.participants.length > 0"
        class="suggestions-card"
      >
        <template #title>Optimal Time Suggestions</template>
        <template #content>
          <div v-if="heatmapLoading" class="heatmap-loading">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p>Calculating optimal times...</p>
          </div>
          <OptimalTimeSuggestions
            v-else
            :suggestions="store.topSuggestions"
            :current-hour="currentHour"
            @time-selected="handleTimeSelection"
          />
        </template>
      </Card>

      <!-- Time Heatmap (US2 - T070, T071, T072, T077) -->
      <Card
        v-if="store.currentMeeting.participants && store.currentMeeting.participants.length > 0"
        class="heatmap-card"
      >
        <template #title>24-Hour Availability Heatmap</template>
        <template #content>
          <div v-if="heatmapLoading" class="heatmap-loading">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p>Generating heatmap...</p>
          </div>
          <TimeHeatmap
            v-else
            :heatmap-data="store.heatmapData"
            :current-hour="currentHour"
            @hour-selected="handleHourSelection"
          />
        </template>
      </Card>

      <!-- Screen reader announcements (T080) -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {{ screenReaderMessage }}
      </div>

      <!-- Timezone Grid -->
      <Card class="grid-card">
        <template #title>Participant Timezone Analysis</template>
        <template #content>
          <TimezoneGrid :participants="store.participantsWithStatus" />
        </template>
      </Card>

      <!-- Holiday API Failure Notification (US3 - T100) -->
      <Message v-if="store.holidaysFetchError" severity="warn" :closable="true">
        <div class="api-failure-message">
          <strong>Holiday Data Unavailable</strong>
          <p>
            Unable to fetch holiday information from the external API. Holiday conflicts may not be
            detected. The app will continue to work but won't warn about national holidays.
          </p>
          <small>
            Cached data may be used if available. Please check manually for any holiday conflicts in
            your participants' countries.
          </small>
        </div>
      </Message>

      <!-- Holiday Alert (US3 - T099) -->
      <HolidayAlert
        :participants="store.participantsWithStatus"
        :suggestions="store.topSuggestions"
      />

      <!-- Meeting Notes -->
      <Card v-if="store.currentMeeting.notes" class="notes-card">
        <template #title>Notes</template>
        <template #content>
          <p class="meeting-notes">{{ store.currentMeeting.notes }}</p>
        </template>
      </Card>
    </div>

    <!-- Add Participant Dialog -->
    <Dialog
      v-model:visible="showAddParticipantDialog"
      header="Add Participant to Meeting"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="add-participant-content">
        <div v-if="availableParticipants.length > 0" class="participant-select-list">
          <div
            v-for="participant in availableParticipants"
            :key="participant.id"
            class="participant-option"
            @click="addParticipantToMeeting(participant)"
          >
            <div class="participant-info">
              <span class="participant-name">{{ participant.name }}</span>
              <span class="participant-timezone">{{ participant.timezone }}</span>
            </div>
            <Button icon="pi pi-plus" text rounded severity="success" />
          </div>
        </div>
        <div v-else class="empty-participants">
          <p>All participants have been added to this meeting.</p>
        </div>
      </div>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Confirm Delete Meeting"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
        <p>Are you sure you want to delete this meeting?</p>
        <p class="font-medium mt-2">{{ store.currentMeeting?.title }}</p>
        <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="deleteDialogVisible = false" />
        <Button label="Delete" severity="danger" @click="deleteMeeting" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.meeting-detail-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.view-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-content {
  flex: 1;
}

.meeting-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--p-text-color);
}

.meeting-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-card {
  margin-bottom: 2rem;
}

.time-controls {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

@media (max-width: 768px) {
  .time-controls {
    grid-template-columns: 1fr;
  }
}

.control-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-field label {
  font-weight: 500;
  font-size: 0.875rem;
}

.control-actions {
  display: flex;
  gap: 0.5rem;
}

.equity-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 1024px) {
  .equity-section {
    grid-template-columns: 1fr;
  }
}

.grid-card,
.list-card,
.notes-card {
  margin-bottom: 2rem;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.meeting-notes {
  white-space: pre-wrap;
  line-height: 1.6;
}

.add-participant-content {
  padding: 1rem 0;
}

.participant-select-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.participant-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.participant-option:hover {
  background: var(--p-surface-50);
  border-color: var(--p-primary-color);
}

.participant-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.participant-name {
  font-weight: 500;
}

.participant-timezone {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.empty-participants {
  text-align: center;
  padding: 2rem;
  color: var(--p-text-muted-color);
}

.confirmation-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
}

/* Accessibility */
:deep(button:focus-visible),
:deep(input:focus-visible),
.participant-option:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .participant-option {
    transition: none;
  }
}

/* Heatmap and suggestions styling */
.suggestions-card,
.heatmap-card {
  margin-bottom: 2rem;
}

.heatmap-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
