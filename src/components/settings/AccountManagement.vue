<script setup>
/**
 * AccountManagement Component
 * Feature: 001-user-config - User Story 3 (Account Deletion)
 *
 * Handles account security and deletion:
 * - Password change (placeholder for Phase 6)
 * - Account deletion with multi-step confirmation
 * - Active sessions management (placeholder for Phase 6)
 *
 * @component
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Deletion flow state
const showDeleteWarning = ref(false)
const showDeleteConfirm = ref(false)
const isDeletingAccount = ref(false)
const deleteError = ref(null)

// Handle account deletion - Step 1: Show warning
const handleDeleteAccount = () => {
  deleteError.value = null
  showDeleteWarning.value = true
}

// Handle Step 1 confirmed - Show final confirmation with password
const handleWarningConfirmed = () => {
  showDeleteWarning.value = false
  showDeleteConfirm.value = true
}

// Handle final confirmation with password
const handleFinalConfirmation = async (password) => {
  deleteError.value = null
  isDeletingAccount.value = true

  try {
    // Verify password first
    const { error: signInError } = await authStore.supabase.auth.signInWithPassword({
      email: authStore.user.email,
      password
    })

    if (signInError) {
      deleteError.value = 'Incorrect password. Please try again.'
      isDeletingAccount.value = false
      return
    }

    // Password is correct, proceed with account deletion
    await authStore.deleteAccount()

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Account Deleted',
      detail: 'Your account has been permanently deleted',
      life: 5000
    })

    // Close dialog
    showDeleteConfirm.value = false

    // Redirect to login page
    setTimeout(() => {
      router.push('/login?message=Account deleted successfully')
    }, 1000)
  } catch (err) {
    deleteError.value = err.message || 'Failed to delete account. Please try again.'
    isDeletingAccount.value = false
  }
}

// Handle deletion cancel
const handleDeleteCancel = () => {
  showDeleteWarning.value = false
  showDeleteConfirm.value = false
  deleteError.value = null
  isDeletingAccount.value = false
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Account Security</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Manage your account security and sessions
      </p>
    </div>

    <!-- Placeholder: Active Sessions (Phase 6) -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
      <Message severity="info" :closable="false">
        Active session management will be implemented in a future update. You will be able to view
        and manage devices where you're currently signed in.
      </Message>
    </div>

    <!-- Placeholder: Two-Factor Authentication (Phase 6) -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
      <Message severity="info" :closable="false">
        Two-factor authentication will be implemented in a future update. This will add an extra
        layer of security to your account.
      </Message>
    </div>

    <!-- Danger Zone: Account Deletion -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>

        <div
          class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Delete Account</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <Button
            label="Delete Account"
            icon="pi pi-trash"
            severity="danger"
            outlined
            aria-label="Delete your account permanently"
            @click="handleDeleteAccount"
          />
        </div>
      </div>
    </div>

    <!-- Step 1: Warning Dialog -->
    <ConfirmDialog
      v-model:visible="showDeleteWarning"
      header="Warning: Account Deletion"
      severity="danger"
      confirm-type="type-text"
      confirm-text="DELETE"
      confirm-label="Continue"
      cancel-label="Cancel"
      :message="`⚠️ This action is IRREVERSIBLE!

All your data will be permanently deleted:
• All tasks and todos
• All notes and topics
• All meetings and participants
• All preferences and settings

Your account cannot be recovered after deletion.

Type DELETE to continue with account deletion.`"
      @confirm="handleWarningConfirmed"
      @cancel="handleDeleteCancel"
    />

    <!-- Step 2: Final Confirmation with Password -->
    <ConfirmDialog
      v-model:visible="showDeleteConfirm"
      header="Final Confirmation"
      severity="danger"
      confirm-type="password"
      confirm-label="Permanently Delete Account"
      cancel-label="Cancel"
      :loading="isDeletingAccount"
      :error="deleteError"
      :message="`Enter your password to permanently delete your account.

This is your last chance to cancel. Once you click the delete button, your account and all data will be permanently removed.`"
      @confirm="handleFinalConfirmation"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>

<style scoped>
@reference "tailwindcss";
</style>
