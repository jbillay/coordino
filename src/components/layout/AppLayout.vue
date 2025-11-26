<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <!-- Header with gradient and shadow -->
    <header class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Navigation -->
          <div class="flex items-center space-x-8">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">C</span>
              </div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Coordino
              </h1>
            </div>
            <nav class="hidden md:flex space-x-1">
              <router-link to="/dashboard" class="nav-link">
                <i class="pi pi-home mr-2"></i>
                Dashboard
              </router-link>
              <router-link to="/tasks" class="nav-link">
                <i class="pi pi-check-square mr-2"></i>
                Tasks
              </router-link>
              <router-link to="/notes" class="nav-link">
                <i class="pi pi-book mr-2"></i>
                Notes
              </router-link>
              <router-link to="/scheduling" class="nav-link">
                <i class="pi pi-calendar mr-2"></i>
                Scheduling
              </router-link>
            </nav>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-2">
            <Button
              :icon="themeStore.currentTheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
              class="p-button-rounded p-button-text p-button-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="themeStore.toggleTheme"
              aria-label="Toggle theme"
            />
            <Button
              icon="pi pi-cog"
              class="p-button-rounded p-button-text p-button-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="$router.push('/settings')"
              aria-label="Settings"
            />
            <Button
              icon="pi pi-sign-out"
              class="p-button-rounded p-button-text p-button-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              @click="handleSignOut"
              aria-label="Sign out"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content with better spacing -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
@reference "tailwindcss";

.nav-link {
  @apply px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
         hover:bg-primary-50 dark:hover:bg-gray-700/50 hover:text-primary-700 dark:hover:text-primary-400
         transition-all duration-200 flex items-center;
}

.nav-link.router-link-active {
  @apply bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30
         text-primary-700 dark:text-primary-300 shadow-sm;
}
</style>
