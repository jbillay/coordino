<script setup>
/**
 * LoginView Component
 *
 * User authentication page with multiple sign-in options:
 * - Email and password authentication
 * - Magic link (passwordless) authentication
 * - Links to signup page
 *
 * @component
 * @example
 * <LoginView />
 *
 * Features:
 * - Form validation with accessible error messages
 * - Loading states during authentication
 * - User-friendly error handling
 * - Responsive design with branded left panel
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

/** @type {import('vue').Ref<string>} User's email address */
const email = ref('')

/** @type {import('vue').Ref<string>} User's password */
const password = ref('')

/** @type {import('vue').Ref<string>} Email for magic link authentication */
const magicEmail = ref('')

/** @type {import('vue').Ref<boolean>} Toggle visibility of magic link form */
const showMagicLink = ref(false)

/** @type {import('vue').Ref<Object>} Form validation errors keyed by field name */
const errors = ref({})

/**
 * Validates login form fields
 * @returns {boolean} True if form is valid, false otherwise
 */
const validateForm = () => {
  errors.value = {}

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

  return Object.keys(errors.value).length === 0
}

/**
 * Handles form submission for email/password sign in
 * Validates form, authenticates user, shows feedback, and redirects on success
 */
const handleSignIn = async () => {
  if (!validateForm()) {
    return
  }

  const result = await authStore.signIn(email.value, password.value)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Welcome back!',
      detail: 'You have been signed in successfully',
      life: 3000
    })
    router.push('/dashboard')
  } else {
    toast.add({
      severity: 'error',
      summary: 'Sign in failed',
      detail: result.error,
      life: 5000
    })
  }
}

/**
 * Handles magic link authentication request
 * Validates email, sends magic link, and shows appropriate feedback
 */
const handleMagicLink = async () => {
  if (!magicEmail.value) {
    toast.add({
      severity: 'warn',
      summary: 'Email required',
      detail: 'Please enter your email address',
      life: 3000
    })
    return
  }

  if (!isValidEmail(magicEmail.value)) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid email',
      detail: 'Please enter a valid email address',
      life: 3000
    })
    return
  }

  const result = await authStore.signInWithMagicLink(magicEmail.value)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Check your email',
      detail: 'We sent you a magic link to sign in',
      life: 5000
    })
    showMagicLink.value = false
    magicEmail.value = ''
  } else {
    toast.add({
      severity: 'error',
      summary: 'Failed to send magic link',
      detail: result.error,
      life: 5000
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex" style="background-color: var(--bg-base)">
    <Toast aria-live="polite" aria-atomic="true" />

    <!-- Left Side - Modern Branding -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-gray-900">
      <!-- Modern Content -->
      <div class="flex flex-col justify-center items-center w-full px-16 text-white">
        <!-- Logo -->
        <div class="mb-2">
          <img
            src="/coordino-logo.png"
            alt="Coordino"
            class="h-18 w-auto"
            style="filter: brightness(0) invert(1)"
          />
        </div>

        <!-- Headline -->
        <h1 class="text-4xl font-bold mb-4 text-center">Your productivity hub</h1>
        <p class="text-gray-400 text-center text-lg mb-12 max-w-md">
          Manage tasks, capture notes, and schedule meetings—all in one place
        </p>

        <!-- Modern Features -->
        <div class="space-y-4 max-w-md w-full">
          <div class="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div
              class="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0"
            >
              <i class="pi pi-check-square text-white"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-white mb-1">Task Management</h3>
              <p class="text-gray-400 text-sm">Organize with custom workflows</p>
            </div>
          </div>

          <div class="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div
              class="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0"
            >
              <i class="pi pi-book text-white"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-white mb-1">Smart Notes</h3>
              <p class="text-gray-400 text-sm">Capture and organize ideas</p>
            </div>
          </div>

          <div class="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <div
              class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0"
            >
              <i class="pi pi-calendar text-white"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-white mb-1">Global Scheduling</h3>
              <p class="text-gray-400 text-sm">Schedule across timezones</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side - Modern Login Form -->
    <div
      class="w-full lg:w-1/2 flex items-center justify-center px-8 py-12"
      style="background-color: var(--bg-base)"
    >
      <!-- Mobile Logo -->
      <div class="lg:hidden absolute top-8 left-8">
        <img src="/coordino-logo.png" alt="Coordino" class="h-12 w-auto dark:invert" />
      </div>

      <div class="w-full max-w-md">
        <!-- Modern Welcome -->
        <div class="mb-10">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
          <p class="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <!-- Login Form -->
        <div class="space-y-6">
          <form class="space-y-5" @submit.prevent="handleSignIn">
            <!-- Email Field -->
            <div class="form-group">
              <label for="email" class="form-label">Email address</label>
              <div class="relative">
                <InputText
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="you@example.com"
                  class="w-full pl-11"
                  :class="{ 'p-invalid': errors.email }"
                  :aria-describedby="errors.email ? 'email-error' : undefined"
                  :aria-invalid="errors.email ? 'true' : 'false'"
                />
                <i
                  class="pi pi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                ></i>
              </div>
              <small v-if="errors.email" id="email-error" class="p-error mt-1 block" role="alert">
                {{ errors.email }}
              </small>
            </div>

            <!-- Password Field -->
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <div class="relative">
                <Password
                  id="password"
                  v-model="password"
                  placeholder="Enter your password"
                  :feedback="false"
                  toggle-mask
                  class="w-full"
                  :class="{ 'p-invalid': errors.password }"
                  :pt="{
                    root: { class: 'w-full' },
                    input: {
                      class: 'w-full pl-11',
                      'aria-describedby': errors.password ? 'password-error' : undefined,
                      'aria-invalid': errors.password ? 'true' : 'false'
                    }
                  }"
                />
                <i
                  class="pi pi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  aria-hidden="true"
                ></i>
              </div>
              <small
                v-if="errors.password"
                id="password-error"
                class="p-error mt-1 block"
                role="alert"
              >
                {{ errors.password }}
              </small>
            </div>

            <!-- Sign In Button -->
            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-arrow-right"
              icon-pos="right"
              class="w-full p-button-lg"
              :loading="authStore.loading"
            />
          </form>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span
                class="px-4 text-gray-500 dark:text-gray-400 font-medium"
                style="background-color: var(--bg-base)"
              >
                Or continue with
              </span>
            </div>
          </div>

          <!-- Magic Link Option -->
          <div class="space-y-3">
            <Button
              label="Send Magic Link"
              icon="pi pi-envelope"
              class="w-full p-button-outlined p-button-secondary"
              @click="showMagicLink = !showMagicLink"
            />

            <!-- Magic Link Form -->
            <transition name="slide-down">
              <div
                v-if="showMagicLink"
                class="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <InputText
                  v-model="magicEmail"
                  type="email"
                  placeholder="Enter your email"
                  class="w-full"
                />
                <Button
                  label="Send Magic Link"
                  icon="pi pi-send"
                  icon-pos="right"
                  class="w-full"
                  :loading="authStore.loading"
                  @click="handleMagicLink"
                />
              </div>
            </transition>
          </div>
        </div>

        <!-- Sign Up Link -->
        <div class="mt-8 text-center">
          <p class="text-gray-600 dark:text-gray-400">
            Don't have an account?
            <router-link
              to="/signup"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold ml-1 hover:underline"
            >
              Create one now
            </router-link>
          </p>
        </div>

        <!-- Footer Links -->
        <div class="mt-8 text-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <a href="#" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Privacy
          </a>
          <span>&middot;</span>
          <a href="#" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Terms
          </a>
          <span>&middot;</span>
          <a href="#" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Help
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* Enhanced Glass Card for Login Features */
.glass-card-login {
  @apply p-5 rounded-2xl border border-white/25
         backdrop-blur-md bg-white/10
         shadow-xl;
}

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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
  max-height: 200px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}
</style>
