<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: 'You have unsaved changes to this meeting.'
  }
})

const emit = defineEmits(['save', 'discard', 'cancel'])

const visible = ref(props.show)

watch(
  () => props.show,
  (newValue) => {
    visible.value = newValue
  }
)

watch(visible, (newValue) => {
  if (!newValue && props.show) {
    emit('cancel')
  }
})

const handleSave = () => {
  visible.value = false
  emit('save')
}

const handleDiscard = () => {
  visible.value = false
  emit('discard')
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :closable="false"
    :draggable="false"
    header="Unsaved Changes"
    class="w-full max-w-md"
  >
    <div class="flex items-start space-x-4">
      <i class="pi pi-exclamation-triangle text-orange-500 text-3xl"></i>
      <div>
        <p class="text-gray-700 mb-4">
          {{ message }}
        </p>
        <p class="text-sm text-gray-500">If you leave without saving, your changes will be lost.</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <Button label="Discard Changes" severity="secondary" outlined @click="handleDiscard" />
        <Button label="Save Changes" severity="primary" @click="handleSave" />
        <Button label="Cancel" severity="secondary" @click="handleCancel" />
      </div>
    </template>
  </Dialog>
</template>
