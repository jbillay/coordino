<template>
  <AppLayout>
    <div class="space-y-8">
      <!-- Welcome Header with gradient -->
      <div class="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 class="text-4xl font-bold mb-2">
          Welcome back, {{ authStore.user?.user_metadata?.full_name || 'there' }}! 👋
        </h1>
        <p class="text-primary-100 text-lg">
          Your productivity hub is ready. Let's get things done!
        </p>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Tasks Card -->
        <div class="feature-card group cursor-pointer" @click="$router.push('/tasks')">
          <div class="feature-icon bg-gradient-to-br from-blue-500 to-blue-600">
            <i class="pi pi-check-square text-3xl text-white"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Manage your tasks and stay organized with custom workflows
          </p>
          <div class="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:gap-3 gap-2 transition-all">
            Get Started <i class="pi pi-arrow-right text-sm"></i>
          </div>
        </div>

        <!-- Notes Card -->
        <div class="feature-card group cursor-pointer" @click="$router.push('/notes')">
          <div class="feature-icon bg-gradient-to-br from-purple-500 to-purple-600">
            <i class="pi pi-book text-3xl text-white"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Notes</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Capture ideas and organize your thoughts by topics
          </p>
          <div class="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:gap-3 gap-2 transition-all">
            Get Started <i class="pi pi-arrow-right text-sm"></i>
          </div>
        </div>

        <!-- Scheduling Card -->
        <div class="feature-card group cursor-pointer" @click="$router.push('/scheduling')">
          <div class="feature-icon bg-gradient-to-br from-green-500 to-green-600">
            <i class="pi pi-calendar text-3xl text-white"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Scheduling</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
            Coordinate meetings across international time zones
          </p>
          <div class="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:gap-3 gap-2 transition-all">
            Get Started <i class="pi pi-arrow-right text-sm"></i>
          </div>
        </div>
      </div>

      <!-- Getting Started Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <i class="pi pi-info-circle text-white"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Getting Started</h2>
        </div>
        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400 text-lg">
            Welcome to Coordino! This is your productivity hub where you can:
          </p>
          <div class="grid md:grid-cols-2 gap-4 mt-6">
            <div class="flex gap-3">
              <i class="pi pi-check-circle text-green-500 mt-1"></i>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Task Management</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Create and manage tasks with custom workflows</p>
              </div>
            </div>
            <div class="flex gap-3">
              <i class="pi pi-check-circle text-green-500 mt-1"></i>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Smart Notes</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Take notes organized by topics</p>
              </div>
            </div>
            <div class="flex gap-3">
              <i class="pi pi-check-circle text-green-500 mt-1"></i>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Global Scheduling</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Schedule meetings with timezone support</p>
              </div>
            </div>
            <div class="flex gap-3">
              <i class="pi pi-check-circle text-green-500 mt-1"></i>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Customization</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Personalize with themes and settings</p>
              </div>
            </div>
          </div>
          <div class="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <p class="text-sm text-primary-800 dark:text-primary-300">
              <i class="pi pi-info-circle mr-2"></i>
              <strong>Phase 1 Complete!</strong> Authentication & Foundation is ready. Phases 2-5 will add full task management, notes, and scheduling features.
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const authStore = useAuthStore()
</script>

<style scoped>
@reference "tailwindcss";

.feature-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700
         hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700
         transition-all duration-300 flex flex-col
         hover:-translate-y-1;
}

.feature-icon {
  @apply w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-md;
}
</style>
