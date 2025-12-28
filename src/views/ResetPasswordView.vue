<script setup>
/**
 * ResetPasswordView Component
 * Feature: 001-user-config - User Story 1 (Password Reset)
 *
 * Handles two distinct flows:
 * 1. Request Reset: User enters email to receive reset link (FR-001, FR-002)
 * 2. Set New Password: User clicked reset link and sets new password (FR-003, FR-004)
 *
 * @component
 * @example
 * <ResetPasswordView />
 *
 * Features:
 * - Dual-mode interface based on URL parameters
 * - Real-time password strength validation (FR-003)
 * - Accessible form design (WCAG 2.1 Level AA)
 * - User-friendly error handling (FR-005)
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePasswordReset } from '@/composables/usePasswordReset'
import { validatePasswordStrength } from '@/utils/validation'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const route = useRoute()
const passwordReset = usePasswordReset()

// Form state
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordMismatch = ref(false)

// Determine which mode based on URL parameters
const hasResetToken = computed(() => !!(route.query.token || route.hash.includes('type=recovery')))

// Password strength validation
const passwordStrength = computed(() => {
  if (!newPassword.value) {
    return null
  }
  const validation = validatePasswordStrength(newPassword.value)
  return validation
})

// Password strength indicator properties
const strengthLevel = computed(() => {
  if (!newPassword.value) {
    return null
  }
  const validation = passwordStrength.value
  if (!validation.valid) {
    const errorCount = validation.errors.length
    if (errorCount >= 4) {
      return 'weak'
    }
    if (errorCount >= 2) {
      return 'medium'
    }
    return 'medium'
  }
  return 'strong'
})

const strengthColor = computed(() => {
  switch (strengthLevel.value) {
    case 'weak':
      return 'error'
    case 'medium':
      return 'warn'
    case 'strong':
      return 'success'
    default:
      return null
  }
})

const strengthText = computed(() => {
  switch (strengthLevel.value) {
    case 'weak':
      return 'Weak password'
    case 'medium':
      return 'Medium strength'
    case 'strong':
      return 'Strong password'
    default:
      return ''
  }
})

// Password requirements checklist
const passwordRequirements = computed(() => {
  const pwd = newPassword.value
  return [
    { text: 'At least 8 characters', met: pwd.length >= 8 },
    { text: 'One uppercase letter', met: /[A-Z]/.test(pwd) },
    { text: 'One lowercase letter', met: /[a-z]/.test(pwd) },
    { text: 'One number', met: /[0-9]/.test(pwd) },
    { text: 'One special character', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd) }
  ]
})

// Check password confirmation match
const validatePasswordMatch = () => {
  if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
    passwordMismatch.value = true
  } else {
    passwordMismatch.value = false
  }
}

// Handle request password reset (email flow)
const handleRequestReset = async () => {
  await passwordReset.requestPasswordReset(email.value)
}

// Handle update password (token flow)
const handleUpdatePassword = async () => {
  validatePasswordMatch()

  if (passwordMismatch.value) {
    return
  }

  await passwordReset.updatePassword(newPassword.value)

  // On success, redirect to login after 2 seconds
  if (passwordReset.successMessage.value) {
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
}

// Handle retry after error
const handleRetry = () => {
  passwordReset.resetState()
  if (hasResetToken.value) {
    newPassword.value = ''
    confirmPassword.value = ''
  } else {
    email.value = ''
  }
}

// Check for recovery token in URL hash on mount
onMounted(() => {
  // Supabase Auth uses URL hash for recovery tokens
  const { hash } = window.location
  if (hash.includes('type=recovery')) {
    // Token is automatically handled by Supabase Auth
    // User can now set new password
  }
})
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center px-4 py-12"
    style="background-color: var(--bg-base)"
  >
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <router-link to="/login" class="inline-block mb-6">
          <img src="/coordino-logo.png" alt="Coordino" class="h-12 w-auto dark:invert" />
        </router-link>

        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ hasResetToken ? 'Set New Password' : 'Reset Password' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{
            hasResetToken
              ? 'Enter your new password below'
              : 'Enter your email to receive a reset link'
          }}
        </p>
      </div>

      <!-- Success Message -->
      <Message
        v-if="passwordReset.successMessage.value"
        :severity="strengthColor || 'success'"
        :closable="false"
        class="mb-4"
      >
        {{ passwordReset.successMessage.value }}
      </Message>

      <!-- Error Message -->
      <Message v-if="passwordReset.error.value" severity="error" :closable="false" class="mb-4">
        <div class="flex flex-col gap-2">
          <span>{{ passwordReset.error.value }}</span>
          <div class="flex gap-2">
            <Button
              label="Try Again"
              size="small"
              severity="secondary"
              text
              class="self-start"
              @click="handleRetry"
            />
            <Button
              v-if="hasResetToken"
              label="Request New Link"
              size="small"
              severity="secondary"
              text
              class="self-start"
              @click="router.push('/reset-password')"
            />
          </div>
        </div>
      </Message>

      <!-- Request Reset Form (Email Flow) -->
      <form v-if="!hasResetToken" class="space-y-6" @submit.prevent="handleRequestReset">
        <div class="form-group">
          <label for="email" class="form-label">Email address</label>
          <div class="relative">
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full pl-11"
              :disabled="passwordReset.isLoading.value || passwordReset.emailSent.value"
              required
            />
            <i
              class="pi pi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            ></i>
          </div>
        </div>

        <Button
          type="submit"
          label="Send Reset Link"
          icon="pi pi-send"
          icon-pos="right"
          class="w-full p-button-lg"
          :loading="passwordReset.isLoading.value"
          :disabled="passwordReset.emailSent.value"
        />
      </form>

      <!-- Set New Password Form (Token Flow) -->
      <form v-else class="space-y-6" @submit.prevent="handleUpdatePassword">
        <!-- New Password Field -->
        <div class="form-group">
          <label for="new-password" class="form-label">New Password</label>
          <div class="relative">
            <Password
              id="new-password"
              v-model="newPassword"
              placeholder="Enter your new password"
              :feedback="false"
              toggle-mask
              class="w-full"
              :pt="{
                root: { class: 'w-full' },
                input: {
                  class: 'w-full pl-11'
                }
              }"
              required
              @input="validatePasswordMatch"
            />
            <i
              class="pi pi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              aria-hidden="true"
            ></i>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="newPassword" class="mt-2 space-y-1">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-300"
                  :class="{
                    'bg-red-500 w-1/3': strengthLevel === 'weak',
                    'bg-yellow-500 w-2/3': strengthLevel === 'medium',
                    'bg-green-500 w-full': strengthLevel === 'strong'
                  }"
                ></div>
              </div>
              <span
                class="text-xs font-medium"
                :class="{
                  'text-red-600 dark:text-red-400': strengthLevel === 'weak',
                  'text-yellow-600 dark:text-yellow-400': strengthLevel === 'medium',
                  'text-green-600 dark:text-green-400': strengthLevel === 'strong'
                }"
              >
                {{ strengthText }}
              </span>
            </div>

            <!-- Password Requirements -->
            <ul class="text-xs space-y-1 mt-2" role="list">
              <li
                v-for="(req, index) in passwordRequirements"
                :key="index"
                class="flex items-center gap-2"
              >
                <i
                  :class="req.met ? 'pi pi-check text-green-600' : 'pi pi-times text-gray-400'"
                  class="text-xs"
                  aria-hidden="true"
                ></i>
                <span
                  :class="
                    req.met
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  {{ req.text }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label for="confirm-password" class="form-label">Confirm Password</label>
          <div class="relative">
            <Password
              id="confirm-password"
              v-model="confirmPassword"
              placeholder="Confirm your new password"
              :feedback="false"
              toggle-mask
              class="w-full"
              :class="{ 'p-invalid': passwordMismatch }"
              :pt="{
                root: { class: 'w-full' },
                input: {
                  class: 'w-full pl-11'
                }
              }"
              required
              @input="validatePasswordMatch"
            />
            <i
              class="pi pi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              aria-hidden="true"
            ></i>
          </div>
          <small v-if="passwordMismatch" class="p-error mt-1 block" role="alert">
            Passwords do not match
          </small>
        </div>

        <Button
          type="submit"
          label="Update Password"
          icon="pi pi-check"
          icon-pos="right"
          class="w-full p-button-lg"
          :loading="passwordReset.isLoading.value"
          :disabled="!passwordStrength?.valid || passwordMismatch"
        />
      </form>

      <!-- Back to Login Link -->
      <div class="mt-6 text-center">
        <router-link
          to="/login"
          class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 font-medium hover:underline inline-flex items-center gap-2"
        >
          <i class="pi pi-arrow-left text-xs"></i>
          Back to Login
        </router-link>
      </div>
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

/* Fix PrimeVue Password component styling */
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100% !important;
  padding-left: 2.75rem !important;
}
</style>
