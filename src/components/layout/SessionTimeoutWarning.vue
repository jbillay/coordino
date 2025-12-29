<script setup>
/**
 * Session Timeout Warning Modal
 * T090: Session timeout warning modal
 *
 * Displays warning when user has been inactive for 28 minutes (SC-011)
 * Allows user to extend session (FR-040) or logout
 */

import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  remainingTime: {
    type: String,
    default: '2 minutes'
  }
})

const emit = defineEmits(['update:visible', 'extend', 'logout'])

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const handleExtend = () => {
  emit('extend')
  isVisible.value = false
}

const handleLogout = () => {
  emit('logout')
  isVisible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="isVisible"
    :closable="false"
    :draggable="false"
    :modal="true"
    :dismissable-mask="false"
    class="session-warning-dialog"
    data-testid="session-warning-dialog"
    header="Session Timeout Warning"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    :style="{ width: '500px', maxWidth: '90vw' }"
  >
    <div class="flex flex-col gap-4">
      <!-- Warning Message -->
      <Message severity="warn" :closable="false">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-2xl"></i>
          <div class="flex-1">
            <p class="font-semibold mb-2">Your session is about to expire</p>
            <p class="text-sm">
              You have been inactive for a while. Your session will expire in
              <strong>{{ remainingTime }}</strong> due to inactivity.
            </p>
          </div>
        </div>
      </Message>

      <!-- Informational Text -->
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <p class="mb-2">For your security, we automatically log you out after 30 minutes of inactivity.</p>
        <p>Would you like to continue your session?</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-2 mt-2">
        <Button
          label="Logout"
          severity="secondary"
          outlined
          icon="pi pi-sign-out"
          @click="handleLogout"
          data-testid="logout-button"
        />
        <Button
          label="Stay Logged In"
          severity="info"
          icon="pi pi-refresh"
          @click="handleExtend"
          data-testid="extend-session-button"
          autofocus
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.session-warning-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border-bottom: 3px solid #d97706;
}

.session-warning-dialog :deep(.p-dialog-header .p-dialog-title) {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.session-warning-dialog :deep(.p-dialog-header .p-dialog-title::before) {
  content: '\e92c';
  font-family: 'primeicons';
  font-size: 1.25rem;
}

.session-warning-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

/* Animation for dialog entrance */
.session-warning-dialog :deep(.p-dialog) {
  animation: sessionWarningPulse 0.5s ease-in-out;
}

@keyframes sessionWarningPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Accessibility: High contrast mode */
@media (prefers-contrast: high) {
  .session-warning-dialog :deep(.p-dialog-header) {
    background: #d97706;
    border-bottom: 4px solid #000;
  }
}
</style>
