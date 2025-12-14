<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import Toast from 'primevue/toast'
</script>

<template>
  <AppLayout>
    <Toast />
    <router-view />
  </AppLayout>
</template>
