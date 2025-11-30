<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.init()
})
</script>

<template>
  <div :class="themeStore.currentTheme">
    <router-view />
  </div>
</template>

<style>
/* Global styles are imported in main.js */
</style>
