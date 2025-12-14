<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'

defineProps({
  configurations: {
    type: Array,
    required: false,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete'])

// Delete confirmation state
const deleteDialogVisible = ref(false)
const deleteTarget = ref(null)
const deleteLoading = ref(false)

// Country mapping (matching CountryConfigForm)
const countryMap = {
  US: 'United States',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  AU: 'Australia',
  CA: 'Canada',
  BR: 'Brazil',
  MX: 'Mexico',
  RU: 'Russia',
  KR: 'South Korea'
}

// Country flag emoji mapping
const flagMap = {
  US: '🇺🇸',
  GB: '🇬🇧',
  FR: '🇫🇷',
  DE: '🇩🇪',
  ES: '🇪🇸',
  IT: '🇮🇹',
  JP: '🇯🇵',
  CN: '🇨🇳',
  IN: '🇮🇳',
  AU: '🇦🇺',
  CA: '🇨🇦',
  BR: '🇧🇷',
  MX: '🇲🇽',
  RU: '🇷🇺',
  KR: '🇰🇷'
}

function getCountryName(code) {
  return countryMap[code] || code
}

function getCountryFlag(code) {
  return flagMap[code] || '🌍'
}

function formatWorkDays(days) {
  if (!days || days.length === 0) {
    return 'None'
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const sortedDays = [...days].sort((a, b) => a - b)

  return sortedDays.map((day) => dayNames[day - 1]).join(', ')
}

function confirmDelete(config) {
  deleteTarget.value = config
  deleteDialogVisible.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) {
    return
  }

  deleteLoading.value = true
  try {
    emit('delete', deleteTarget.value.id)
    // Dialog will be closed by parent after successful deletion
  } finally {
    // Keep loading state; parent will reset via success/error handler
  }
}

// Expose method for parent to close dialog after successful deletion
defineExpose({
  closeDeleteDialog() {
    deleteDialogVisible.value = false
    deleteTarget.value = null
    deleteLoading.value = false
  }
})
</script>

<template>
  <div class="country-config-list">
    <DataTable
      :value="configurations"
      :loading="loading"
      striped-rows
      show-gridlines
      responsive-layout="scroll"
      data-key="id"
    >
      <template #empty>
        <div class="empty-message">
          <i class="pi pi-globe text-4xl text-gray-400"></i>
          <p class="text-gray-600">No custom working hours configured yet.</p>
          <p class="text-sm text-gray-500">
            Add a country configuration to customize working hours for specific regions.
          </p>
        </div>
      </template>

      <Column field="country_code" header="Country" :sortable="true">
        <template #body="{ data }">
          <div class="country-cell">
            <span class="country-flag">{{ getCountryFlag(data.country_code) }}</span>
            <span class="font-medium">{{ getCountryName(data.country_code) }}</span>
          </div>
        </template>
      </Column>

      <Column header="Optimal Hours" style="min-width: 150px">
        <template #body="{ data }">
          <div class="time-range green">
            <i class="pi pi-circle-fill"></i>
            <span>{{ data.green_start }} - {{ data.green_end }}</span>
          </div>
        </template>
      </Column>

      <Column header="Acceptable Hours" style="min-width: 200px">
        <template #body="{ data }">
          <div class="time-ranges">
            <div class="time-range orange">
              <i class="pi pi-circle-fill"></i>
              <span>{{ data.orange_morning_start }} - {{ data.orange_morning_end }}</span>
            </div>
            <div class="time-range orange">
              <i class="pi pi-circle-fill"></i>
              <span>{{ data.orange_evening_start }} - {{ data.orange_evening_end }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column header="Working Days" style="min-width: 200px">
        <template #body="{ data }">
          <div class="work-days">
            {{ formatWorkDays(data.work_days) }}
          </div>
        </template>
      </Column>

      <Column header="Actions" style="width: 120px">
        <template #body="{ data }">
          <div class="action-buttons">
            <Button
              icon="pi pi-pencil"
              size="small"
              text
              rounded
              severity="secondary"
              :aria-label="`Edit working hours for ${getCountryName(data.country_code)}`"
              @click="$emit('edit', data)"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              text
              rounded
              severity="danger"
              :aria-label="`Delete working hours for ${getCountryName(data.country_code)}`"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- T118: Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      header="Confirm Deletion"
      :style="{ width: '450px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
        <p class="mb-4">
          Are you sure you want to delete custom working hours for
          <strong>{{ deleteTarget ? getCountryName(deleteTarget.country_code) : '' }}</strong>
          ?
        </p>
        <Message severity="warn" :closable="false">
          Participants from
          {{ deleteTarget ? getCountryName(deleteTarget.country_code) : 'this country' }}
          will revert to default working hours (9:00-17:00).
        </Message>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          autofocus
          @click="deleteDialogVisible = false"
        />
        <Button
          label="Delete"
          severity="danger"
          :loading="deleteLoading"
          icon="pi pi-trash"
          @click="handleDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.country-config-list {
  width: 100%;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 0.5rem;
}

.country-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.country-flag {
  font-size: 1.25rem;
}

.time-ranges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.time-range.green i {
  color: var(--p-green-500);
  font-size: 0.5rem;
}

.time-range.orange i {
  color: var(--p-orange-500);
  font-size: 0.5rem;
}

.work-days {
  font-size: 0.875rem;
  color: var(--p-text-color);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.confirmation-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Accessibility: Focus indicators */
:deep(button:focus-visible) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
</style>
