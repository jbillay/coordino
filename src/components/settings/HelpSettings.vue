<script setup>
/**
 * HelpSettings Component
 * Feature: 001-user-config - User Story 9 (First-Time User Experience)
 *
 * Help and support settings including:
 * - Replay feature tours
 * - Reset onboarding state
 *
 * @component
 * @example
 * <HelpSettings />
 */
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useFeatureTour } from '@/composables/useFeatureTour'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

const tour = useFeatureTour()
const toast = useToast()

const showResetConfirm = ref(false)
const resetting = ref(false)

/**
 * Handle replay all tours
 * Shows confirmation dialog before resetting
 */
const handleReplayTours = () => {
  showResetConfirm.value = true
}

/**
 * Confirm and execute tour reset
 */
const confirmResetTours = async () => {
  resetting.value = true

  try {
    const result = await tour.resetAllTours()

    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Tours Reset',
        detail:
          'All feature tours have been reset. You will see them again when you visit each feature.',
        life: 5000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Reset Failed',
        detail: 'Failed to reset tours. Please try again.',
        life: 5000
      })
    }
  } catch (error) {
    console.error('Failed to reset tours:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while resetting tours.',
      life: 5000
    })
  } finally {
    resetting.value = false
    showResetConfirm.value = false
  }
}
</script>

<template>
  <div class="help-settings">
    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Help & Support</h2>

    <!-- Feature Tours Section -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-xl" aria-hidden="true"></i>
          <span>Feature Tours</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Feature tours help you learn how to use different parts of Coordino. If you skipped a
            tour or want to see them again, you can replay all tours.
          </p>

          <div
            class="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <i
              class="pi pi-lightbulb text-blue-600 dark:text-blue-400 text-xl mt-0.5"
              aria-hidden="true"
            ></i>
            <div class="flex-1">
              <p class="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">Tip</p>
              <p class="text-sm text-blue-800 dark:text-blue-200">
                Tours will automatically appear when you visit a feature for the first time. You can
                skip them by clicking "Skip" or mark them complete by clicking "Got it".
              </p>
            </div>
          </div>

          <div
            class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white mb-1">Replay All Tours</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Reset your tour completion status and see all onboarding tours again
              </p>
            </div>
            <Button
              label="Replay Tours"
              icon="pi pi-refresh"
              severity="secondary"
              :loading="resetting"
              aria-label="Replay all feature tours"
              @click="handleReplayTours"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Future: Additional help resources can go here -->
    <!-- Documentation links, FAQ, contact support, etc. -->

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:visible="showResetConfirm"
      header="Replay All Tours?"
      message="This will reset your tour completion status and show all feature tours again when you visit each section. Are you sure you want to continue?"
      severity="info"
      confirm-label="Replay Tours"
      confirm-icon="pi pi-refresh"
      @confirm="confirmResetTours"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<style scoped>
.help-settings {
  max-width: 800px;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
