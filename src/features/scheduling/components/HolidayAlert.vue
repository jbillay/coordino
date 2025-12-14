<script setup>
import { computed } from 'vue'
import Message from 'primevue/message'

const props = defineProps({
  participants: {
    type: Array,
    required: false,
    default: () => []
  },
  suggestions: {
    type: Array,
    default: () => []
  }
})

// Get participants with critical status
const criticalParticipants = computed(() =>
  props.participants.filter((p) => p.status === 'critical')
)

// Get participants specifically affected by holidays
const holidayParticipants = computed(() =>
  criticalParticipants.value.filter((p) => p.statusReason && p.statusReason.includes('Holiday'))
)

// Count of critical participants
const criticalCount = computed(() => criticalParticipants.value.length)

// Check if there are any critical participants
const hasCriticalParticipants = computed(() => criticalCount.value > 0)

// Get unique holiday names
const holidayNames = computed(() => {
  const names = holidayParticipants.value
    .map((p) => {
      const match = p.statusReason.match(/Holiday: (.+)/)
      return match ? match[1] : null
    })
    .filter(Boolean)

  return [...new Set(names)].join(', ')
})
</script>

<template>
  <div v-if="hasCriticalParticipants" class="holiday-alert" role="alert">
    <Message severity="error" :closable="false">
      <template #icon>
        <i class="pi pi-exclamation-triangle text-2xl"></i>
      </template>
      <div class="alert-content">
        <h4 class="alert-title">Critical Scheduling Conflict Detected</h4>
        <p class="alert-description">
          The proposed meeting time conflicts with holidays or non-working days for
          {{ criticalCount }} participant{{ criticalCount > 1 ? 's' : '' }}.
        </p>

        <div class="affected-participants">
          <strong>Affected Participants:</strong>
          <ul class="participant-list">
            <li
              v-for="participant in criticalParticipants"
              :key="participant.id"
              class="participant-item"
            >
              <i class="pi pi-ban text-red-800"></i>
              <span class="participant-name">{{ participant.name }}</span>
              <span class="participant-reason">({{ participant.statusReason }})</span>
            </li>
          </ul>
        </div>

        <div v-if="suggestions.length > 0" class="suggestions">
          <strong>Suggested Actions:</strong>
          <ul class="action-list">
            <li>Review the optimal time suggestions below for better alternatives</li>
            <li>Consider using the 24-hour heatmap to find a more equitable time</li>
            <li v-if="holidayParticipants.length > 0">Reschedule to avoid: {{ holidayNames }}</li>
          </ul>
        </div>
      </div>
    </Message>
  </div>
</template>

<style scoped>
.holiday-alert {
  margin-bottom: 1.5rem;
}

.alert-content {
  width: 100%;
}

.alert-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #991b1b;
}

.alert-description {
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.affected-participants,
.suggestions {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(254, 226, 226, 0.5);
  border-radius: 0.375rem;
}

.affected-participants strong,
.suggestions strong {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #991b1b;
}

.participant-list,
.action-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin: 0.25rem 0;
  background: white;
  border-radius: 0.25rem;
}

.participant-name {
  font-weight: 500;
}

.participant-reason {
  color: #6b7280;
  font-size: 0.875rem;
}

.action-list li {
  padding: 0.375rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.action-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: #991b1b;
  font-weight: bold;
}

/* Accessibility */
:deep(.p-message) {
  border-width: 2px;
}
</style>
