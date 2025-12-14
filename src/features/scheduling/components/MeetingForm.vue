<script setup>
import { ref, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

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
    default: 'Save Meeting'
  }
})

const emit = defineEmits(['submit', 'cancel'])

// Form data with separate date and time fields (FR-002)
const formData = ref({
  title: props.initialData.title || '',
  date: props.initialData.proposed_time ? new Date(props.initialData.proposed_time) : new Date(),
  time: props.initialData.proposed_time ? new Date(props.initialData.proposed_time) : new Date(),
  duration_minutes: props.initialData.duration_minutes || 60,
  notes: props.initialData.notes || ''
})

// Validation errors
const errors = ref({})

// Duration options with 15-minute intervals (FR-001a: 15-480 minutes)
const durationOptions = computed(() => {
  const options = []
  // 15 min to 2 hours: 15-minute intervals
  for (let i = 15; i <= 120; i += 15) {
    const hours = Math.floor(i / 60)
    const mins = i % 60
    const label =
      hours > 0
        ? `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`
        : `${mins} min`
    options.push({ label, value: i })
  }
  // 2 to 8 hours: 30-minute intervals
  for (let i = 150; i <= 480; i += 30) {
    const hours = Math.floor(i / 60)
    const mins = i % 60
    const label = `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`
    options.push({ label, value: i })
  }
  return options
})

// Watch initialData for updates (edit mode)
watch(
  () => props.initialData,
  (newData) => {
    if (newData && newData.proposed_time) {
      const proposedTime = new Date(newData.proposed_time)
      formData.value = {
        title: newData.title || '',
        date: proposedTime,
        time: proposedTime,
        duration_minutes: newData.duration_minutes || 60,
        notes: newData.notes || ''
      }
    }
  },
  { deep: true }
)

// Validate form
function validateForm() {
  errors.value = {}

  if (!formData.value.title || formData.value.title.trim() === '') {
    errors.value.title = 'Meeting title is required'
  }

  if (!formData.value.date) {
    errors.value.date = 'Date is required'
  }

  if (!formData.value.time) {
    errors.value.time = 'Time is required'
  }

  // Validate duration (FR-001a)
  if (!formData.value.duration_minutes) {
    errors.value.duration_minutes = 'Duration is required'
  } else if (formData.value.duration_minutes < 15 || formData.value.duration_minutes > 480) {
    errors.value.duration_minutes = 'Duration must be between 15 minutes and 8 hours'
  }

  return Object.keys(errors.value).length === 0
}

// Handle form submission
function handleSubmit() {
  if (validateForm()) {
    // Combine date and time into single UTC timestamp
    const proposedDate = new Date(formData.value.date)
    const proposedTime = new Date(formData.value.time)

    proposedDate.setHours(proposedTime.getHours())
    proposedDate.setMinutes(proposedTime.getMinutes())
    proposedDate.setSeconds(0)
    proposedDate.setMilliseconds(0)

    emit('submit', {
      title: formData.value.title.trim(),
      proposed_time: proposedDate.toISOString(),
      duration_minutes: formData.value.duration_minutes,
      notes: formData.value.notes.trim() || null
    })
  }
}
</script>

<template>
  <form class="meeting-form" @submit.prevent="handleSubmit">
    <div class="form-field">
      <label for="title" class="form-label">Meeting Title *</label>
      <InputText
        id="title"
        v-model="formData.title"
        :invalid="!!errors.title"
        placeholder="Enter meeting title"
        aria-required="true"
        class="w-full"
      />
      <small v-if="errors.title" class="error-message">{{ errors.title }}</small>
    </div>

    <div class="form-row">
      <div class="form-field flex-1">
        <label for="date" class="form-label">Date *</label>
        <DatePicker
          id="date"
          v-model="formData.date"
          :invalid="!!errors.date"
          date-format="yy-mm-dd"
          aria-required="true"
          class="w-full"
        />
        <small v-if="errors.date" class="error-message">{{ errors.date }}</small>
      </div>

      <div class="form-field flex-1">
        <label for="time" class="form-label">Time *</label>
        <DatePicker
          id="time"
          v-model="formData.time"
          :invalid="!!errors.time"
          time-only
          :step-minute="15"
          hour-format="24"
          aria-required="true"
          class="w-full"
        />
        <small v-if="errors.time" class="error-message">{{ errors.time }}</small>
        <small class="help-text">15-minute intervals (FR-002)</small>
      </div>
    </div>

    <div class="form-field">
      <label for="duration" class="form-label">Duration *</label>
      <Select
        id="duration"
        v-model="formData.duration_minutes"
        :options="durationOptions"
        option-label="label"
        option-value="value"
        :invalid="!!errors.duration_minutes"
        placeholder="Select meeting duration"
        aria-required="true"
        class="w-full"
      />
      <small v-if="errors.duration_minutes" class="error-message">
        {{ errors.duration_minutes }}
      </small>
      <small class="help-text">Duration must be between 15 minutes and 8 hours (FR-001a)</small>
    </div>

    <div class="form-field">
      <label for="notes" class="form-label">Notes</label>
      <Textarea
        id="notes"
        v-model="formData.notes"
        placeholder="Optional meeting notes or agenda"
        rows="4"
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
.meeting-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
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
}

.error-message {
  color: var(--p-red-500);
  font-size: 0.75rem;
}

.help-text {
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* Accessibility: Focus indicators (T057) */
:deep(input:focus-visible),
:deep(select:focus-visible),
:deep(textarea:focus-visible),
:deep(button:focus-visible) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
</style>
