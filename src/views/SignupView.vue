<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
    <Toast />
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-lg">
          <span class="text-white font-bold text-2xl">C</span>
        </div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          Coordino
        </h1>
        <p class="text-gray-600 dark:text-gray-400">Your productivity hub</p>
      </div>

      <!-- Signup Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create your account</h2>
        <form @submit.prevent="handleSignUp" class="space-y-4">
          <div>
            <label for="fullName" class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
            <InputText
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="John Doe"
              class="w-full"
              :class="{ 'p-invalid': errors.fullName }"
            />
            <small v-if="errors.fullName" class="p-error">{{ errors.fullName }}</small>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password</label>
            <Password
              id="password"
              v-model="password"
              placeholder="Password (min 6 characters)"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              :pt="{
                input: { class: 'w-full' }
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
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Confirm Password</label>
            <Password
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirm password"
              :feedback="false"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.confirmPassword }"
              :pt="{
                input: { class: 'w-full' }
              }"
            />
            <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
          </div>

          <Button
            type="submit"
            label="Sign Up"
            class="w-full"
            :loading="authStore.loading"
          />
        </form>

        <div class="mt-6 text-center">
          <router-link to="/login" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            Already have an account? <span class="underline">Sign in</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errors = ref({})

const validateForm = () => {
  errors.value = {}

  if (!fullName.value) {
    errors.value.fullName = 'Full name is required'
  }

  if (!email.value) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
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

const handleSignUp = async () => {
  if (!validateForm()) return

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
