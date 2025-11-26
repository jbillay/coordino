<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <Card class="w-full max-w-md">
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-600 dark:text-primary-400 mb-4"></i>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ message }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ subMessage }}
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabase } from '@/composables/useSupabase'

const router = useRouter()
const { supabase } = useSupabase()

const message = ref('Verifying...')
const subMessage = ref('Please wait while we sign you in')

onMounted(async () => {
  try {
    // Handle the OAuth callback
    const { error } = await supabase.auth.getSession()

    if (error) {
      message.value = 'Authentication failed'
      subMessage.value = error.message
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      message.value = 'Success!'
      subMessage.value = 'Redirecting to dashboard...'
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    message.value = 'Something went wrong'
    subMessage.value = 'Redirecting to login...'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})
</script>
