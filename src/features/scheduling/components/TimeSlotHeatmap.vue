<script setup>
import { ref } from 'vue'

defineProps({
  slots: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedHour: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['slot-selected'])

const selectedSlot = ref(null)

const getScoreColor = (score) => {
  if (score >= 80) {
    return 'excellent'
  }
  if (score >= 60) {
    return 'good'
  }
  if (score >= 40) {
    return 'fair'
  }
  return 'poor'
}

const getSlotClass = (slot) => {
  const scoreColor = getScoreColor(slot.score)
  const isSelected = selectedSlot.value?.hour === slot.hour
  return `slot ${scoreColor} ${isSelected ? 'selected' : ''}`
}

const getSlotTooltip = (slot) =>
  `${formatHour(slot.hour)}\nEquity Score: ${Math.round(slot.score)}/100\nGreen: ${slot.green_count}, Orange: ${slot.orange_count}, Red: ${slot.red_count}`

const formatHour = (hour) => {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:00 ${period}`
}

const handleSlotClick = (slot) => {
  selectedSlot.value = slot
  emit('slot-selected', slot)
}

// Keyboard navigation
const handleKeyboardNav = (event, currentSlot, slots) => {
  const currentIndex = slots.findIndex((s) => s.hour === currentSlot.hour)
  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowRight':
      newIndex = Math.min(currentIndex + 1, slots.length - 1)
      break
    case 'ArrowLeft':
      newIndex = Math.max(currentIndex - 1, 0)
      break
    case 'ArrowDown':
      newIndex = Math.min(currentIndex + 6, slots.length - 1)
      break
    case 'ArrowUp':
      newIndex = Math.max(currentIndex - 6, 0)
      break
    default:
      return
  }

  event.preventDefault()
  const newSlot = slots[newIndex]
  handleSlotClick(newSlot)

  // Focus the new slot
  event.target.parentElement?.children[newIndex]?.focus()
}
</script>

<template>
  <div class="time-slot-heatmap">
    <!-- Loading state -->
    <div v-if="loading" class="heatmap-loading">
      <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
      <span class="loading-text">Analyzing optimal times across timezones...</span>
    </div>

    <!-- Heatmap Grid -->
    <div v-else-if="slots.length > 0" class="heatmap-container">
      <!-- Legend -->
      <div class="heatmap-legend">
        <h3 class="legend-title">24-Hour Equity Analysis</h3>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color excellent"></div>
            <span>Excellent (80-100)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color good"></div>
            <span>Good (60-79)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color fair"></div>
            <span>Fair (40-59)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color poor"></div>
            <span>Poor (0-39)</span>
          </div>
        </div>
      </div>

      <!-- Slots Grid -->
      <div class="heatmap-grid">
        <div
          v-for="slot in slots"
          :key="slot.hour"
          :class="getSlotClass(slot)"
          :title="getSlotTooltip(slot)"
          role="button"
          :tabindex="0"
          :aria-label="`${formatHour(slot.hour)}, equity score ${slot.score}`"
          @click="handleSlotClick(slot)"
          @keydown.enter.prevent="handleSlotClick(slot)"
          @keydown.space.prevent="handleSlotClick(slot)"
          @keydown="(e) => handleKeyboardNav(e, slot, slots)"
        >
          <div class="slot-time">{{ formatHour(slot.hour) }}</div>
          <div class="slot-score">{{ Math.round(slot.score) }}</div>
          <div class="slot-participants">
            <span class="participant-badge green">{{ slot.green_count }}</span>
            <span class="participant-badge orange">{{ slot.orange_count }}</span>
            <span class="participant-badge red">{{ slot.red_count }}</span>
          </div>
        </div>
      </div>

      <!-- Selected Slot Details -->
      <div v-if="selectedSlot" class="slot-details">
        <h4 class="details-title">Selected Time: {{ formatHour(selectedSlot.hour) }}</h4>
        <div class="details-content">
          <div class="detail-row">
            <span class="detail-label">Equity Score:</span>
            <span class="detail-value">{{ Math.round(selectedSlot.score) }}/100</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Participants:</span>
            <span class="detail-value">
              <span class="badge green">{{ selectedSlot.green_count }} green</span>
              <span class="badge orange">{{ selectedSlot.orange_count }} orange</span>
              <span class="badge red">{{ selectedSlot.red_count }} red</span>
            </span>
          </div>
          <div v-if="selectedSlot.critical_count > 0" class="critical-warning">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ selectedSlot.critical_count }} participants have critical conflicts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="heatmap-empty">
      <i class="pi pi-info-circle text-5xl opacity-40"></i>
      <p>Add participants and propose a time to generate the equity heatmap.</p>
    </div>
  </div>
</template>

<style scoped>
.time-slot-heatmap {
  width: 100%;
  padding: 1.5rem;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 8px;
}

/* Loading State */
.heatmap-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-text {
  font-size: 1.125rem;
  color: var(--text-muted, #6b7280);
}

/* Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-default, #e5e7eb);
}

.legend-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary, #111827);
}

.legend-items {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted, #6b7280);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.excellent {
  background: #10b981;
}
.legend-color.good {
  background: #f59e0b;
}
.legend-color.fair {
  background: #fb923c;
}
.legend-color.poor {
  background: #ef4444;
}

/* Heatmap Grid - 6 columns */
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.slot:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slot:focus-visible {
  outline: 2px solid var(--brand-teal-500, #14b8a6);
  outline-offset: 2px;
}

/* Score-based colors - Light mode */
.slot.excellent {
  background: #d1fae5;
  border-color: #6ee7b7;
}

.slot.good {
  background: #fef3c7;
  border-color: #fcd34d;
}

.slot.fair {
  background: #fed7aa;
  border-color: #fdba74;
}

.slot.poor {
  background: #fecaca;
  border-color: #fca5a5;
}

/* Dark mode colors */
.dark .time-slot-heatmap {
  background: var(--bg-surface, #1f1f1f);
  border-color: var(--border-default, #374151);
}

.dark .heatmap-legend {
  border-color: var(--border-default, #374151);
}

.dark .legend-title {
  color: var(--text-primary, #f9fafb);
}

.dark .slot.excellent {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.dark .slot.good {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.4);
}

.dark .slot.fair {
  background: rgba(251, 146, 60, 0.2);
  border-color: rgba(251, 146, 60, 0.4);
}

.dark .slot.poor {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

/* Selected state */
.slot.selected {
  border-color: var(--brand-teal-500, #14b8a6);
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.slot-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.dark .slot-time {
  color: var(--text-primary, #f9fafb);
}

.slot-score {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary, #111827);
  line-height: 1;
}

.dark .slot-score {
  color: var(--text-primary, #f9fafb);
}

.slot-participants {
  display: flex;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.participant-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  font-weight: 600;
}

.participant-badge.green {
  background: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.participant-badge.orange {
  background: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.participant-badge.red {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Selected Slot Details */
.slot-details {
  padding: 1.25rem;
  background: var(--bg-base, #fafafa);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 8px;
}

.dark .slot-details {
  background: var(--bg-base, #141414);
  border-color: var(--border-default, #374151);
}

.details-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--text-primary, #111827);
}

.dark .details-title {
  color: var(--text-primary, #f9fafb);
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.detail-label {
  font-weight: 500;
  color: var(--text-muted, #6b7280);
}

.detail-value {
  font-weight: 600;
  color: var(--text-primary, #111827);
  display: flex;
  gap: 0.5rem;
}

.dark .detail-value {
  color: var(--text-primary, #f9fafb);
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.badge.green {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.badge.orange {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.badge.red {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.critical-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Empty State */
.heatmap-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted, #6b7280);
}

.heatmap-empty p {
  margin-top: 1rem;
  font-size: 1rem;
}

/* Responsive: 4-column on tablet */
@media (max-width: 1024px) {
  .heatmap-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Responsive: 2-column on mobile */
@media (max-width: 640px) {
  .time-slot-heatmap {
    padding: 1rem;
  }

  .heatmap-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .legend-items {
    flex-direction: column;
    gap: 0.75rem;
  }

  .heatmap-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .slot {
    padding: 1rem 0.5rem;
  }

  .slot-score {
    font-size: 1.5rem;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .slot {
    transition: none;
  }

  .slot:hover {
    transform: none;
  }
}
</style>
