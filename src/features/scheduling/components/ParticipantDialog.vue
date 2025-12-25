<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import CountrySelector from '@/components/common/CountrySelector.vue'
import TimezoneSelector from '@/components/common/TimezoneSelector.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  participant: {
    type: Object,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'save'])

const localParticipant = ref({
  name: '',
  country: '',
  timezone: '',
  notes: ''
})

const errors = ref({})

const isEditMode = computed(() => props.participant !== null)

const dialogTitle = computed(() => (isEditMode.value ? 'Edit Participant' : 'Add Participant'))

const validate = () => {
  const newErrors = {}

  if (!localParticipant.value.name || localParticipant.value.name.trim() === '') {
    newErrors.name = 'Name is required'
  }

  if (!localParticipant.value.country) {
    newErrors.country = 'Country is required'
  }

  if (!localParticipant.value.timezone) {
    newErrors.timezone = 'Timezone is required'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSave = () => {
  if (!validate()) {
    return
  }

  emit('save', {
    ...localParticipant.value,
    id: props.participant?.id || null
  })
}

const handleClose = () => {
  errors.value = {}
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      if (props.participant) {
        localParticipant.value = { ...props.participant }
      } else {
        localParticipant.value = {
          name: '',
          country: '',
          timezone: '',
          notes: ''
        }
      }
      errors.value = {}
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog
    :visible="visible"
    :header="dialogTitle"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="participant-dialog"
    style="width: 500px"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label for="participant-name" class="block text-sm font-medium mb-2">Name *</label>
        <InputText
          id="participant-name"
          v-model="localParticipant.name"
          class="w-full"
          placeholder="Enter participant name"
          :invalid="errors.name"
        />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <div>
        <CountrySelector
          v-model="localParticipant.country"
          label="Country *"
          :invalid="errors.country"
        />
        <small v-if="errors.country" class="text-red-500">{{ errors.country }}</small>
      </div>

      <div>
        <TimezoneSelector
          v-model="localParticipant.timezone"
          :country-code="localParticipant.country"
          label="Timezone *"
          :invalid="errors.timezone"
        />
        <small v-if="errors.timezone" class="text-red-500">{{ errors.timezone }}</small>
      </div>

      <div>
        <label for="participant-notes" class="block text-sm font-medium mb-2">
          Notes (Optional)
        </label>
        <Textarea
          id="participant-notes"
          v-model="localParticipant.notes"
          class="w-full"
          rows="3"
          placeholder="Add any notes about this participant"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <Button label="Cancel" severity="secondary" text @click="handleClose" />
        <Button
          :label="isEditMode ? 'Update' : 'Add Participant'"
          :loading="saving"
          @click="handleSave"
        />
      </div>
    </template>
  </Dialog>
</template>
