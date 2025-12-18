<script setup>
import { ref, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { getIANATimezones, getCountryCodes, isValidTimezone, isValidCountryCode } from '../utils'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  submitLabel: {
    type: String,
    default: 'Save Participant'
  }
})

const emit = defineEmits(['submit', 'cancel'])

// Form data
const formData = ref({
  name: props.initialData?.name || '',
  timezone: props.initialData?.timezone || '',
  country_code: props.initialData?.country_code || '',
  notes: props.initialData?.notes || ''
})

// Validation errors
const errors = ref({})

// Timezone options for dropdown (FR-008)
const timezoneOptions = computed(() => {
  const timezones = getIANATimezones()
  return timezones.map((tz) => ({
    label: tz,
    value: tz
  }))
})

// Country options for dropdown (FR-009)
const countryOptions = computed(() => getCountryCodes())

// Watch initialData for updates (edit mode)
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.value = {
        name: newData.name || '',
        timezone: newData.timezone || '',
        country_code: newData.country_code || '',
        notes: newData.notes || ''
      }
    }
  },
  { deep: true }
)

// Validate form
function validateForm() {
  errors.value = {}

  if (!formData.value.name || formData.value.name.trim() === '') {
    errors.value.name = 'Name is required'
  }

  if (!formData.value.timezone) {
    errors.value.timezone = 'Timezone is required'
  } else if (!isValidTimezone(formData.value.timezone)) {
    errors.value.timezone = 'Invalid IANA timezone identifier'
  }

  if (!formData.value.country_code) {
    errors.value.country_code = 'Country is required'
  } else if (!isValidCountryCode(formData.value.country_code)) {
    errors.value.country_code = 'Invalid ISO 3166-1 country code'
  }

  return Object.keys(errors.value).length === 0
}

// Handle form submission
function handleSubmit() {
  if (validateForm()) {
    emit('submit', { ...formData.value })
  }
}
</script>

<template>
  <form class="participant-form" @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="name" class="form-label">Name *</label>
      <InputText
        id="name"
        v-model="formData.name"
        :invalid="!!errors.name"
        placeholder="Participant name"
        aria-required="true"
        class="w-full"
      />
      <small v-if="errors.name" class="error-message">{{ errors.name }}</small>
    </div>

    <div class="form-field">
      <label for="timezone" class="form-label">Timezone *</label>
      <Select
        id="timezone"
        v-model="formData.timezone"
        :options="timezoneOptions"
        option-label="label"
        option-value="value"
        filter
        :invalid="!!errors.timezone"
        placeholder="Select IANA timezone"
        aria-required="true"
        class="w-full"
      />
      <small v-if="errors.timezone" class="error-message">{{ errors.timezone }}</small>
    </div>

    <div class="form-field">
      <label for="country" class="form-label">Country *</label>
      <Select
        id="country"
        v-model="formData.country_code"
        :options="countryOptions"
        option-label="name"
        option-value="code"
        filter
        :invalid="!!errors.country_code"
        placeholder="Select country"
        aria-required="true"
        class="w-full"
      />
      <small v-if="errors.country_code" class="error-message">{{ errors.country_code }}</small>
    </div>

    <div class="form-field">
      <label for="notes" class="form-label">Notes</label>
      <Textarea
        id="notes"
        v-model="formData.notes"
        placeholder="Optional notes about this participant"
        rows="3"
        class="w-full"
      />
    </div>

    <div class="form-actions">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        class="mr-2"
        @click="$emit('cancel')"
      />
      <Button type="submit" :label="submitLabel" :loading="loading" />
    </div>
  </form>
</template>

<style scoped>
.participant-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.error-message {
  color: var(--p-red-500);
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
