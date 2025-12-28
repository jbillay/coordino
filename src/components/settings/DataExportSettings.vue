<script setup>
/**
 * DataExportSettings Component
 * Feature: 001-user-config - User Story 4 (Data Export)
 *
 * Handles data export functionality:
 * - Export user data in dual formats (JSON + CSV)
 * - Progress tracking with loading indicators
 * - Error handling with retry capability
 * - GDPR compliance
 *
 * @component
 */
import { computed } from 'vue'
import { useDataExport } from '@/composables/useDataExport'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'

const toast = useToast()
const { isExporting, progress, currentStep, error, exportData, resetState } = useDataExport()

// Format progress for display
const progressPercent = computed(() => Math.round(progress.value))

// Handle export button click
const handleExport = async () => {
  try {
    resetState()
    await exportData()

    toast.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: 'Your data has been downloaded successfully',
      life: 5000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Export Failed',
      detail: error.value || 'An error occurred during export',
      life: 7000
    })
  }
}

// Handle retry after error
const handleRetry = () => {
  handleExport()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Data Export</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Download your data for backup or transfer
      </p>
    </div>

    <!-- Success Message -->
    <Message
      v-if="!isExporting && progress === 100 && !error"
      severity="success"
      :closable="true"
      data-testid="success-message"
      @close="resetState"
    >
      <p class="font-medium">Export completed successfully!</p>
      <p class="text-sm mt-1">Your data has been downloaded as a ZIP archive.</p>
    </Message>

    <!-- Error Message -->
    <Message
      v-if="error && !isExporting"
      severity="error"
      :closable="false"
      data-testid="error-message"
    >
      <div class="flex flex-col gap-3">
        <div>
          <p class="font-medium">Export failed</p>
          <p class="text-sm mt-1">{{ error }}</p>
        </div>
        <Button
          label="Try Again"
          size="small"
          severity="secondary"
          text
          icon="pi pi-refresh"
          class="self-start"
          data-testid="retry-button"
          @click="handleRetry"
        />
      </div>
    </Message>

    <!-- Export Section -->
    <div
      class="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
    >
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Export All My Data</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a complete archive of your data in both JSON and CSV formats
          </p>

          <!-- What's Included -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xs"></i>
              <span>Tasks and categories</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xs"></i>
              <span>Notes and topics</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xs"></i>
              <span>Meetings and participants</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xs"></i>
              <span>Locations and settings</span>
            </div>
          </div>

          <!-- Format Info -->
          <div
            class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 text-sm mt-0.5"></i>
            <div class="flex-1 text-sm">
              <p class="text-blue-900 dark:text-blue-100 font-medium">Dual Format Export</p>
              <p class="text-blue-800 dark:text-blue-200 mt-1">
                •
                <strong>JSON</strong>
                - Complete backup with full data structure
                <br />
                •
                <strong>CSV</strong>
                - Individual files for spreadsheet analysis
                <br />
                •
                <strong>README</strong>
                - Export information and usage guide
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Bar (shown during export) -->
      <div v-if="isExporting" class="mb-4 space-y-3">
        <div class="flex items-center justify-between">
          <span
            class="text-sm font-medium text-gray-700 dark:text-gray-300"
            data-testid="current-step"
          >
            {{ currentStep }}
          </span>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ progressPercent }}%
          </span>
        </div>
        <ProgressBar :value="progress" :show-value="false" class="h-2" data-testid="progress-bar" />
      </div>

      <!-- Export Button -->
      <Button
        label="Export All My Data"
        icon="pi pi-download"
        :loading="isExporting"
        :disabled="isExporting"
        class="w-full p-button-lg"
        severity="primary"
        data-testid="export-button"
        @click="handleExport"
      />

      <!-- Performance Note -->
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        Export typically completes in under 30 seconds. Large datasets may take longer.
      </p>
    </div>

    <!-- GDPR Notice -->
    <div
      class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
        <div class="flex-1">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
            Data Privacy & GDPR Compliance
          </h4>
          <p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
            Your data export includes all information associated with your account. This feature is
            provided in compliance with GDPR data portability requirements (Article 20).
          </p>
          <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li class="flex items-start gap-2">
              <i class="pi pi-shield text-blue-600 dark:text-blue-400 text-xs mt-0.5"></i>
              <span>Exported data may contain personal information - store it securely</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-lock text-blue-600 dark:text-blue-400 text-xs mt-0.5"></i>
              <span>Delete export files when no longer needed</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-file text-blue-600 dark:text-blue-400 text-xs mt-0.5"></i>
              <span>Use JSON format for migration to other services</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
