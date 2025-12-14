<script setup>
import { ref, computed, watch } from 'vue'
import Select from 'primevue/select'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  label: {
    type: String,
    default: 'Timezone'
  },
  placeholder: {
    type: String,
    default: 'Select timezone'
  },
  countryCode: {
    type: String,
    default: null
  },
  showClear: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  invalid: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const inputId = `timezone-${Math.random().toString(36).substr(2, 9)}`
const selectedTimezone = ref(props.modelValue)

// Common timezones with offsets
const allTimezones = [
  { value: 'America/New_York', label: 'Eastern Time (US)', offset: 'UTC-5/-4', country: 'US' },
  { value: 'America/Chicago', label: 'Central Time (US)', offset: 'UTC-6/-5', country: 'US' },
  { value: 'America/Denver', label: 'Mountain Time (US)', offset: 'UTC-7/-6', country: 'US' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)', offset: 'UTC-8/-7', country: 'US' },
  { value: 'America/Anchorage', label: 'Alaska Time', offset: 'UTC-9/-8', country: 'US' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time', offset: 'UTC-10', country: 'US' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1', country: 'GB' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 'UTC+1/+2', country: 'FR' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: 'UTC+1/+2', country: 'DE' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', offset: 'UTC+1/+2', country: 'ES' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9', country: 'JP' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 'UTC+8', country: 'CN' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30', country: 'IN' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4', country: 'AE' },
  { value: 'Asia/Jerusalem', label: 'Israel (IST)', offset: 'UTC+2/+3', country: 'IL' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)', offset: 'UTC+10/+11', country: 'AU' },
  {
    value: 'Australia/Melbourne',
    label: 'Melbourne (AEDT/AEST)',
    offset: 'UTC+10/+11',
    country: 'AU'
  },
  { value: 'Australia/Perth', label: 'Perth (AWST)', offset: 'UTC+8', country: 'AU' }
]

const timezones = computed(() => {
  if (props.countryCode) {
    return allTimezones.filter((tz) => tz.country === props.countryCode)
  }
  return allTimezones
})

const getTimezoneLabel = (value) => {
  const tz = allTimezones.find((t) => t.value === value)
  return tz ? tz.label : value
}

const handleChange = (event) => {
  emit('change', event.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    selectedTimezone.value = newValue
  }
)

watch(selectedTimezone, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>

<template>
  <div class="timezone-selector">
    <label v-if="label" :for="inputId" class="block text-sm font-medium mb-2">
      {{ label }}
    </label>
    <Select
      :id="inputId"
      v-model="selectedTimezone"
      :options="timezones"
      option-label="label"
      option-value="value"
      :placeholder="placeholder"
      :filter="true"
      :show-clear="showClear"
      :disabled="disabled"
      :invalid="invalid"
      class="w-full"
      @change="handleChange"
    >
      <template #value="slotProps">
        <div v-if="slotProps.value" class="flex items-center">
          <span class="font-medium">{{ getTimezoneLabel(slotProps.value) }}</span>
        </div>
        <span v-else>{{ placeholder }}</span>
      </template>
      <template #option="slotProps">
        <div class="flex flex-col">
          <span class="font-medium">{{ slotProps.option.label }}</span>
          <span class="text-xs text-gray-500">{{ slotProps.option.offset }}</span>
        </div>
      </template>
    </Select>
  </div>
</template>

<style scoped>
.timezone-selector {
  @apply w-full;
}
</style>
