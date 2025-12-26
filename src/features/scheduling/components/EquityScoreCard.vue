<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Badge from 'primevue/badge'

const props = defineProps({
  score: {
    type: Number,
    default: null
  }
})

const displayScore = computed(() => (props.score !== null ? Math.round(props.score) : '--'))

const scoreColor = computed(() => {
  if (props.score === null) {
    return '#9ca3af'
  }
  if (props.score >= 71) {
    return '#10B981'
  } // green
  if (props.score >= 41) {
    return '#F59E0B'
  } // orange
  return '#EF4444' // red
})

const scoreQuality = computed(() => {
  if (props.score === null) {
    return null
  }
  if (props.score >= 71) {
    return 'Excellent'
  }
  if (props.score >= 41) {
    return 'Good'
  }
  if (props.score >= 1) {
    return 'Fair'
  }
  return 'Poor'
})

const qualitySeverity = computed(() => {
  if (props.score === null) {
    return 'secondary'
  }
  if (props.score >= 71) {
    return 'success'
  }
  if (props.score >= 41) {
    return 'warn'
  }
  return 'danger'
})

// Circle calculations
const radius = 85
const circumference = 2 * Math.PI * radius

const dashOffset = computed(() => {
  if (props.score === null) {
    return circumference
  }
  const progress = props.score / 100
  return circumference * (1 - progress)
})
</script>

<template>
  <Card class="h-full">
    <template #title>
      <div class="flex items-center justify-between">
        <span>Global Equity Score</span>
        <Badge v-if="scoreQuality" :value="scoreQuality" :severity="qualitySeverity" size="large" />
      </div>
    </template>

    <template #content>
      <div class="text-center">
        <div class="relative inline-block">
          <svg
            class="transform -rotate-90"
            width="200"
            height="200"
            role="img"
            :aria-label="`Equity score: ${displayScore} out of 100, ${scoreQuality || 'not calculated'}`"
          >
            <!-- Background circle -->
            <circle cx="100" cy="100" r="85" fill="none" stroke="#e5e7eb" stroke-width="12" />
            <!-- Score circle -->
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              :stroke="scoreColor"
              stroke-width="12"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              stroke-linecap="round"
              class="transition-all duration-500"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div
              class="text-5xl font-bold"
              :style="{ color: scoreColor }"
              aria-live="polite"
              aria-atomic="true"
            >
              {{ displayScore }}
            </div>
            <div class="text-sm text-gray-500 mt-1">out of 100</div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
