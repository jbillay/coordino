<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSchedulingStore } from '../store'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { format } from 'date-fns'

const router = useRouter()
const store = useSchedulingStore()

// State
const loading = ref(false)
const searchQuery = ref('')
const dateRange = ref(null)
const deleteDialogVisible = ref(false)
const meetingToDelete = ref(null)

// Computed - Filtered meetings (FR-006: search and filter)
const filteredMeetings = computed(() => {
  let meetings = [...store.meetings]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    meetings = meetings.filter((m) => m.title.toLowerCase().includes(query))
  }

  // Filter by date range
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    meetings = meetings.filter((m) => {
      const meetingDate = new Date(m.proposed_time)
      return meetingDate >= start && meetingDate <= end
    })
  }

  return meetings
})

// Format date and time for display
function formatDateTime(isoString) {
  return format(new Date(isoString), 'MMM dd, yyyy - h:mm a')
}

// Format duration in human-readable form
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
  }
  return `${mins}m`
}

// Navigation
function navigateToCreate() {
  router.push('/scheduling/create')
}

function navigateToConfig() {
  router.push('/scheduling/config')
}

function viewMeeting(id) {
  router.push(`/scheduling/${id}`)
}

function editMeeting(id) {
  router.push(`/scheduling/${id}`)
}

// Delete confirmation
function confirmDelete(meeting) {
  meetingToDelete.value = meeting
  deleteDialogVisible.value = true
}

async function deleteMeeting() {
  if (meetingToDelete.value) {
    try {
      await store.deleteMeeting(meetingToDelete.value.id)
      deleteDialogVisible.value = false
      meetingToDelete.value = null
    } catch (error) {
      console.error('Failed to delete meeting:', error)
    }
  }
}

// Load meetings on mount
onMounted(async () => {
  loading.value = true
  try {
    await store.fetchMeetings()
  } catch (error) {
    console.error('Failed to load meetings:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="meeting-list-view">
    <div class="view-header">
      <h1 class="page-title">Meetings</h1>
      <div class="header-actions">
        <Button
          label="Working Hours"
          icon="pi pi-cog"
          severity="secondary"
          outlined
          class="config-button"
          aria-label="Configure custom working hours"
          @click="navigateToConfig"
        />
        <Button
          label="New Meeting"
          icon="pi pi-plus"
          class="create-button"
          @click="navigateToCreate"
        />
      </div>
    </div>

    <Card class="filter-card">
      <template #content>
        <div class="filters">
          <div class="filter-field">
            <label for="search" class="filter-label">Search by title</label>
            <IconField class="w-full">
              <InputIcon class="pi pi-search" />
              <InputText
                id="search"
                v-model="searchQuery"
                placeholder="Search meetings..."
                class="w-full"
              />
            </IconField>
          </div>

          <div class="filter-field">
            <label for="dateRange" class="filter-label">Date range</label>
            <DatePicker
              id="dateRange"
              v-model="dateRange"
              selection-mode="range"
              :manual-input="false"
              placeholder="Select date range"
              class="w-full"
            />
          </div>
        </div>
      </template>
    </Card>

    <Card class="meetings-card">
      <template #content>
        <DataTable
          :value="filteredMeetings"
          :loading="loading"
          paginator
          :rows="10"
          striped-rows
          show-gridlines
          responsive-layout="scroll"
          data-key="id"
          :global-filter-fields="['title']"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-calendar text-6xl text-gray-300 mb-4"></i>
              <p class="text-lg text-gray-600 mb-2">No meetings found</p>
              <p class="text-sm text-gray-500">Create your first meeting to get started</p>
            </div>
          </template>

          <Column field="title" header="Meeting Title" :sortable="true">
            <template #body="{ data }">
              <span class="font-medium">{{ data.title }}</span>
            </template>
          </Column>

          <Column field="proposed_time" header="Date & Time" :sortable="true">
            <template #body="{ data }">
              {{ formatDateTime(data.proposed_time) }}
            </template>
          </Column>

          <Column field="duration_minutes" header="Duration" :sortable="true">
            <template #body="{ data }">
              {{ formatDuration(data.duration_minutes) }}
            </template>
          </Column>

          <Column field="participant_count" header="Participants">
            <template #body="{ data }">
              <Tag :value="`${data.participant_count || 0} participants`" severity="secondary" />
            </template>
          </Column>

          <Column header="Actions">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  v-tooltip="'View details'"
                  icon="pi pi-eye"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  aria-label="View meeting"
                  @click="viewMeeting(data.id)"
                />
                <Button
                  v-tooltip="'Edit'"
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  aria-label="Edit meeting"
                  @click="editMeeting(data.id)"
                />
                <Button
                  v-tooltip="'Delete'"
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  aria-label="Delete meeting"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Confirm Delete"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
        <p>Are you sure you want to delete this meeting?</p>
        <p class="font-medium mt-2">{{ meetingToDelete?.title }}</p>
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
.meeting-list-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--p-text-color);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filter-card {
  margin-bottom: 1.5rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.meetings-card {
  background: var(--p-surface-0);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.confirmation-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
}

/* Accessibility: Focus indicators */
:deep(button:focus-visible),
:deep(input:focus-visible) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
</style>
