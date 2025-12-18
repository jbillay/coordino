<script setup>
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
</script>

<template>
  <div class="stat-card-skeleton" aria-busy="true">
    <SkeletonLoader type="rect" width="48px" height="48px" border-radius="12px" />
    <div class="stat-skeleton-content">
      <SkeletonLoader type="text" width="60px" height="32px" />
      <SkeletonLoader type="text" width="80px" height="14px" />
    </div>
  </div>
</template>

<style scoped>
.stat-card-skeleton {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 8px;
}

.dark .stat-card-skeleton {
  background: var(--bg-surface, #1f1f1f);
  border-color: var(--border-default, #374151);
}

.stat-skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
