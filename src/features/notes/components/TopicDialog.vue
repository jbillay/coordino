<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useNotesStore } from '../store'
import { validateTopicName, getPresetColors } from '../utils'
import { validateHexColor } from '@/utils/validation'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  visible: Boolean,
  topic: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const notesStore = useNotesStore()
const toast = useToast()

const loading = ref(false)
const errors = ref({})
const presetColors = getPresetColors()

const formData = ref({
  name: '',
  description: '',
  color: presetColors[0]
})

const isEdit = computed(() => !!props.topic)

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    color: presetColors[0]
  }
  errors.value = {}
}

// Watch for topic changes to populate form
watch(
  () => props.topic,
  (newTopic) => {
    if (newTopic) {
      formData.value = {
        name: newTopic.name,
        description: newTopic.description || '',
        color: newTopic.color || presetColors[0]
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const validateForm = () => {
  errors.value = {}

  // Validate topic name
  const nameValidation = validateTopicName(formData.value.name, notesStore.topics, props.topic?.id)

  if (!nameValidation.valid) {
    errors.value.name = nameValidation.error
  }

  // Validate color (US8: Comprehensive Error Handling - FR-048)
  const colorValidation = validateHexColor(formData.value.color)

  if (!colorValidation.valid) {
    errors.value.color = colorValidation.error
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    let result

    if (isEdit.value) {
      result = await notesStore.updateTopic(props.topic.id, formData.value)
    } else {
      result = await notesStore.createTopic(formData.value)
    }

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: isEdit.value ? 'Topic Updated' : 'Topic Created',
        detail: `Topic "${formData.value.name}" ${isEdit.value ? 'updated' : 'created'} successfully`,
        life: 3000
      })

      emit('saved', result.data)
      emit('update:visible', false)
      resetForm()
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Error saving topic:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save topic',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}

const selectColor = (color) => {
  formData.value.color = color
  clearError('color')
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :style="{ width: '500px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <h3 class="text-xl font-semibold">{{ isEdit ? 'Edit Topic' : 'Create New Topic' }}</h3>
    </template>

    <div class="space-y-4">
      <!-- Name Field -->
      <div>
        <label for="topic-name" class="block text-sm font-medium mb-2">
          Topic Name
          <span class="text-red-500">*</span>
        </label>
        <InputText
          id="topic-name"
          v-model="formData.name"
          class="w-full"
          placeholder="Enter topic name"
          :class="{ 'p-invalid': errors.name }"
          @input="clearError('name')"
        />
        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
      </div>

      <!-- Description Field -->
      <div>
        <label for="topic-description" class="block text-sm font-medium mb-2">Description</label>
        <Textarea
          id="topic-description"
          v-model="formData.description"
          class="w-full"
          rows="3"
          placeholder="Describe what this topic is for (optional)"
        />
      </div>

      <!-- Color Picker -->
      <div>
        <label class="block text-sm font-medium mb-2">
          Color
          <span class="text-red-500">*</span>
        </label>
        <div class="flex items-center space-x-2">
          <!-- Preset Colors -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in presetColors"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-full border-2 transition-all"
              :class="{
                'border-gray-900 dark:border-white scale-110': formData.color === color,
                'border-gray-300 dark:border-gray-600 hover:scale-105': formData.color !== color
              }"
              :style="{ backgroundColor: color }"
              :aria-label="`Select ${color}`"
              @click="selectColor(color)"
            ></button>
          </div>

          <!-- Custom Color Input -->
          <div class="flex items-center space-x-2">
            <input
              v-model="formData.color"
              type="color"
              class="w-10 h-8 rounded cursor-pointer"
              :class="{ 'border-2 border-red-500': errors.color }"
              title="Custom color"
              @input="clearError('color')"
            />
            <span class="text-xs text-gray-500">{{ formData.color }}</span>
          </div>
        </div>
        <small v-if="errors.color" class="p-error">{{ errors.color }}</small>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-text"
        :disabled="loading"
        @click="handleCancel"
      />
      <Button
        :label="isEdit ? 'Update' : 'Create'"
        icon="pi pi-check"
        :loading="loading"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>
