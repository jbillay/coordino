<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'

/**
 * ConfirmDialog Component
 * Enhanced accessible confirmation dialog with support for:
 * - Simple button confirmation
 * - Typed text confirmation (e.g., type "DELETE")
 * - Password confirmation
 * - Multi-step workflows
 *
 * Feature: 001-user-config - User Story 3 (Account Deletion)
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
 *
 * @example
 * <ConfirmDialog
 *   v-model:visible="showDeleteAccount"
 *   header="Delete Account"
 *   message="Type DELETE to confirm"
 *   severity="danger"
 *   confirmType="type-text"
 *   confirmText="DELETE"
 *   @confirm="handleAccountDelete"
 * />
 */

const props = defineProps({
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
   * Type of confirmation required
   * @values button, type-text, password
   */
  confirmType: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'type-text', 'password'].includes(value)
  },

  /**
   * Required text to type when confirmType is 'type-text'
   */
  confirmText: {
    type: String,
    default: ''
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
  },

  /**
   * Error message to display
   */
  error: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// Form state
const typedText = ref('')
const passwordInput = ref('')

// Computed
const isConfirmDisabled = computed(() => {
  if (props.loading) {
    return true
  }

  if (props.confirmType === 'type-text') {
    return typedText.value !== props.confirmText
  }

  if (props.confirmType === 'password') {
    return !passwordInput.value
  }

  return false
})

/**
 * Handle confirm action
 */
const handleConfirm = () => {
  if (props.confirmType === 'password') {
    emit('confirm', passwordInput.value)
  } else {
    emit('confirm')
  }

  if (!props.error) {
    resetForm()
  }
}

/**
 * Handle cancel action
 */
const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
  resetForm()
}

/**
 * Reset form inputs
 */
const resetForm = () => {
  typedText.value = ''
  passwordInput.value = ''
}

// Watch for dialog close
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      resetForm()
    }
  }
)
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="!loading"
    :draggable="false"
    :style="{ width: '500px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    :close-on-escape="!loading"
    :dismissable-mask="!loading"
    @update:visible="handleCancel"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <i
          :class="[
            'text-2xl',
            severity === 'danger'
              ? 'pi pi-exclamation-triangle text-red-500 dark:text-red-400'
              : '',
            severity === 'warning'
              ? 'pi pi-exclamation-circle text-yellow-500 dark:text-yellow-400'
              : '',
            severity === 'info' ? 'pi pi-info-circle text-blue-500 dark:text-blue-400' : ''
          ]"
          aria-hidden="true"
        ></i>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ header }}</h3>
      </div>
    </template>

    <div class="py-4 space-y-4">
      <!-- Message -->
      <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ message }}</p>

      <!-- Error Message -->
      <Message v-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Type Text Confirmation -->
      <div v-if="confirmType === 'type-text'" class="space-y-2">
        <label
          for="confirm-text-input"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Type
          <strong class="text-red-600 dark:text-red-400">{{ confirmText }}</strong>
          to confirm
        </label>
        <InputText
          id="confirm-text-input"
          v-model="typedText"
          :placeholder="`Type ${confirmText}`"
          class="w-full"
          :disabled="loading"
          autocomplete="off"
          aria-describedby="confirm-text-help"
        />
        <small id="confirm-text-help" class="text-gray-600 dark:text-gray-400">
          This action requires explicit confirmation
        </small>
      </div>

      <!-- Password Confirmation -->
      <div v-if="confirmType === 'password'" class="space-y-2">
        <label
          for="confirm-password-input"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Enter your password to confirm
        </label>
        <Password
          id="confirm-password-input"
          v-model="passwordInput"
          placeholder="Enter your password"
          class="w-full"
          :disabled="loading"
          :feedback="false"
          toggle-mask
          aria-describedby="confirm-password-help"
        />
        <small id="confirm-password-help" class="text-gray-600 dark:text-gray-400">
          Your password is required for security
        </small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          :label="cancelLabel"
          icon="pi pi-times"
          severity="secondary"
          outlined
          :disabled="loading"
          :aria-label="`${cancelLabel} and close dialog`"
          @click="handleCancel"
        />
        <Button
          :label="confirmLabel"
          :icon="confirmIcon"
          :severity="severity === 'danger' ? 'danger' : severity === 'warning' ? 'warn' : undefined"
          :loading="loading"
          :disabled="isConfirmDisabled"
          :aria-label="`${confirmLabel} action`"
          :autofocus="confirmType === 'button'"
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
