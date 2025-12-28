<script setup>
/**
 * DataExportSettings Component
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 *
 * Handles data export functionality:
 * - Export user data in JSON format
 * - Export user data in CSV format
 * - GDPR compliance
 *
 * @component
 */
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()
const isExporting = ref(false)

const handleExportJSON = async () => {
  isExporting.value = true

  try {
    // TODO: Implement actual data export in Phase 7
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.add({
      severity: 'info',
      summary: 'Export Feature Coming Soon',
      detail: 'Data export will be implemented in Phase 7',
      life: 3000
    })
  } finally {
    isExporting.value = false
  }
}

const handleExportCSV = async () => {
  isExporting.value = true

  try {
    // TODO: Implement actual data export in Phase 7
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.add({
      severity: 'info',
      summary: 'Export Feature Coming Soon',
      detail: 'Data export will be implemented in Phase 7',
      life: 3000
    })
  } finally {
    isExporting.value = false
  }
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

    <!-- Placeholder Message -->
    <Message severity="info" :closable="false">
      Data export functionality will be fully implemented in Phase 7
    </Message>

    <!-- Export Options -->
    <div class="space-y-4">
      <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Export as JSON</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Download all your data in JSON format for easy import into other applications
            </p>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-600 text-xs"></i>
                <span>Tasks and todos</span>
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-600 text-xs"></i>
                <span>Notes and topics</span>
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-600 text-xs"></i>
                <span>Meetings and participants</span>
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-600 text-xs"></i>
                <span>Preferences and settings</span>
              </li>
            </ul>
          </div>
          <Button
            label="Export JSON"
            icon="pi pi-download"
            :loading="isExporting"
            class="ml-4"
            @click="handleExportJSON"
          />
        </div>
      </div>

      <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">Export as CSV</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Download your data in CSV format for use in spreadsheet applications
            </p>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-600 text-xs"></i>
                <span>Separate CSV files for each data type</span>
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-600 text-xs"></i>
                <span>Compatible with Excel, Google Sheets</span>
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-600 text-xs"></i>
                <span>Easy to analyze and visualize</span>
              </li>
            </ul>
          </div>
          <Button
            label="Export CSV"
            icon="pi pi-download"
            :loading="isExporting"
            class="ml-4"
            @click="handleExportCSV"
          />
        </div>
      </div>
    </div>

    <!-- GDPR Notice -->
    <div
      class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
        <div class="flex-1">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-1">Data Privacy</h4>
          <p class="text-sm text-blue-800 dark:text-blue-200">
            Your data export includes all information associated with your account. This feature is
            provided in compliance with GDPR data portability requirements. Exported data may
            contain personal information, so please store it securely.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
