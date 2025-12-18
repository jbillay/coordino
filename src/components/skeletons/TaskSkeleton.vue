<script setup>
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'

defineProps({
  count: {
    type: Number,
    default: 5
  }
})
</script>

<template>
  <div class="task-skeleton-list" aria-busy="true" aria-label="Loading tasks">
    <div v-for="i in count" :key="i" class="task-skeleton-item">
      <SkeletonLoader type="circle" width="20px" height="20px" />
      <div class="task-skeleton-content">
        <SkeletonLoader type="text" :width="`${60 + Math.random() * 30}%`" height="14px" />
        <div class="task-skeleton-meta">
          <SkeletonLoader type="rect" width="60px" height="18px" border-radius="12px" />
          <SkeletonLoader type="rect" width="80px" height="18px" border-radius="12px" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-skeleton-list {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.dark .task-skeleton-list {
  background: var(--bg-surface, #1f1f1f);
  border-color: var(--border-default, #374151);
}

.task-skeleton-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--border-default, #e5e7eb);
}

.dark .task-skeleton-item {
  border-color: var(--border-default, #374151);
}

.task-skeleton-item:last-child {
  border-bottom: none;
}

.task-skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-skeleton-meta {
  display: flex;
  gap: 0.5rem;
}
</style>
