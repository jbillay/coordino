<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Button from 'primevue/button'

const props = defineProps({
  participant: {
    type: Object,
    required: true
  },
  status: {
    type: Object,
    default: null
  },
  localTime: {
    type: String,
    default: ''
  },
  removable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['remove'])

const statusClass = computed(() => {
  if (!props.status) {
    return ''
  }

  if (props.status.is_critical) {
    return 'border-l-4 border-red-600'
  }

  switch (props.status.status) {
    case 'green':
      return 'border-l-4 border-green-500'
    case 'orange':
      return 'border-l-4 border-orange-500'
    case 'red':
      return 'border-l-4 border-red-500'
    default:
      return ''
  }
})

const statusLabel = computed(() => {
  if (!props.status) {
    return ''
  }

  switch (props.status.status) {
    case 'green':
      return 'Optimal'
    case 'orange':
      return 'Acceptable'
    case 'red':
      return 'Poor'
    default:
      return ''
  }
})

const statusSeverity = computed(() => {
  if (!props.status) {
    return 'secondary'
  }

  switch (props.status.status) {
    case 'green':
      return 'success'
    case 'orange':
      return 'warn'
    case 'red':
      return 'danger'
    default:
      return 'secondary'
  }
})

const countryName = computed(() => {
  const countryNames = {
    US: 'United States',
    GB: 'United Kingdom',
    FR: 'France',
    DE: 'Germany',
    ES: 'Spain',
    JP: 'Japan',
    CN: 'China',
    IN: 'India',
    AU: 'Australia',
    AE: 'UAE',
    IL: 'Israel'
  }
  return countryNames[props.participant.country] || props.participant.country
})

const handleRemove = () => {
  emit('remove', props.participant.id)
}
</script>

<template>
  <Card class="transition-shadow hover:shadow-md" :class="statusClass">
    <template #content>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <h4 class="font-semibold text-lg">{{ participant.name }}</h4>
            <Badge :value="statusLabel" :severity="statusSeverity" class="text-xs" />
            <Badge v-if="status?.is_critical" value="CRITICAL" severity="danger" class="text-xs" />
          </div>

          <div class="text-sm text-gray-600 space-y-1">
            <div class="flex items-center space-x-2">
              <i class="pi pi-clock"></i>
              <span class="font-medium">{{ localTime }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <i class="pi pi-globe"></i>
              <span>{{ participant.timezone }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <i class="pi pi-map-marker"></i>
              <span>{{ countryName }} ({{ participant.country }})</span>
            </div>
          </div>

          <div v-if="status?.reason" class="mt-2 text-sm">
            <p class="text-gray-500">{{ status.reason }}</p>
          </div>

          <div v-if="status?.holiday" class="mt-2 flex items-center space-x-2 text-sm text-red-600">
            <i class="pi pi-calendar-times"></i>
            <span>{{ status.holiday }}</span>
          </div>

          <div v-if="participant.notes" class="mt-2 text-sm text-gray-500 italic">
            {{ participant.notes }}
          </div>
        </div>

        <div v-if="removable" class="ml-4">
          <Button
            icon="pi pi-times"
            severity="danger"
            text
            rounded
            size="small"
            aria-label="Remove participant"
            @click="handleRemove"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
