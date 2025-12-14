<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSchedulingStore } from '../store'
import MeetingForm from '../components/MeetingForm.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const store = useSchedulingStore()
const toast = useToast()

// State
const selectedParticipants = ref([])
const createdMeetingId = ref(null)

// Available participants (not yet selected)
const availableParticipants = computed(() => {
  const selectedIds = new Set(selectedParticipants.value.map((p) => p.id))
  return store.participants.filter((p) => !selectedIds.has(p.id))
})

// Add participant to selection
function addParticipant(participant) {
  // Check max participants limit (FR-010a)
  if (selectedParticipants.value.length >= 50) {
    toast.add({
      severity: 'warn',
      summary: 'Limit Reached',
      detail: 'Maximum of 50 participants per meeting',
      life: 3000
    })
    return
  }

  selectedParticipants.value.push(participant)
}

// Remove participant from selection
function removeParticipant(participant) {
  const index = selectedParticipants.value.findIndex((p) => p.id === participant.id)
  if (index !== -1) {
    selectedParticipants.value.splice(index, 1)
  }
}

// Navigate to participant management
function navigateToParticipants() {
  router.push('/scheduling/participants')
}

// Handle meeting creation
async function handleCreateMeeting(meetingData) {
  try {
    // Create meeting
    const meeting = await store.createMeeting(meetingData)
    createdMeetingId.value = meeting.id

    // Add participants to meeting
    if (selectedParticipants.value.length > 0) {
      for (const participant of selectedParticipants.value) {
        await store.addParticipantToMeeting(meeting.id, participant.id)
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Meeting created successfully',
      life: 3000
    })

    // Navigate to meeting detail view
    router.push(`/scheduling/${meeting.id}`)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to create meeting',
      life: 5000
    })
  }
}

// Load participants on mount
onMounted(async () => {
  try {
    await store.fetchParticipants()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to load participants: ${error.message}}`,
      life: 5000
    })
  }
})
</script>

<template>
  <div class="create-meeting-view">
    <div class="view-header">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        aria-label="Go back"
        class="back-button"
        @click="router.back()"
      />
      <h1 class="page-title">Create Meeting</h1>
    </div>

    <div class="content-grid">
      <!-- Meeting Form Section -->
      <Card class="form-card">
        <template #title>Meeting Details</template>
        <template #content>
          <MeetingForm
            :loading="store.loading"
            submit-label="Create Meeting"
            @submit="handleCreateMeeting"
            @cancel="router.back()"
          />
        </template>
      </Card>

      <!-- Participant Selection Section -->
      <Card class="participants-card">
        <template #title>
          <div class="card-title-row">
            <span>Add Participants</span>
            <Button
              label="Manage Participants"
              icon="pi pi-users"
              text
              size="small"
              @click="navigateToParticipants"
            />
          </div>
        </template>
        <template #content>
          <div class="participant-selection">
            <!-- Available participants -->
            <div v-if="availableParticipants.length > 0" class="participant-list">
              <p class="section-label">Available Participants</p>
              <div
                v-for="participant in availableParticipants"
                :key="participant.id"
                class="participant-item"
                @click="addParticipant(participant)"
              >
                <div class="participant-info">
                  <span class="participant-name">{{ participant.name }}</span>
                  <span class="participant-timezone">{{ participant.timezone }}</span>
                </div>
                <Button
                  icon="pi pi-plus"
                  size="small"
                  text
                  rounded
                  severity="success"
                  aria-label="Add participant"
                  @click.stop="addParticipant(participant)"
                />
              </div>
            </div>

            <Divider v-if="selectedParticipants.length > 0 && availableParticipants.length > 0" />

            <!-- Selected participants -->
            <div v-if="selectedParticipants.length > 0" class="selected-participants">
              <p class="section-label">
                Selected Participants ({{ selectedParticipants.length }}/50)
              </p>
              <div
                v-for="participant in selectedParticipants"
                :key="participant.id"
                class="participant-item selected"
              >
                <div class="participant-info">
                  <span class="participant-name">{{ participant.name }}</span>
                  <span class="participant-timezone">{{ participant.timezone }}</span>
                </div>
                <Button
                  icon="pi pi-times"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  aria-label="Remove participant"
                  @click="removeParticipant(participant)"
                />
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="store.participants.length === 0" class="empty-state">
              <i class="pi pi-users text-4xl text-gray-400 mb-3"></i>
              <p class="text-gray-600 mb-2">No participants available</p>
              <Button
                label="Add Your First Participant"
                icon="pi pi-plus"
                @click="navigateToParticipants"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.create-meeting-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--p-text-color);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.participant-selection {
  max-height: 600px;
  overflow-y: auto;
}

.section-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.participant-list,
.selected-participants {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.participant-item:hover {
  background: var(--p-surface-50);
  border-color: var(--p-primary-color);
}

.participant-item.selected {
  background: var(--p-primary-50);
  border-color: var(--p-primary-200);
  cursor: default;
}

.participant-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.participant-name {
  font-weight: 500;
  color: var(--p-text-color);
}

.participant-timezone {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

/* Accessibility: Focus indicators */
:deep(button:focus-visible),
.participant-item:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .participant-item {
    transition: none;
  }
}
</style>
