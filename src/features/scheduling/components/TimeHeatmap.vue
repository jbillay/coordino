<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  heatmapData: {
    type: Array,
    required: false,
    default: () => []
  },
  currentHour: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['hourSelected'])

const selectedHour = ref(props.currentHour)
const cellRefs = ref({})

// Watch for changes to currentHour prop
watch(
  () => props.currentHour,
  (newHour) => {
    selectedHour.value = newHour
  }
)

/**
 * Format hour in 12-hour format with AM/PM
 */
function formatHour(hour) {
  if (hour === 0) {
    return '12 AM'
  }
  if (hour < 12) {
    return `${hour} AM`
  }
  if (hour === 12) {
    return '12 PM'
  }
  return `${hour - 12} PM`
}

/**
 * Get color for equity score using gradient
 * 0-100 score maps to red -> yellow -> green gradient
 */
function getColor(score) {
  // Normalize score to 0-1 range
  const normalized = Math.max(0, Math.min(100, score)) / 100

  if (normalized >= 0.75) {
    // Green for scores 75-100
    const greenIntensity = Math.round(200 + (normalized - 0.75) * 220)
    return `rgb(34, ${greenIntensity}, 34)`
  } else if (normalized >= 0.5) {
    // Yellow-green for scores 50-75
    const ratio = (normalized - 0.5) / 0.25
    const red = Math.round(200 * (1 - ratio))
    const green = Math.round(200)
    return `rgb(${red}, ${green}, 34)`
  } else if (normalized >= 0.25) {
    // Orange for scores 25-50
    const ratio = (normalized - 0.25) / 0.25
    const red = Math.round(255)
    const green = Math.round(150 * ratio + 50)
    return `rgb(${red}, ${green}, 0)`
  }
  // Red for scores 0-25
  const intensity = Math.round(200 + normalized * 220)
  return `rgb(${intensity}, 34, 34)`
}

/**
 * Get ARIA label for screen readers
 */
function getAriaLabel(slot) {
  const hour = formatHour(slot.hour)
  const score = Math.round(slot.score)
  const { green, orange, red, critical } = slot.breakdown

  let statusText = ''
  if (green) {
    statusText += `${green} green, `
  }
  if (orange) {
    statusText += `${orange} orange, `
  }
  if (red) {
    statusText += `${red} red, `
  }
  if (critical) {
    statusText += `${critical} critical`
  }

  return `${hour}: Equity score ${score} out of 100. ${statusText.replace(/, $/, '')}`
}

/**
 * Handle cell selection
 */
function selectHour(hour) {
  selectedHour.value = hour
  emit('hourSelected', hour)

  // Focus the selected cell for keyboard navigation
  nextTick(() => {
    if (cellRefs.value[hour]) {
      cellRefs.value[hour].focus()
    }
  })
}

/**
 * Handle keyboard navigation
 * Arrow keys: navigate between cells
 * Enter/Space: select cell
 */
function handleKeyDown(event, currentHour) {
  const { key } = event

  if (key === 'Enter' || key === ' ') {
    event.preventDefault()
    selectHour(currentHour)
    return
  }

  let nextHour = currentHour

  switch (key) {
    case 'ArrowRight':
      event.preventDefault()
      nextHour = (currentHour + 1) % 24
      break
    case 'ArrowLeft':
      event.preventDefault()
      nextHour = (currentHour - 1 + 24) % 24
      break
    case 'ArrowDown':
      event.preventDefault()
      nextHour = (currentHour + 6) % 24
      break
    case 'ArrowUp':
      event.preventDefault()
      nextHour = (currentHour - 6 + 24) % 24
      break
    case 'Home':
      event.preventDefault()
      nextHour = 0
      break
    case 'End':
      event.preventDefault()
      nextHour = 23
      break
    default:
      return
  }

  // Focus next cell
  if (cellRefs.value[nextHour]) {
    cellRefs.value[nextHour].focus()
  }
}
</script>

<template>
  <div class="time-heatmap">
    <h3>24-Hour Heatmap</h3>
    <p class="text-sm text-gray-600 mb-3">
      Click any hour to update the meeting time. Green indicates optimal times, red indicates poor
      times.
    </p>

    <div
      class="heatmap-grid"
      role="grid"
      aria-label="24-hour meeting time heatmap showing equity scores"
    >
      <div
        v-for="slot in heatmapData"
        :key="slot.hour"
        :ref="(el) => (cellRefs[slot.hour] = el)"
        class="heatmap-cell"
        role="gridcell"
        :tabindex="selectedHour === slot.hour ? 0 : -1"
        :aria-label="getAriaLabel(slot)"
        :aria-selected="selectedHour === slot.hour"
        :style="{ backgroundColor: getColor(slot.score) }"
        @click="selectHour(slot.hour)"
        @keydown="handleKeyDown($event, slot.hour)"
      >
        <div class="hour-label">{{ formatHour(slot.hour) }}</div>
        <div class="score-label">{{ Math.round(slot.score) }}</div>
        <div class="breakdown-label text-xs">
          <span v-if="slot.breakdown.green" class="text-green-700">
            {{ slot.breakdown.green }}✓
          </span>
          <span v-if="slot.breakdown.orange" class="text-orange-600">
            {{ slot.breakdown.orange }}⚠
          </span>
          <span v-if="slot.breakdown.red" class="text-red-600">{{ slot.breakdown.red }}✗</span>
          <span v-if="slot.breakdown.critical" class="text-red-800">
            {{ slot.breakdown.critical }}!
          </span>
        </div>
      </div>
    </div>

    <div class="legend mt-4">
      <h4 class="text-sm font-semibold mb-2">Equity Score Legend</h4>
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: getColor(100) }"></div>
          <span>100 (Optimal)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: getColor(75) }"></div>
          <span>75 (Good)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: getColor(50) }"></div>
          <span>50 (Fair)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: getColor(25) }"></div>
          <span>25 (Poor)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: getColor(0) }"></div>
          <span>0 (Critical)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-heatmap {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.heatmap-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
}

.heatmap-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.heatmap-cell:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  z-index: 20;
}

.heatmap-cell[aria-selected='true'] {
  outline: 3px solid #1d4ed8;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.hour-label {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.score-label {
  font-size: 1.25rem;
  font-weight: 700;
}

.breakdown-label {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  display: flex;
  gap: 0.25rem;
}

.legend {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .heatmap-cell {
    transition: none;
  }

  .heatmap-cell:hover {
    transform: none;
  }
}
</style>
