<script setup>
defineProps({
  shortcut: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div
    class="shortcut-item flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
  >
    <span class="text-sm text-gray-700 dark:text-gray-300">{{ label }}</span>
    <kbd class="shortcut-key">{{ shortcut }}</kbd>
  </div>
</template>

<style scoped>
.shortcut-key {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: #374151;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .shortcut-key {
  color: #d1d5db;
  background-color: #374151;
  border-color: #4b5563;
}
</style>
