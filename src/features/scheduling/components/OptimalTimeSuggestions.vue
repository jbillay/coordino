<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'

const props = defineProps({
  suggestions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showDetails: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['suggestion-selected'])

const selectedSuggestion = ref(null)

const getSuggestionClass = (index) => {
  const baseClasses =
    'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary'
  const isSelected = selectedSuggestion.value?.hour === props.suggestions[index]?.hour

  let borderColor = 'border-gray-300 hover:border-primary'
  if (index === 0) {
    borderColor = 'border-green-300 hover:border-green-400'
  } else if (index === 1) {
    borderColor = 'border-yellow-300 hover:border-yellow-400'
  } else if (index === 2) {
    borderColor = 'border-orange-300 hover:border-orange-400'
  }

  const selectedClass = isSelected
    ? 'ring-2 ring-primary bg-primary-50'
    : 'bg-white hover:bg-gray-50'

  return `${baseClasses} ${borderColor} ${selectedClass}`
}

const getRankBadgeClass = (index) => {
  const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center'
  if (index === 0) {
    return `${baseClasses} bg-green-500 text-white`
  }
  if (index === 1) {
    return `${baseClasses} bg-yellow-500 text-white`
  }
  if (index === 2) {
    return `${baseClasses} bg-orange-500 text-white`
  }
  return `${baseClasses} bg-gray-500 text-white`
}

const getScoreBadgeClass = (score) => {
  const baseClasses = 'px-3 py-1 rounded-full text-sm font-bold'
  if (score >= 80) {
    return `${baseClasses} bg-green-100 text-green-800`
  }
  if (score >= 60) {
    return `${baseClasses} bg-yellow-100 text-yellow-800`
  }
  if (score >= 40) {
    return `${baseClasses} bg-orange-100 text-orange-800`
  }
  return `${baseClasses} bg-red-100 text-red-800`
}

const formatTime = (suggestion) => {
  const { hour } = suggestion
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:00 ${period}`
}

const formatDate = (datetime) => format(new Date(datetime), 'EEEE, MMMM d, yyyy')

const getRecommendationText = () => {
  if (props.suggestions.length === 0) {
    return ''
  }

  const best = props.suggestions[0]

  if (best.score >= 80) {
    return `The #1 suggestion at ${formatTime(best)} is excellent with ${best.green_count} participants in optimal hours.`
  } else if (best.score >= 60) {
    return `The #1 suggestion at ${formatTime(best)} is a good compromise with ${best.green_count} green and ${best.orange_count} orange participants.`
  } else if (best.critical_count > 0) {
    return `All suggestions have conflicts. The #1 option at ${formatTime(best)} minimizes critical conflicts but ${best.critical_count} participant(s) are on holiday/weekend.`
  }
  return `Finding a perfect time is challenging. The #1 suggestion at ${formatTime(best)} is the most equitable option available.`
}

const handleSuggestionClick = (suggestion) => {
  selectedSuggestion.value = suggestion
  emit('suggestion-selected', suggestion)
}
</script>

<template>
  <div class="optimal-time-suggestions">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Top 3 Optimal Times</h3>
      <span v-if="suggestions.length > 0" class="text-sm text-gray-600">
        Based on equity score analysis
      </span>
    </div>

    <div v-if="loading" class="flex justify-center items-center p-6">
      <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
    </div>

    <div v-else-if="suggestions.length > 0" class="space-y-3">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.hour"
        :class="getSuggestionClass(index)"
        role="button"
        :tabindex="0"
        :aria-label="`Suggestion ${index + 1}: ${formatTime(suggestion)}, score ${suggestion.score}`"
        @click="handleSuggestionClick(suggestion)"
        @keydown.enter="handleSuggestionClick(suggestion)"
        @keydown.space.prevent="handleSuggestionClick(suggestion)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div :class="getRankBadgeClass(index)">
              <span class="text-sm font-bold">#{{ index + 1 }}</span>
            </div>
            <div>
              <div class="font-semibold text-lg">{{ formatTime(suggestion) }}</div>
              <div class="text-sm text-gray-600">
                {{ formatDate(suggestion.datetime) }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center space-x-2">
              <div :class="getScoreBadgeClass(suggestion.score)">
                {{ Math.round(suggestion.score) }}/100
              </div>
            </div>
            <div class="text-xs text-gray-600 mt-1">
              <i class="pi pi-circle-fill text-green-500 text-xs"></i>
              <span class="mx-1">{{ suggestion.green_count }}</span>
              <i class="pi pi-circle-fill text-orange-500 text-xs"></i>
              <span class="mx-1">{{ suggestion.orange_count }}</span>
              <i class="pi pi-circle-fill text-red-500 text-xs"></i>
              <span class="mx-1">{{ suggestion.red_count }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="suggestion.critical_count > 0"
          class="mt-2 p-2 bg-red-50 rounded border border-red-200"
        >
          <i class="pi pi-exclamation-triangle text-red-600 text-sm"></i>
          <span class="text-sm text-red-700 ml-2">
            {{ suggestion.critical_count }} critical conflict{{
              suggestion.critical_count > 1 ? 's' : ''
            }}
          </span>
        </div>

        <div
          v-if="showDetails && selectedSuggestion?.hour === suggestion.hour"
          class="mt-3 pt-3 border-t"
        >
          <div class="text-sm space-y-1">
            <p class="font-medium text-gray-700">Participant Breakdown:</p>
            <ul class="list-disc list-inside text-gray-600 space-y-1">
              <li v-if="suggestion.green_count > 0">
                {{ suggestion.green_count }} participant{{ suggestion.green_count > 1 ? 's' : '' }}
                in optimal hours
              </li>
              <li v-if="suggestion.orange_count > 0">
                {{ suggestion.orange_count }} participant{{
                  suggestion.orange_count > 1 ? 's' : ''
                }}
                in acceptable hours
              </li>
              <li v-if="suggestion.red_count > 0" class="text-red-600">
                {{ suggestion.red_count }} participant{{ suggestion.red_count > 1 ? 's' : '' }}
                outside working hours
              </li>
              <li v-if="suggestion.critical_count > 0" class="text-red-700 font-medium">
                {{ suggestion.critical_count }} participant{{
                  suggestion.critical_count > 1 ? 's' : ''
                }}
                on holiday/weekend
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center p-6 text-gray-500 bg-gray-50 rounded-lg">
      <i class="pi pi-info-circle text-3xl mb-2"></i>
      <p class="text-sm">No suggestions available. Add participants to generate recommendations.</p>
    </div>

    <div
      v-if="suggestions.length > 0"
      class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
    >
      <div class="flex items-start">
        <i class="pi pi-lightbulb text-blue-600 mt-0.5"></i>
        <div class="ml-2 text-sm text-blue-800">
          <p class="font-medium">Recommendation:</p>
          <p class="mt-1">
            {{ getRecommendationText() }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.optimal-time-suggestions {
  @apply w-full;
}
</style>
