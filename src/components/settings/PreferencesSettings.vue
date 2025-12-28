<script setup>
/**
 * PreferencesSettings Component
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 *
 * Handles user preferences:
 * - Timezone selection (IANA timezone database)
 * - Theme preference (light/dark)
 * - Date format preference (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
 *
 * @component
 * @emits changes - Emitted when form has unsaved changes
 * @emits saved - Emitted when changes are saved successfully
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useToast } from 'primevue/usetoast'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'
import Message from 'primevue/message'

const emit = defineEmits(['changes', 'saved'])
const themeStore = useThemeStore()
const toast = useToast()

// Form state
const timezone = ref('')
const originalTimezone = ref('')
const dateFormat = ref('MM/DD/YYYY')
const originalDateFormat = ref('MM/DD/YYYY')
const isLoading = ref(false)
const error = ref(null)

// Theme options
const themeOptions = [
  { label: 'Light', value: 'light', icon: 'pi pi-sun' },
  { label: 'Dark', value: 'dark', icon: 'pi pi-moon' }
]

// Date format options
const dateFormatOptions = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
]

// Common timezones
const timezoneOptions = ref([
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'America/Denver (MST/MDT)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Australia/Sydney (AEDT/AEST)', value: 'Australia/Sydney' },
  { label: 'Pacific/Auckland (NZDT/NZST)', value: 'Pacific/Auckland' }
])

// Computed
const hasChanges = computed(() => {
  return (
    timezone.value !== originalTimezone.value ||
    dateFormat.value !== originalDateFormat.value
  )
})

const currentTheme = computed({
  get: () => themeStore.theme,
  set: async (value) => {
    await themeStore.setTheme(value)
  }
})

// Watch for changes
watch(hasChanges, (value) => {
  emit('changes', value)
})

// Load current preferences
const loadPreferences = () => {
  // Load timezone from user preferences or detect system timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  timezone.value = detectedTimezone
  originalTimezone.value = timezone.value

  // Load date format from localStorage or use default
  const savedFormat = localStorage.getItem('coordino-date-format')
  if (savedFormat) {
    dateFormat.value = savedFormat
    originalDateFormat.value = savedFormat
  }
}

// Initialize
onMounted(() => {
  loadPreferences()
})

// Save preferences
const handleSave = async () => {
  error.value = null
  isLoading.value = true

  try {
    // Save timezone preference
    if (timezone.value !== originalTimezone.value) {
      localStorage.setItem('coordino-timezone', timezone.value)
      originalTimezone.value = timezone.value
    }

    // Save date format preference
    if (dateFormat.value !== originalDateFormat.value) {
      localStorage.setItem('coordino-date-format', dateFormat.value)
      originalDateFormat.value = dateFormat.value
    }

    toast.add({
      severity: 'success',
      summary: 'Preferences Updated',
      detail: 'Your preferences have been saved successfully',
      life: 3000
    })
    emit('saved')
  } catch (err) {
    error.value = 'Failed to save preferences'
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save preferences',
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

// Reset form
const handleCancel = () => {
  timezone.value = originalTimezone.value
  dateFormat.value = originalDateFormat.value
  error.value = null
}

// Helper function for date preview
const formatDatePreview = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  switch (dateFormat.value) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Preferences</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Customize your application experience
      </p>
    </div>

    <!-- Error Message -->
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <!-- Theme Preference -->
    <div class="form-group">
      <label id="theme-label" class="form-label">Theme</label>
      <SelectButton
        v-model="currentTheme"
        :options="themeOptions"
        option-label="label"
        option-value="value"
        aria-labelledby="theme-label"
        aria-describedby="theme-help"
        data-testid="theme-toggle"
        role="radiogroup"
      >
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <i :class="slotProps.option.icon" aria-hidden="true"></i>
            <span>{{ slotProps.option.label }}</span>
          </div>
        </template>
      </SelectButton>
      <small id="theme-help" class="text-gray-600 dark:text-gray-400">
        Choose between light and dark mode
      </small>
    </div>

    <!-- Timezone Preference -->
    <div class="form-group">
      <label for="timezone" class="form-label">Timezone</label>
      <Dropdown
        id="timezone"
        v-model="timezone"
        :options="timezoneOptions"
        option-label="label"
        option-value="value"
        placeholder="Select your timezone"
        class="w-full"
        filter
        show-clear
        aria-describedby="timezone-help"
      />
      <small id="timezone-help" class="text-gray-600 dark:text-gray-400">
        Used for displaying meeting times and deadlines
      </small>
    </div>

    <!-- Date Format Preference -->
    <div class="form-group">
      <label for="date-format" class="form-label">Date Format</label>
      <Dropdown
        id="date-format"
        v-model="dateFormat"
        :options="dateFormatOptions"
        option-label="label"
        option-value="value"
        placeholder="Select date format"
        class="w-full"
        aria-describedby="date-format-help"
      />
      <small id="date-format-help" class="text-gray-600 dark:text-gray-400">
        How dates are displayed throughout the application
      </small>
    </div>

    <!-- Preview Section -->
    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" aria-live="polite" aria-atomic="true">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Preview</h3>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Current time:</span>
          <span class="font-medium text-gray-900 dark:text-white">
            {{ new Date().toLocaleTimeString('en-US', { timeZone: timezone || 'UTC' }) }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Today's date:</span>
          <span class="font-medium text-gray-900 dark:text-white">
            {{ formatDatePreview(new Date()) }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Theme:</span>
          <span class="font-medium text-gray-900 dark:text-white capitalize">
            {{ currentTheme }}
          </span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button
        label="Save Changes"
        icon="pi pi-check"
        :loading="isLoading"
        :disabled="!hasChanges"
        @click="handleSave"
        aria-label="Save preference changes"
      />
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        outlined
        :disabled="!hasChanges || isLoading"
        @click="handleCancel"
        aria-label="Cancel preference changes"
      />
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-semibold text-gray-700 dark:text-gray-300;
}

/* SelectButton styling */
:deep(.p-selectbutton .p-button) {
  @apply px-4 py-2;
}
</style>
