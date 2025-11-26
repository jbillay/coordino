<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Coordino</h1>
            <nav class="hidden md:flex space-x-4">
              <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
              <router-link to="/tasks" class="nav-link">Tasks</router-link>
              <router-link to="/notes" class="nav-link">Notes</router-link>
              <router-link to="/scheduling" class="nav-link">Scheduling</router-link>
            </nav>
          </div>

          <div class="flex items-center space-x-4">
            <Button
              :icon="themeStore.currentTheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
              class="p-button-rounded p-button-text"
              @click="themeStore.toggleTheme"
              aria-label="Toggle theme"
            />
            <Button
              icon="pi pi-cog"
              class="p-button-rounded p-button-text"
              @click="$router.push('/settings')"
              aria-label="Settings"
            />
            <Button
              icon="pi pi-sign-out"
              class="p-button-rounded p-button-text"
              @click="handleSignOut"
              aria-label="Sign out"
            />
          </div>
        </div>
      </div>
    </header>

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
  @apply px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.nav-link.router-link-active {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white;
}
</style>
