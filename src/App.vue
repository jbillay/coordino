<script setup>
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <div :class="themeStore.currentTheme">
    <router-view />
  </div>
</template>

<style>
/* Global styles are imported in main.js */
</style>
