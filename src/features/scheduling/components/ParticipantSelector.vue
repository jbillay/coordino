<script setup>
import { computed } from 'vue'
import Select from 'primevue/select'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  participants: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select a participant'
  },
  filter: {
    type: Boolean,
    default: true
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

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => `participant-selector-${Math.random().toString(36).substr(2, 9)}`)

const getParticipantName = (participantId) => {
  const participant = props.participants.find((p) => p.id === participantId)
  return participant ? participant.name : ''
}

const handleChange = (value) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="participant-selector">
    <label v-if="label" :for="inputId" class="block text-sm font-medium mb-2">
      {{ label }}
    </label>
    <Select
      :id="inputId"
      :model-value="modelValue"
      :options="participants"
      option-label="name"
      option-value="id"
      :placeholder="placeholder"
      :filter="filter"
      :show-clear="showClear"
      :disabled="disabled"
      :invalid="invalid"
      class="w-full"
      @update:model-value="handleChange"
    >
      <template #value="slotProps">
        <div v-if="slotProps.value" class="flex items-center space-x-2">
          <span>{{ getParticipantName(slotProps.value) }}</span>
        </div>
        <span v-else>{{ placeholder }}</span>
      </template>
      <template #option="slotProps">
        <div class="flex flex-col">
          <span class="font-medium">{{ slotProps.option.name }}</span>
          <span class="text-xs text-gray-500">
            {{ slotProps.option.timezone }} ({{ slotProps.option.country }})
          </span>
        </div>
      </template>
    </Select>
  </div>
</template>
