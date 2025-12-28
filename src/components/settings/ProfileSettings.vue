<script setup>
/**
 * ProfileSettings Component
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 *
 * Handles profile editing:
 * - Display name (with XSS sanitization)
 * - Email display (link to change)
 * - Password display (link to change)
 *
 * @component
 * @emits changes - Emitted when form has unsaved changes
 * @emits saved - Emitted when changes are saved successfully
 */
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'

const emit = defineEmits(['changes', 'saved'])
const authStore = useAuthStore()
const toast = useToast()

// Form state
const displayName = ref('')
const originalDisplayName = ref('')
const isLoading = ref(false)
const error = ref(null)

// Change email dialog
const showEmailDialog = ref(false)
const newEmail = ref('')
const emailPassword = ref('')
const emailLoading = ref(false)

// Change password dialog
const showPasswordDialog = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)
const passwordMismatch = ref(false)

// Computed
const hasChanges = computed(() => displayName.value !== originalDisplayName.value)

const currentUser = computed(() => authStore.user)

// Watch for changes
watch(hasChanges, (value) => {
  emit('changes', value)
})

// Load current profile data
const loadProfile = () => {
  if (currentUser.value) {
    displayName.value = currentUser.value.user_metadata?.display_name || ''
    originalDisplayName.value = displayName.value
  }
}

// Initialize
loadProfile()

// Save profile changes
const handleSave = async () => {
  error.value = null
  isLoading.value = true

  try {
    const result = await authStore.updateProfile({
      displayName: displayName.value
    })

    if (result.success) {
      originalDisplayName.value = displayName.value
      toast.add({
        severity: 'success',
        summary: 'Profile Updated',
        detail: 'Your profile has been updated successfully',
        life: 3000
      })
      emit('saved')
    } else {
      error.value = result.error
      toast.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: result.error,
        life: 5000
      })
    }
  } catch (error) {
    error.value = 'An unexpected error occurred'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An unexpected error occurred',
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

// Reset form
const handleCancel = () => {
  displayName.value = originalDisplayName.value
  error.value = null
}

// Handle email change
const handleEmailChange = async () => {
  emailLoading.value = true
  error.value = null

  try {
    const result = await authStore.changeEmail(newEmail.value, emailPassword.value)

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Email Update Initiated',
        detail: result.message || 'Check your email for verification',
        life: 5000
      })
      showEmailDialog.value = false
      newEmail.value = ''
      emailPassword.value = ''
    } else {
      toast.add({
        severity: 'error',
        summary: 'Email Change Failed',
        detail: result.error,
        life: 5000
      })
    }
  } finally {
    emailLoading.value = false
  }
}

// Handle password change
const handlePasswordChange = async () => {
  passwordMismatch.value = false

  if (newPassword.value !== confirmPassword.value) {
    passwordMismatch.value = true
    return
  }

  passwordLoading.value = true

  try {
    const result = await authStore.changePassword(currentPassword.value, newPassword.value)

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Password Updated',
        detail: 'Your password has been updated successfully',
        life: 3000
      })
      showPasswordDialog.value = false
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      toast.add({
        severity: 'error',
        summary: 'Password Change Failed',
        detail: result.error,
        life: 5000
      })
    }
  } finally {
    passwordLoading.value = false
  }
}

// Close dialogs
const closeEmailDialog = () => {
  showEmailDialog.value = false
  newEmail.value = ''
  emailPassword.value = ''
}

const closePasswordDialog = () => {
  showPasswordDialog.value = false
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordMismatch.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Profile Information</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Update your personal information and account details
      </p>
    </div>

    <!-- Error Message -->
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <!-- Display Name -->
    <div class="form-group">
      <label for="display-name" class="form-label">Display Name</label>
      <InputText
        id="display-name"
        v-model="displayName"
        placeholder="Enter your display name"
        class="w-full"
        :maxlength="100"
        aria-describedby="display-name-help"
      />
      <small id="display-name-help" class="text-gray-600 dark:text-gray-400">
        This name will be displayed throughout the application
      </small>
    </div>

    <!-- Email (Read-only with change button) -->
    <div class="form-group">
      <label class="form-label">Email Address</label>
      <div class="flex items-center gap-2">
        <InputText
          :value="currentUser?.email || ''"
          disabled
          class="flex-1"
          aria-label="Current email address"
        />
        <Button
          label="Change"
          icon="pi pi-pencil"
          outlined
          aria-label="Change email address"
          @click="showEmailDialog = true"
        />
      </div>
      <small class="text-gray-600 dark:text-gray-400">
        Changing your email requires verification
      </small>
    </div>

    <!-- Password (with change button) -->
    <div class="form-group">
      <label class="form-label">Password</label>
      <div class="flex items-center gap-2">
        <InputText
          value="••••••••••••"
          disabled
          class="flex-1"
          type="password"
          aria-label="Current password (hidden)"
        />
        <Button
          label="Change"
          icon="pi pi-lock"
          outlined
          aria-label="Change password"
          @click="showPasswordDialog = true"
        />
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
      />
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="secondary"
        outlined
        :disabled="!hasChanges || isLoading"
        @click="handleCancel"
      />
    </div>

    <!-- Change Email Dialog -->
    <Dialog
      v-model:visible="showEmailDialog"
      modal
      header="Change Email Address"
      :style="{ width: '450px' }"
      @hide="closeEmailDialog"
    >
      <div class="space-y-4">
        <Message severity="info" :closable="false">
          You'll need to verify your new email address before the change takes effect
        </Message>

        <div class="form-group">
          <label for="new-email" class="form-label">New Email Address</label>
          <InputText
            id="new-email"
            v-model="newEmail"
            type="email"
            placeholder="newemail@example.com"
            class="w-full"
            required
            autocomplete="email"
            aria-required="true"
            aria-label="New email address"
          />
        </div>

        <div class="form-group">
          <label for="email-password" class="form-label">Current Password</label>
          <Password
            id="email-password"
            v-model="emailPassword"
            placeholder="Enter your current password"
            :feedback="false"
            toggle-mask
            class="w-full"
            :pt="{
              root: { class: 'w-full' },
              input: {
                class: 'w-full',
                autocomplete: 'current-password',
                'aria-required': 'true',
                'aria-label': 'Current password for verification'
              }
            }"
            required
          />
          <small class="text-gray-600 dark:text-gray-400">Required to confirm this change</small>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="emailLoading"
          @click="closeEmailDialog"
        />
        <Button label="Update Email" :loading="emailLoading" @click="handleEmailChange" />
      </template>
    </Dialog>

    <!-- Change Password Dialog -->
    <Dialog
      v-model:visible="showPasswordDialog"
      modal
      header="Change Password"
      :style="{ width: '450px' }"
      @hide="closePasswordDialog"
    >
      <div class="space-y-4">
        <div class="form-group">
          <label for="current-password" class="form-label">Current Password</label>
          <Password
            id="current-password"
            v-model="currentPassword"
            placeholder="Enter your current password"
            :feedback="false"
            toggle-mask
            class="w-full"
            :pt="{
              root: { class: 'w-full' },
              input: {
                class: 'w-full',
                autocomplete: 'current-password',
                'aria-required': 'true',
                'aria-label': 'Current password'
              }
            }"
            required
          />
        </div>

        <div class="form-group">
          <label for="new-password-dialog" class="form-label">New Password</label>
          <Password
            id="new-password-dialog"
            v-model="newPassword"
            placeholder="Enter new password"
            toggle-mask
            class="w-full"
            :pt="{
              root: { class: 'w-full' },
              input: {
                class: 'w-full',
                autocomplete: 'new-password',
                'aria-required': 'true',
                'aria-label': 'New password'
              }
            }"
            required
            aria-describedby="new-password-help"
          />
          <small id="new-password-help" class="text-gray-600 dark:text-gray-400">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </small>
        </div>

        <div class="form-group">
          <label for="confirm-password-dialog" class="form-label">Confirm New Password</label>
          <Password
            id="confirm-password-dialog"
            v-model="confirmPassword"
            placeholder="Confirm new password"
            :feedback="false"
            toggle-mask
            class="w-full"
            :class="{ 'p-invalid': passwordMismatch }"
            :pt="{
              root: { class: 'w-full' },
              input: {
                class: 'w-full',
                autocomplete: 'new-password',
                'aria-required': 'true',
                'aria-label': 'Confirm new password',
                'aria-invalid': passwordMismatch ? 'true' : 'false'
              }
            }"
            required
            aria-describedby="confirm-password-error"
          />
          <small v-if="passwordMismatch" id="confirm-password-error" class="p-error" role="alert">
            Passwords do not match
          </small>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="passwordLoading"
          @click="closePasswordDialog"
        />
        <Button label="Update Password" :loading="passwordLoading" @click="handlePasswordChange" />
      </template>
    </Dialog>
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

/* Fix PrimeVue Password component styling */
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100% !important;
}
</style>
