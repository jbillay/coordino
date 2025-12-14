<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

// Country options (ISO 3166-1 alpha-2 codes)
const countryOptions = ref([
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },
  { code: 'KR', name: 'South Korea' }
])

// Days of week (ISO 8601: 1=Monday, 7=Sunday)
const daysOfWeek = ref([
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
])

const isEdit = computed(() => !!props.initialData)

// Form data with defaults
const formData = reactive({
  country_code: '',
  green_start: '09:00',
  green_end: '17:00',
  orange_morning_start: '08:00',
  orange_morning_end: '09:00',
  orange_evening_start: '17:00',
  orange_evening_end: '18:00',
  work_days: [1, 2, 3, 4, 5] // Monday-Friday by default
})

// Errors object
const errors = reactive({
  country_code: '',
  green_start: '',
  green_end: '',
  orange_morning_start: '',
  orange_morning_end: '',
  orange_evening_start: '',
  orange_evening_end: '',
  work_days: ''
})

// Watch for initial data changes (edit mode)
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      Object.assign(formData, {
        country_code: newData.country_code,
        green_start: newData.green_start,
        green_end: newData.green_end,
        orange_morning_start: newData.orange_morning_start,
        orange_morning_end: newData.orange_morning_end,
        orange_evening_start: newData.orange_evening_start,
        orange_evening_end: newData.orange_evening_end,
        work_days: newData.work_days || [1, 2, 3, 4, 5]
      })
    }
  },
  { immediate: true }
)

// T116: Validation function
function validate() {
  // Reset errors
  Object.keys(errors).forEach((key) => (errors[key] = ''))

  let isValid = true

  // Country code required
  if (!formData.country_code) {
    errors.country_code = 'Please select a country'
    isValid = false
  }

  // Convert time strings to minutes for comparison
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const greenStart = toMinutes(formData.green_start)
  const greenEnd = toMinutes(formData.green_end)
  const orangeMorningStart = toMinutes(formData.orange_morning_start)
  const orangeMorningEnd = toMinutes(formData.orange_morning_end)
  const orangeEveningStart = toMinutes(formData.orange_evening_start)
  const orangeEveningEnd = toMinutes(formData.orange_evening_end)

  // Green start < green end
  if (greenStart >= greenEnd) {
    errors.green_start = 'Start time must be before end time'
    errors.green_end = 'End time must be after start time'
    isValid = false
  }

  // Orange morning should not overlap with green
  if (orangeMorningEnd > greenStart) {
    errors.orange_morning_end = 'Should end before green hours start'
    isValid = false
  }

  // Orange evening should not overlap with green
  if (orangeEveningStart < greenEnd) {
    errors.orange_evening_start = 'Should start after green hours end'
    isValid = false
  }

  // Orange morning start < orange morning end
  if (orangeMorningStart >= orangeMorningEnd) {
    errors.orange_morning_start = 'Start time must be before end time'
    isValid = false
  }

  // Orange evening start < orange evening end
  if (orangeEveningStart >= orangeEveningEnd) {
    errors.orange_evening_start = 'Start time must be before end time'
    isValid = false
  }

  // Work days validation
  if (!formData.work_days || formData.work_days.length === 0) {
    errors.work_days = 'Please select at least one working day'
    isValid = false
  }

  // Check work_days contains valid integers 1-7
  if (formData.work_days.some((day) => day < 1 || day > 7)) {
    errors.work_days = 'Invalid day selected'
    isValid = false
  }

  return isValid
}

function handleSubmit() {
  if (validate()) {
    emit('submit', { ...formData })
  }
}
</script>

<template>
  <Card class="country-config-form">
    <template #title>{{ isEdit ? 'Edit' : 'Add' }} Custom Working Hours</template>
    <template #content>
      <form class="form-grid" @submit.prevent="handleSubmit">
        <!-- Country Selection -->
        <div class="form-field">
          <label for="country" class="form-label">Country</label>
          <Select
            id="country"
            v-model="formData.country_code"
            :options="countryOptions"
            option-label="name"
            option-value="code"
            placeholder="Select country"
            :disabled="isEdit"
            :invalid="!!errors.country_code"
            aria-label="Select country for custom working hours"
          />
          <small v-if="errors.country_code" class="error-message" role="alert">
            {{ errors.country_code }}
          </small>
        </div>

        <!-- Green Hours (Optimal) -->
        <div class="form-section">
          <h3 class="section-title">Optimal Working Hours (Green)</h3>
          <div class="time-range-grid">
            <div class="form-field">
              <label for="green-start" class="form-label">Start Time</label>
              <input
                id="green-start"
                v-model="formData.green_start"
                type="time"
                class="time-input"
                :class="{ invalid: !!errors.green_start }"
                aria-label="Optimal hours start time"
              />
              <small v-if="errors.green_start" class="error-message" role="alert">
                {{ errors.green_start }}
              </small>
            </div>

            <div class="form-field">
              <label for="green-end" class="form-label">End Time</label>
              <input
                id="green-end"
                v-model="formData.green_end"
                type="time"
                class="time-input"
                :class="{ invalid: !!errors.green_end }"
                aria-label="Optimal hours end time"
              />
              <small v-if="errors.green_end" class="error-message" role="alert">
                {{ errors.green_end }}
              </small>
            </div>
          </div>
        </div>

        <!-- Orange Morning Hours (Acceptable Early) -->
        <div class="form-section">
          <h3 class="section-title">Acceptable Early Hours (Orange)</h3>
          <div class="time-range-grid">
            <div class="form-field">
              <label for="orange-morning-start" class="form-label">Start Time</label>
              <input
                id="orange-morning-start"
                v-model="formData.orange_morning_start"
                type="time"
                class="time-input"
                :class="{ invalid: !!errors.orange_morning_start }"
                aria-label="Acceptable early hours start time"
              />
            </div>

            <div class="form-field">
              <label for="orange-morning-end" class="form-label">End Time</label>
              <input
                id="orange-morning-end"
                v-model="formData.orange_morning_end"
                type="time"
                class="time-input"
                :class="{ invalid: !!errors.orange_morning_end }"
                aria-label="Acceptable early hours end time"
              />
            </div>
          </div>
        </div>

        <!-- Orange Evening Hours (Acceptable Late) -->
        <div class="form-section">
          <h3 class="section-title">Acceptable Late Hours (Orange)</h3>
          <div class="time-range-grid">
            <div class="form-field">
              <label for="orange-evening-start" class="form-label">Start Time</label>
              <input
                id="orange-evening-start"
                v-model="formData.orange_evening_start"
                type="time"
                class="time-input"
                :class="{ invalid: !!errors.orange_evening_start }"
                aria-label="Acceptable late hours start time"
              />
            </div>

            <div class="form-field">
              <label for="orange-evening-end" class="form-label">End Time</label>
              <input
                id="orange-evening-end"
                v-model="formData.orange_evening_end"
                type="time"
                class="time-input"
                :class="{ invalid: !!errors.orange_evening_end }"
                aria-label="Acceptable late hours end time"
              />
            </div>
          </div>
        </div>

        <!-- Work Days Selection -->
        <div class="form-field">
          <label class="form-label">Working Days</label>
          <div class="work-days-grid" role="group" aria-label="Select working days">
            <div v-for="day in daysOfWeek" :key="day.value" class="checkbox-item">
              <Checkbox
                :id="`day-${day.value}`"
                v-model="formData.work_days"
                :value="day.value"
                :binary="false"
                :aria-label="`${day.label} is a working day`"
              />
              <label :for="`day-${day.value}`" class="checkbox-label">
                {{ day.label }}
              </label>
            </div>
          </div>
          <small v-if="errors.work_days" class="error-message" role="alert">
            {{ errors.work_days }}
          </small>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <Button type="button" label="Cancel" severity="secondary" @click="$emit('cancel')" />
          <Button
            type="submit"
            :label="isEdit ? 'Update' : 'Save'"
            icon="pi pi-check"
            :loading="loading"
            aria-label="Save custom working hours configuration"
          />
        </div>
      </form>
    </template>
  </Card>
</template>

<style scoped>
.country-config-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  padding: 1rem;
  background: var(--p-surface-50);
  border-radius: 0.5rem;
  border: 1px solid var(--p-surface-200);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--p-text-color);
}

.time-range-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--p-text-color);
}

.time-input {
  padding: 0.5rem;
  border: 1px solid var(--p-surface-400);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: var(--p-surface-0);
  color: var(--p-text-color);
}

.time-input:focus {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

.time-input.invalid {
  border-color: var(--p-red-500);
}

.work-days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  font-size: 0.875rem;
  cursor: pointer;
}

.error-message {
  color: var(--p-red-500);
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--p-surface-200);
}

/* Accessibility (T122-T123) */
:deep(input:focus-visible),
:deep(.p-select:focus-within) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .time-range-grid {
    grid-template-columns: 1fr;
  }

  .work-days-grid {
    grid-template-columns: 1fr;
  }
}
</style>
