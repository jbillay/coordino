<script setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

/**
 * ConfirmDialog Component
 * Accessible replacement for native confirm() dialog
 *
 * @component
 * @example
 * <ConfirmDialog
 *   v-model:visible="showConfirm"
 *   header="Delete Task"
 *   message="Are you sure you want to delete this task?"
 *   severity="danger"
 *   @confirm="handleDelete"
 * />
 */

defineProps({
  /**
   * Dialog visibility state
   */
  visible: {
    type: Boolean,
    default: false
  },

  /**
   * Dialog header text
   */
  header: {
    type: String,
    default: 'Confirm Action'
  },

  /**
   * Message to display in dialog body
   */
  message: {
    type: String,
    required: true
  },

  /**
   * Severity level affecting colors and icon
   * @values info, warning, danger
   */
  severity: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'warning', 'danger'].includes(value)
  },

  /**
   * Confirm button label
   */
  confirmLabel: {
    type: String,
    default: 'Confirm'
  },

  /**
   * Cancel button label
   */
  cancelLabel: {
    type: String,
    default: 'Cancel'
  },

  /**
   * Confirm button icon
   */
  confirmIcon: {
    type: String,
    default: 'pi pi-check'
  },

  /**
   * Loading state for confirm button
   */
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

/**
 * Handle confirm action
 */
const handleConfirm = () => {
  emit('confirm')
}

/**
 * Handle cancel action
 */
const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '450px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    @update:visible="handleCancel"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <i
          :class="[
            'text-2xl',
            severity === 'danger' ? 'pi pi-exclamation-triangle text-red-500' : '',
            severity === 'warning' ? 'pi pi-exclamation-circle text-yellow-500' : '',
            severity === 'info' ? 'pi pi-info-circle text-blue-500' : ''
          ]"
        ></i>
        <h3 class="text-xl font-semibold">{{ header }}</h3>
      </div>
    </template>

    <div class="py-4">
      <p class="text-gray-700 dark:text-gray-300">{{ message }}</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="cancelLabel"
          icon="pi pi-times"
          class="p-button-text"
          :aria-label="`${cancelLabel} and close dialog`"
          @click="handleCancel"
        />
        <Button
          :label="confirmLabel"
          :icon="confirmIcon"
          :class="[
            severity === 'danger' ? 'p-button-danger' : '',
            severity === 'warning' ? 'p-button-warning' : ''
          ]"
          :loading="loading"
          :aria-label="`${confirmLabel} action`"
          autofocus
          @click="handleConfirm"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.p-dialog-header) {
  padding: 1.5rem;
}

:deep(.p-dialog-content) {
  padding: 0 1.5rem;
}

:deep(.p-dialog-footer) {
  padding: 1.5rem;
}
</style>
