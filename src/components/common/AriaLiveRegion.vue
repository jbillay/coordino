<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    default: 'polite',
    validator: (value) => ['polite', 'assertive', 'off'].includes(value)
  }
})
</script>

<template>
  <div role="status" :aria-live="priority" aria-atomic="true" class="sr-only">
    {{ message }}
  </div>
</template>

<style scoped>
/* Screen reader only class - visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
