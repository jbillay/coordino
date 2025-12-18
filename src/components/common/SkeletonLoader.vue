<script setup>
defineProps({
  type: {
    type: String,
    default: 'rect', // 'rect', 'circle', 'text'
    validator: (value) => ['rect', 'circle', 'text'].includes(value)
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1rem'
  },
  borderRadius: {
    type: String,
    default: '4px'
  }
})
</script>

<template>
  <div
    class="skeleton"
    :class="`skeleton-${type}`"
    :style="{
      width,
      height,
      borderRadius: type === 'circle' ? '50%' : borderRadius
    }"
  ></div>
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-interactive, #f3f4f6) 0%,
    var(--bg-hover, #e5e7eb) 50%,
    var(--bg-interactive, #f3f4f6) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  height: 0.875rem;
  border-radius: 4px;
}

.skeleton-circle {
  aspect-ratio: 1;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
