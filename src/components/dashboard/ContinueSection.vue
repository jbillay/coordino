<script setup>
import { useRouter } from 'vue-router'
import { useActivityStore } from '@/stores/activity'

const router = useRouter()
const activityStore = useActivityStore()

const recentActivities = activityStore.getRecentActivities(5)

/**
 * Get icon class for activity type
 */
const getActivityIcon = (type) => {
  const icons = {
    task: 'pi-check-circle',
    note: 'pi-file-edit',
    meeting: 'pi-calendar'
  }
  return icons[type] || 'pi-circle'
}

/**
 * Get color for activity type
 */
const getActivityColor = (type) => {
  const colors = {
    task: 'var(--brand-teal-500)',
    note: 'var(--color-accent-purple, #8b5cf6)',
    meeting: 'var(--color-accent-ocean, #0891b2)'
  }
  return colors[type] || 'var(--text-muted)'
}

/**
 * Format timestamp as relative time
 */
const formatTimestamp = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return 'just now'
  }
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  if (hours < 24) {
    return `${hours}h ago`
  }
  if (days < 7) {
    return `${days}d ago`
  }
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Navigate to item based on activity type
 */
const navigateToItem = (activity) => {
  const routes = {
    task: { name: 'tasks', query: { id: activity.id } },
    note: { name: 'notes', query: { id: activity.id } },
    meeting: { name: 'scheduling-detail', params: { id: activity.id } }
  }

  const route = routes[activity.type]
  if (route) {
    router.push(route)
  }
}
</script>

<template>
  <div v-if="recentActivities.length > 0" class="continue-section">
    <h2 class="section-title">Continue where you left off</h2>
    <div class="activity-list">
      <div
        v-for="activity in recentActivities"
        :key="`${activity.type}-${activity.id}`"
        class="activity-item"
        role="button"
        tabindex="0"
        @click="navigateToItem(activity)"
        @keydown.enter="navigateToItem(activity)"
      >
        <div class="activity-icon" :style="{ color: getActivityColor(activity.type) }">
          <i class="pi" :class="getActivityIcon(activity.type)"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">{{ activity.title }}</div>
          <div class="activity-meta">
            <span class="activity-type">{{ activity.type }}</span>
            <span class="activity-separator">•</span>
            <span class="activity-time">{{ formatTimestamp(activity.timestamp) }}</span>
          </div>
        </div>
        <div class="activity-arrow">
          <i class="pi pi-arrow-right"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.continue-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid var(--border-default);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: var(--bg-hover);
}

.activity-item:hover .activity-arrow {
  opacity: 1;
  transform: translateX(0);
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-interactive);
  font-size: 18px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.25rem;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.activity-type {
  text-transform: capitalize;
}

.activity-separator {
  opacity: 0.5;
}

.activity-arrow {
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
  color: var(--text-tertiary);
  font-size: 1rem;
  flex-shrink: 0;
}

/* Focus indicator */
.activity-item:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: -2px;
}

/* Mobile: Always show arrow */
@media (max-width: 768px) {
  .activity-arrow {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .activity-item,
  .activity-arrow {
    transition: none;
  }
}
</style>
