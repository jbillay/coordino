<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
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

      <!-- Login Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome back</h2>
        <form @submit.prevent="handleSignIn" class="space-y-4">
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
              placeholder="Password"
              :feedback="false"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              :pt="{
                input: { class: 'w-full' }
              }"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <Button
            type="submit"
            label="Sign In"
            class="w-full"
            :loading="authStore.loading"
          />
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div class="mt-6">
            <Button
              label="Send Magic Link"
              icon="pi pi-envelope"
              class="w-full p-button-outlined"
              @click="showMagicLink = !showMagicLink"
            />
          </div>

          <div v-if="showMagicLink" class="mt-4 space-y-2">
            <InputText
              v-model="magicEmail"
              type="email"
              placeholder="your@email.com"
              class="w-full"
            />
            <Button
              label="Send Link"
              class="w-full"
              @click="handleMagicLink"
              :loading="authStore.loading"
            />
          </div>
        </div>

        <div class="mt-6 text-center">
          <router-link to="/signup" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            Don't have an account? <span class="underline">Sign up</span>
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

const email = ref('')
const password = ref('')
const magicEmail = ref('')
const showMagicLink = ref(false)
const errors = ref({})

const validateForm = () => {
  errors.value = {}

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

  return Object.keys(errors.value).length === 0
}

const handleSignIn = async () => {
  if (!validateForm()) return

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

  if (!/\S+@\S+\.\S+/.test(magicEmail.value)) {
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
