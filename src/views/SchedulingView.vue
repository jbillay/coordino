<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import Toast from 'primevue/toast'
</script>

<template>
  <AppLayout>
    <Toast />
    <router-view />
  </AppLayout>
</template>
