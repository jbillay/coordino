<script setup>
import Badge from 'primevue/badge'
import { DEFAULT_CONFIG } from '../utils'

defineProps({
  participants: {
    type: Array,
    default: () => []
  }
})

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

// Map status to PrimeVue Badge severity
function getStatusSeverity(status) {
  const severityMap = {
    green: 'success',
    orange: 'warn',
    red: 'danger',
    critical: 'danger'
  }
  return severityMap[status] || 'secondary'
}

// Format working hours for display
function formatWorkingHours(config) {
  return `${config.green_start} - ${config.green_end}`
}
</script>

<template>
  <div class="timezone-grid">
    <h3 class="grid-title">Timezone Impact</h3>

    <div v-if="!participants || participants.length === 0" class="empty-state">
      <i class="pi pi-users text-4xl text-gray-400 mb-3"></i>
      <p class="text-gray-600">No participants added yet</p>
      <p class="text-sm text-gray-500">Add participants to see timezone impact analysis</p>
    </div>

    <div v-else class="grid-container">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="participant-card"
        :class="`status-${participant.status}`"
      >
        <div class="card-header">
          <h4 class="participant-name">{{ participant.name }}</h4>
          <Badge
            :value="getStatusLabel(participant.status)"
            :severity="getStatusSeverity(participant.status)"
          />
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-label">
              <i class="pi pi-map-marker mr-1"></i>
              Location
            </span>
            <span class="info-value">{{ participant.timezone }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">
              <i class="pi pi-clock mr-1"></i>
              Local Time
            </span>
            <span class="info-value font-medium">{{ participant.formattedTime }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">
              <i class="pi pi-globe mr-1"></i>
              Offset
            </span>
            <span class="info-value font-mono text-sm">{{ participant.offset }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">
              <i class="pi pi-calendar mr-1"></i>
              Working Hours
            </span>
            <span class="info-value text-sm">
              {{ formatWorkingHours(participant.config || defaultConfig) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timezone-grid {
  width: 100%;
}

.grid-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--p-text-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  border: 2px dashed var(--p-surface-border);
  border-radius: 8px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.participant-card {
  border: 2px solid var(--p-surface-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--p-surface-0);
  transition: all 0.2s ease;
}

/* Status-based border colors (WCAG 2.1 AA compliant contrast - T058) */
.participant-card.status-green {
  border-left: 4px solid var(--p-green-500);
}

.participant-card.status-orange {
  border-left: 4px solid var(--p-orange-500);
}

.participant-card.status-red {
  border-left: 4px solid var(--p-red-500);
}

.participant-card.status-critical {
  border-left: 4px solid var(--p-red-700);
  background: var(--p-red-50);
}

.participant-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Respect prefers-reduced-motion (T059) */
@media (prefers-reduced-motion: reduce) {
  .participant-card {
    transition: none;
  }

  .participant-card:hover {
    transform: none;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--p-surface-border);
}

.participant-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.info-label {
  color: var(--p-text-muted-color);
  display: flex;
  align-items: center;
}

.info-value {
  color: var(--p-text-color);
  text-align: right;
}
</style>
