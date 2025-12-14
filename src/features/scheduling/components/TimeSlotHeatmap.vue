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
  const baseClasses =
    'p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary border-2'
  const scoreColor = getScoreColor(slot.score)
  const isSelected = selectedSlot.value?.hour === slot.hour

  const colorClasses = {
    excellent: 'bg-green-100 border-green-300 hover:bg-green-200',
    good: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
    fair: 'bg-orange-100 border-orange-300 hover:bg-orange-200',
    poor: 'bg-red-100 border-red-300 hover:bg-red-200'
  }

  const selectedClass = isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''

  return `${baseClasses} ${colorClasses[scoreColor]} ${selectedClass}`
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
</script>

<template>
  <div class="time-slot-heatmap">
    <div v-if="loading" class="flex justify-center items-center p-8">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      <span class="ml-3 text-lg">Analyzing optimal times...</span>
    </div>

    <div v-else-if="slots.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">24-Hour Equity Analysis</h3>
        <div class="flex items-center space-x-4 text-sm">
          <div class="flex items-center">
            <div class="w-4 h-4 rounded mr-2 bg-green-500"></div>
            <span>Excellent (80-100)</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 rounded mr-2 bg-yellow-500"></div>
            <span>Good (60-79)</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 rounded mr-2 bg-orange-500"></div>
            <span>Fair (40-59)</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 rounded mr-2 bg-red-500"></div>
            <span>Poor (0-39)</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-2">
        <div
          v-for="slot in slots"
          :key="slot.hour"
          :class="getSlotClass(slot)"
          :title="getSlotTooltip(slot)"
          role="button"
          :tabindex="0"
          :aria-label="`${formatHour(slot.hour)}, equity score ${slot.score}`"
          @click="handleSlotClick(slot)"
          @keydown.enter="handleSlotClick(slot)"
          @keydown.space.prevent="handleSlotClick(slot)"
        >
          <div class="text-xs font-medium mb-1">{{ formatHour(slot.hour) }}</div>
          <div class="text-lg font-bold">{{ Math.round(slot.score) }}</div>
          <div class="text-xs mt-1 opacity-90">
            <i class="pi pi-users text-xs"></i>
            <span class="ml-1">
              {{ slot.green_count }}G {{ slot.orange_count }}O {{ slot.red_count }}R
            </span>
          </div>
        </div>
      </div>

      <div v-if="selectedSlot" class="mt-4 p-4 bg-gray-50 rounded-lg border">
        <h4 class="font-semibold mb-2">Selected Time: {{ formatHour(selectedSlot.hour) }}</h4>
        <div class="text-sm text-gray-700">
          <p class="mb-2">
            <strong>Equity Score:</strong>
            {{ Math.round(selectedSlot.score) }}/100
          </p>
          <p>
            <strong>Participants:</strong>
            {{ selectedSlot.green_count }} green, {{ selectedSlot.orange_count }} orange,
            {{ selectedSlot.red_count }} red
            <span v-if="selectedSlot.critical_count > 0" class="text-red-600 font-medium">
              ({{ selectedSlot.critical_count }} critical conflicts)
            </span>
          </p>
        </div>
      </div>
    </div>

    <div v-else class="text-center p-8 text-gray-500">
      <i class="pi pi-info-circle text-4xl mb-3"></i>
      <p>Add participants and a proposed time to generate the heatmap analysis.</p>
    </div>
  </div>
</template>

<style scoped>
.time-slot-heatmap {
  @apply w-full;
}
</style>
