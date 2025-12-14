<script setup>
import Button from 'primevue/button'

const props = defineProps({
  suggestions: {
    type: Array,
    required: false,
    default: () => []
  },
  currentHour: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['timeSelected'])

/**
 * Format hour in 12-hour format with AM/PM
 */
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

/**
 * Check if this hour is currently selected
 */
function isSelected(hour) {
  return props.currentHour === hour
}

/**
 * Emit time selection event with full suggestion data
 */
function selectTime(suggestion) {
  emit('timeSelected', {
    hour: suggestion.hour,
    meetingTime: suggestion.meetingTime,
    score: suggestion.score,
    breakdown: suggestion.breakdown
  })
}
</script>

<template>
  <div class="optimal-suggestions">
    <h3>Top 3 Optimal Times</h3>
    <p class="text-sm text-gray-600 mb-4">
      These are the best meeting times based on participant availability and working hours.
    </p>

    <div v-if="suggestions.length === 0" class="no-suggestions">
      <i class="pi pi-info-circle text-gray-400 text-2xl mb-2"></i>
      <p class="text-gray-500">No suggestions available. Add participants to see optimal times.</p>
    </div>

    <div v-else class="suggestions-list">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.hour"
        class="suggestion-card"
        :class="{ selected: isSelected(suggestion.hour) }"
      >
        <div class="suggestion-header">
          <div class="rank-badge">
            <span class="rank-number">{{ index + 1 }}</span>
          </div>
          <div class="time-info">
            <div class="time-label">{{ formatHour(suggestion.hour) }} UTC</div>
            <div class="score-info">
              <i class="pi pi-star-fill text-yellow-500"></i>
              <span class="font-semibold">{{ Math.round(suggestion.score) }}/100</span>
              <span class="text-sm text-gray-600">equity score</span>
            </div>
          </div>
        </div>

        <div class="breakdown">
          <div v-if="suggestion.breakdown.green" class="status-item status-green">
            <i class="pi pi-check-circle"></i>
            <span>{{ suggestion.breakdown.green }} optimal</span>
          </div>
          <div v-if="suggestion.breakdown.orange" class="status-item status-orange">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ suggestion.breakdown.orange }} acceptable</span>
          </div>
          <div v-if="suggestion.breakdown.red" class="status-item status-red">
            <i class="pi pi-times-circle"></i>
            <span>{{ suggestion.breakdown.red }} poor</span>
          </div>
          <div v-if="suggestion.breakdown.critical" class="status-item status-critical">
            <i class="pi pi-ban"></i>
            <span>{{ suggestion.breakdown.critical }} critical</span>
          </div>
        </div>

        <Button
          :label="isSelected(suggestion.hour) ? 'Selected' : 'Select This Time'"
          :icon="isSelected(suggestion.hour) ? 'pi pi-check' : 'pi pi-arrow-right'"
          :severity="isSelected(suggestion.hour) ? 'success' : 'primary'"
          :disabled="isSelected(suggestion.hour)"
          class="w-full mt-3"
          @click="selectTime(suggestion)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.optimal-suggestions {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.no-suggestions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s ease;
}

.suggestion-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-card.selected {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.suggestion-card:nth-child(1) .rank-badge {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.suggestion-card:nth-child(2) .rank-badge {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.suggestion-card:nth-child(3) .rank-badge {
  background: linear-gradient(135deg, #d97706, #b45309);
}

.time-info {
  flex: 1;
}

.time-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.score-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.status-green {
  color: #059669;
}

.status-orange {
  color: #d97706;
}

.status-red {
  color: #dc2626;
}

.status-critical {
  color: #991b1b;
  font-weight: 600;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .suggestion-card {
    transition: none;
  }
}
</style>
