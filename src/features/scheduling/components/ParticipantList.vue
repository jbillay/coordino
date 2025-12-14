<script setup>
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import { DEFAULT_CONFIG } from '../utils'

defineProps({
  participants: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'delete'])

const defaultConfig = DEFAULT_CONFIG

// Get status label for display
function getStatusLabel(status) {
  const labels = {
    green: 'Optimal',
    orange: 'Acceptable',
    red: 'Poor',
    critical: 'Critical'
  }
  return labels[status] || status
}

// Map status to PrimeVue Badge severity (T044)
function getStatusSeverity(status) {
  const severityMap = {
    green: 'success',
    orange: 'warn',
    red: 'danger',
    critical: 'danger'
  }
  return severityMap[status] || 'secondary'
}

// Format working hours for display (FR-043)
function formatWorkingHours(config) {
  return `${config.green_start} - ${config.green_end}`
}
</script>

<template>
  <div class="participant-list">
    <DataTable
      :value="participants"
      :loading="loading"
      striped-rows
      show-gridlines
      responsive-layout="scroll"
      data-key="id"
    >
      <Column field="name" header="Name" :sortable="true">
        <template #body="{ data }">
          <span class="font-medium">{{ data.name }}</span>
        </template>
      </Column>

      <Column field="timezone" header="Location (Timezone)" :sortable="true">
        <template #body="{ data }">
          {{ data.timezone }}
        </template>
      </Column>

      <Column field="offset" header="Timezone Offset" :sortable="true">
        <template #body="{ data }">
          <span class="font-mono text-sm">{{ data.offset }}</span>
        </template>
      </Column>

      <Column field="formattedTime" header="Local Time">
        <template #body="{ data }">
          <span class="font-medium">{{ data.formattedTime }}</span>
        </template>
      </Column>

      <Column field="status" header="Status" :sortable="true">
        <template #body="{ data }">
          <div class="status-cell">
            <Badge :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)">
              <template #default>
                <div class="badge-content">
                  <i v-if="data.status === 'critical'" class="pi pi-exclamation-triangle mr-1"></i>
                  <i v-else-if="data.status === 'red'" class="pi pi-times-circle mr-1"></i>
                  <i v-else-if="data.status === 'orange'" class="pi pi-exclamation-circle mr-1"></i>
                  <i v-else-if="data.status === 'green'" class="pi pi-check-circle mr-1"></i>
                  <span>{{ getStatusLabel(data.status) }}</span>
                </div>
              </template>
            </Badge>
            <div v-if="data.statusReason" class="status-reason">
              <i class="pi pi-info-circle text-xs"></i>
              <span>{{ data.statusReason }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column header="Working Hours">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">
            {{ formatWorkingHours(data.config || defaultConfig) }}
          </span>
        </template>
      </Column>

      <Column v-if="showActions" header="Actions">
        <template #body="{ data }">
          <div class="action-buttons">
            <Button
              icon="pi pi-pencil"
              size="small"
              text
              rounded
              severity="secondary"
              aria-label="Edit participant"
              @click="$emit('edit', data)"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              text
              rounded
              severity="danger"
              aria-label="Delete participant"
              @click="$emit('delete', data)"
            />
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="empty-message">
          No participants added yet. Add participants to see timezone impact.
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.participant-list {
  width: 100%;
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.badge-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-reason {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  max-width: fit-content;
}

.status-reason i {
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--p-text-muted-color);
}

/* Accessibility: Focus indicators (T057) */
:deep(button:focus-visible) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

:deep(th) {
  font-weight: 600;
}
</style>
