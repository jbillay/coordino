<script setup>
/**
 * SignupView Component
 *
 * User registration page for creating new accounts.
 * Collects user information and creates authenticated account.
 *
 * @component
 * @example
 * <SignupView />
 *
 * Features:
 * - Full name, email, and password collection
 * - Password confirmation validation
 * - Real-time form validation with accessible error messages
 * - Password strength suggestions
 * - Loading states during registration
 * - Automatic sign-in after successful registration
 * - WCAG 2.1 Level AA compliant
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import { isValidEmail } from '@/utils/validation'

// Import PrimeVue components locally for code splitting
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

/** @type {import('vue').Ref<string>} User's full name */
const fullName = ref('')

/** @type {import('vue').Ref<string>} User's email address */
const email = ref('')

/** @type {import('vue').Ref<string>} User's password */
const password = ref('')

/** @type {import('vue').Ref<string>} Password confirmation */
const confirmPassword = ref('')

/** @type {import('vue').Ref<Object>} Form validation errors keyed by field name */
const errors = ref({})

/**
 * Validates signup form fields
 * Checks all required fields, email format, password strength, and password match
 * @returns {boolean} True if form is valid, false otherwise
 */
const validateForm = () => {
  errors.value = {}

  if (!fullName.value) {
    errors.value.fullName = 'Full name is required'
  }

  if (!email.value) {
    errors.value.email = 'Email is required'
  } else if (!isValidEmail(email.value)) {
    errors.value.email = 'Email is invalid'
  }

  if (!password.value) {
    errors.value.password = 'Password is required'
  } else if (password.value.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }

  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Please confirm your password'
  } else if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match'
  }

  return Object.keys(errors.value).length === 0
}

/**
 * Handles form submission for user registration
 * Validates form, creates account, shows feedback, and redirects on success
 */
const handleSignUp = async () => {
  if (!validateForm()) {
    return
  }

  const result = await authStore.signUp(email.value, password.value, fullName.value)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Account created!',
      detail: 'Welcome to Coordino',
      life: 3000
    })
    router.push('/dashboard')
  } else {
    toast.add({
      severity: 'error',
      summary: 'Sign up failed',
      detail: result.error,
      life: 5000
    })
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12"
  >
    <Toast aria-live="polite" aria-atomic="true" />
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-lg"
        >
          <span class="text-white font-bold text-2xl">C</span>
        </div>
        <h1
          class="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2"
        >
          Coordino
        </h1>
        <p class="text-gray-600 dark:text-gray-400">Your productivity hub</p>
      </div>

      <!-- Signup Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
      >
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create your account</h2>
        <form class="space-y-4" @submit.prevent="handleSignUp">
          <div>
            <label
              for="fullName"
              class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>
            <InputText
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="John Doe"
              class="w-full"
              :class="{ 'p-invalid': errors.fullName }"
              :aria-describedby="errors.fullName ? 'fullName-error' : undefined"
              :aria-invalid="errors.fullName ? 'true' : 'false'"
            />
            <small v-if="errors.fullName" id="fullName-error" class="p-error" role="alert">
              {{ errors.fullName }}
            </small>
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
              :aria-describedby="errors.email ? 'email-error' : undefined"
              :aria-invalid="errors.email ? 'true' : 'false'"
            />
            <small v-if="errors.email" id="email-error" class="p-error" role="alert">
              {{ errors.email }}
            </small>
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Password (min 6 characters)"
              toggle-mask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              :pt="{
                input: {
                  class: 'w-full',
                  'aria-describedby': errors.password ? 'password-error' : undefined,
                  'aria-invalid': errors.password ? 'true' : 'false'
                }
              }"
            >
              <template #footer>
                <p class="text-xs mt-2 text-gray-600 dark:text-gray-400">Suggestions:</p>
                <ul class="text-xs mt-1 ml-2 text-gray-600 dark:text-gray-400">
                  <li>At least 6 characters</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include numbers</li>
                </ul>
              </template>
            </Password>
            <small v-if="errors.password" id="password-error" class="p-error" role="alert">
              {{ errors.password }}
            </small>
          </div>

          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              Confirm Password
            </label>
            <Password
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirm password"
              :feedback="false"
              toggle-mask
              class="w-full"
              :class="{ 'p-invalid': errors.confirmPassword }"
              :pt="{
                input: {
                  class: 'w-full',
                  'aria-describedby': errors.confirmPassword ? 'confirmPassword-error' : undefined,
                  'aria-invalid': errors.confirmPassword ? 'true' : 'false'
                }
              }"
            />
            <small
              v-if="errors.confirmPassword"
              id="confirmPassword-error"
              class="p-error"
              role="alert"
            >
              {{ errors.confirmPassword }}
            </small>
          </div>

          <Button type="submit" label="Sign Up" class="w-full" :loading="authStore.loading" />
        </form>

        <div class="mt-6 text-center">
          <router-link
            to="/login"
            class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Already have an account?
            <span class="underline">Sign in</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
