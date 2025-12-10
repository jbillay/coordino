<script setup>
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'

const props = defineProps({
  meeting: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:meeting', 'input'])

const localMeeting = ref({ ...props.meeting })
const errors = ref({})

const validate = () => {
  const newErrors = {}

  if (!localMeeting.value.title || localMeeting.value.title.trim() === '') {
    newErrors.title = 'Meeting title is required'
  }

  if (!localMeeting.value.proposed_time) {
    newErrors.proposed_time = 'Proposed time is required'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleInput = () => {
  validate()
  emit('update:meeting', localMeeting.value)
  emit('input')
}

watch(
  () => props.meeting,
  (newMeeting) => {
    localMeeting.value = { ...newMeeting }
  },
  { deep: true }
)

defineExpose({
  validate
})
</script>

<template>
  <div class="meeting-form space-y-4">
    <div>
      <label for="meeting-title" class="block text-sm font-medium mb-2">Meeting Title *</label>
      <InputText
        id="meeting-title"
        v-model="localMeeting.title"
        class="w-full"
        placeholder="Enter meeting title"
        :invalid="!!errors.title"
        @input="handleInput"
      />
      <small v-if="errors.title" class="text-red-500">{{ errors.title }}</small>
    </div>

    <div>
      <label for="proposed-time" class="block text-sm font-medium mb-2">
        Proposed Meeting Time *
      </label>
      <DatePicker
        id="proposed-time"
        v-model="localMeeting.proposed_time"
        show-time
        :show-seconds="false"
        :show-button-bar="true"
        date-format="yy-mm-dd"
        hour-format="24"
        class="w-full"
        :invalid="!!errors.proposed_time"
        @update:model-value="handleInput"
      />
      <small v-if="errors.proposed_time" class="text-red-500">
        {{ errors.proposed_time }}
      </small>
    </div>

    <div>
      <label for="meeting-notes" class="block text-sm font-medium mb-2">Notes (Optional)</label>
      <Textarea
        id="meeting-notes"
        v-model="localMeeting.notes"
        class="w-full"
        rows="3"
        placeholder="Add any additional notes or agenda items"
        @input="handleInput"
      />
    </div>
  </div>
</template>
