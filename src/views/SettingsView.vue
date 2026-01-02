<script setup>
/**
 * SettingsView Component
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 *
 * Main settings container with tab navigation for:
 * - Profile: Display name, email, password management
 * - Preferences: Timezone, theme, date format
 * - Account: Email change, password change, account deletion
 * - Data Export: Export user data in JSON/CSV formats
 *
 * @component
 * @example
 * <SettingsView />
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import ProfileSettings from '@/components/settings/ProfileSettings.vue'
import PreferencesSettings from '@/components/settings/PreferencesSettings.vue'
import AccountSettings from '@/components/settings/AccountSettings.vue'
import DataExportSettings from '@/components/settings/DataExportSettings.vue'
import HelpSettings from '@/components/settings/HelpSettings.vue'

// Active tab index
const activeTab = ref(0)

// Track if there are unsaved changes
const hasUnsavedChanges = ref(false)

// Handle unsaved changes warning
const handleBeforeUnload = (e) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// Handle navigation warning
const handleBeforeRouteLeave = () => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm(
      'You have unsaved changes. Are you sure you want to leave this page?'
    )
    return answer
  }
  return true
}

// Register navigation guard
onBeforeRouteLeave(handleBeforeRouteLeave)

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Child components will emit this event when changes are made
const handleChanges = (changed) => {
  hasUnsavedChanges.value = changed
}

// Child components will emit this event when changes are saved
const handleSaved = () => {
  hasUnsavedChanges.value = false
}
</script>

<template>
  <AppLayout>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage your profile, preferences, and account settings
        </p>
      </div>

      <!-- Tab Navigation (US8: Comprehensive Error Handling) -->
      <ErrorBoundary>
        <TabView
          v-model:active-index="activeTab"
          class="settings-tabs"
          aria-label="Settings sections"
        >
          <!-- Profile Tab -->
          <TabPanel aria-label="Profile settings">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-user" aria-hidden="true"></i>
                <span>Profile</span>
              </div>
            </template>
            <ProfileSettings @changes="handleChanges" @saved="handleSaved" />
          </TabPanel>

          <!-- Preferences Tab -->
          <TabPanel aria-label="Preferences settings">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-sliders-h" aria-hidden="true"></i>
                <span>Preferences</span>
              </div>
            </template>
            <PreferencesSettings @changes="handleChanges" @saved="handleSaved" />
          </TabPanel>

          <!-- Account Tab -->
          <TabPanel aria-label="Account security settings">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-shield" aria-hidden="true"></i>
                <span>Account</span>
              </div>
            </template>
            <AccountSettings @changes="handleChanges" @saved="handleSaved" />
          </TabPanel>

          <!-- Data Export Tab -->
          <TabPanel aria-label="Data export settings">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-download" aria-hidden="true"></i>
                <span>Data Export</span>
              </div>
            </template>
            <DataExportSettings />
          </TabPanel>

          <!-- Help Tab -->
          <TabPanel aria-label="Help and support settings">
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-question-circle" aria-hidden="true"></i>
                <span>Help</span>
              </div>
            </template>
            <HelpSettings />
          </TabPanel>
        </TabView>
      </ErrorBoundary>

      <!-- Unsaved Changes Indicator -->
      <div
        v-if="hasUnsavedChanges"
        class="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 rounded shadow-lg"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div class="flex items-center gap-2">
          <i
            class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400"
            aria-hidden="true"
          ></i>
          <span class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            You have unsaved changes
          </span>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
@reference "tailwindcss";

/* Tab styling customization */
:deep(.settings-tabs .p-tabview-nav) {
  border-bottom: 1px solid rgb(229 231 235);
  background-color: white;
  padding: 0;
}

:global(html.dark) :deep(.settings-tabs .p-tabview-nav) {
  border-bottom-color: rgb(55 65 81);
  background-color: rgb(17 24 39);
}

:deep(.settings-tabs .p-tabview-nav-link) {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 150ms;
  color: rgb(75 85 99);
}

:global(html.dark) :deep(.settings-tabs .p-tabview-nav-link) {
  color: rgb(156 163 175);
}

:deep(.settings-tabs .p-tabview-nav-link:hover) {
  color: rgb(17 24 39);
}

:global(html.dark) :deep(.settings-tabs .p-tabview-nav-link:hover) {
  color: rgb(243 244 246);
}

:deep(.settings-tabs .p-tabview-nav-link.p-highlight) {
  color: var(--brand-teal-500);
  border-bottom: 2px solid var(--brand-teal-500);
}

:deep(.settings-tabs .p-tabview-panels) {
  background-color: white;
  padding: 1.5rem;
}

:global(html.dark) :deep(.settings-tabs .p-tabview-panels) {
  background-color: rgb(17 24 39);
}

/* Responsive tabs */
@media (max-width: 640px) {
  :deep(.settings-tabs .p-tabview-nav-link) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  :deep(.settings-tabs .p-tabview-nav-link span) {
    display: none;
  }

  :deep(.settings-tabs .p-tabview-panels) {
    padding: 1rem;
  }
}
</style>

<style>
/* Dark mode overrides - unscoped to work with html.dark */
html.dark .settings-tabs .p-tabview-nav {
  border-bottom-color: rgb(55 65 81);
  background-color: rgb(17 24 39);
}

html.dark .settings-tabs .p-tabview-nav-link {
  color: rgb(156 163 175);
}

html.dark .settings-tabs .p-tabview-nav-link:hover {
  color: rgb(243 244 246);
}

html.dark .settings-tabs .p-tabview-panels {
  background-color: rgb(17 24 39);
}
</style>
