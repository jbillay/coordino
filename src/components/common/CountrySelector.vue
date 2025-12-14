<script setup>
import { ref, watch } from 'vue'
import Select from 'primevue/select'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  label: {
    type: String,
    default: 'Country'
  },
  placeholder: {
    type: String,
    default: 'Select country'
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

const inputId = `country-${Math.random().toString(36).substr(2, 9)}`
const selectedCountry = ref(props.modelValue)

// Common countries for scheduling
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MX', name: 'Mexico' }
].sort((a, b) => a.name.localeCompare(b.name))

const getCountryName = (code) => {
  const country = countries.find((c) => c.code === code)
  return country ? country.name : code
}

const handleChange = (event) => {
  emit('change', event.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    selectedCountry.value = newValue
  }
)

watch(selectedCountry, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>

<template>
  <div class="country-selector">
    <label v-if="label" :for="inputId" class="block text-sm font-medium mb-2">
      {{ label }}
    </label>
    <Select
      :id="inputId"
      v-model="selectedCountry"
      :options="countries"
      option-label="name"
      option-value="code"
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
          <span class="font-medium">{{ getCountryName(slotProps.value) }}</span>
          <span class="ml-2 text-xs text-gray-500">({{ slotProps.value }})</span>
        </div>
        <span v-else>{{ placeholder }}</span>
      </template>
      <template #option="slotProps">
        <div class="flex items-center justify-between">
          <span>{{ slotProps.option.name }}</span>
          <span class="text-xs text-gray-500">{{ slotProps.option.code }}</span>
        </div>
      </template>
    </Select>
  </div>
</template>

<style scoped>
.country-selector {
  @apply w-full;
}
</style>
