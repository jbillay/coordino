<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {{ authStore.user?.user_metadata?.full_name || 'there' }}!
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <template #title>
            <div class="flex items-center gap-3">
              <i class="pi pi-check-square text-2xl text-primary-600 dark:text-primary-400"></i>
              <span class="text-lg">Tasks</span>
            </div>
          </template>
          <template #content>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Manage your tasks and stay organized
            </p>
            <Button
              label="Go to Tasks"
              icon="pi pi-arrow-right"
              iconPos="right"
              @click="$router.push('/tasks')"
              class="w-full"
            />
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-3">
              <i class="pi pi-book text-2xl text-primary-600 dark:text-primary-400"></i>
              <span class="text-lg">Notes</span>
            </div>
          </template>
          <template #content>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Capture ideas and organize your thoughts
            </p>
            <Button
              label="Go to Notes"
              icon="pi pi-arrow-right"
              iconPos="right"
              @click="$router.push('/notes')"
              class="w-full"
            />
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-3">
              <i class="pi pi-calendar text-2xl text-primary-600 dark:text-primary-400"></i>
              <span class="text-lg">Scheduling</span>
            </div>
          </template>
          <template #content>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Coordinate meetings across time zones
            </p>
            <Button
              label="Go to Scheduling"
              icon="pi pi-arrow-right"
              iconPos="right"
              @click="$router.push('/scheduling')"
              class="w-full"
            />
          </template>
        </Card>
      </div>

      <Card>
        <template #title>Getting Started</template>
        <template #content>
          <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400">
              Welcome to Coordino! This is your productivity hub where you can:
            </p>
            <ul class="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Create and manage tasks with custom workflows</li>
              <li>Take notes organized by topics</li>
              <li>Schedule international meetings with timezone support</li>
              <li>Customize your experience with themes and settings</li>
            </ul>
            <p class="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Phase 1 (Authentication & Foundation) is complete! Phases 2-5 will add the full task management, notes, and scheduling features.
            </p>
          </div>
        </template>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const authStore = useAuthStore()
</script>
