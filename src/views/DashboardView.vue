<script setup>
/**
 * DashboardView Component
 *
 * Main dashboard displaying overview of tasks, notes, and upcoming meetings.
 * Shows personalized greeting and quick access to key features.
 *
 * @component
 * @example
 * <DashboardView />
 *
 * Features:
 * - Personalized time-based greeting
 * - Task statistics (urgent, high priority, overdue)
 * - Recent tasks list with priority badges
 * - Recent notes preview
 * - Upcoming meetings with timezone information
 */
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/features/tasks/store'
import { getTaskStats } from '@/features/tasks/utils'
import AppLayout from '@/components/layout/AppLayout.vue'
import TaskCard from '@/features/tasks/components/TaskCard.vue'
import ContinueSection from '@/components/dashboard/ContinueSection.vue'
import StatCardSkeleton from '@/components/skeletons/StatCardSkeleton.vue'

const router = useRouter()
const authStore = useAuthStore()
const taskStore = useTaskStore()

onMounted(() => {
  taskStore.initialize()
})

onBeforeUnmount(() => {
  taskStore.unsubscribeFromTasks()
})

const taskStats = computed(() => getTaskStats(taskStore.tasks))

/**
 * Navigate to tasks with specific filter
 * @param {string} filter - Filter type to apply
 */
const navigateToTasks = (filter) => {
  router.push({ name: 'tasks', query: { filter } })
}

/**
 * Gets appropriate greeting based on current time of day
 * @returns {string} 'Morning', 'Afternoon', or 'Evening'
 */
const timeOfDay = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) {
    return 'Morning'
  }
  if (hour < 18) {
    return 'Afternoon'
  }
  return 'Evening'
})

/**
 * Gets user's first name for personalized greeting
 * Falls back to email username or generic greeting
 * @returns {string} User's first name or fallback
 */
const getUserFirstName = computed(() => {
  const { user } = authStore
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name.split(' ')[0]
  }
  if (user?.email) {
    return user.email.split('@')[0]
  }
  return 'there'
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Header with Greeting and Add Task Button -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Good {{ timeOfDay }}, {{ getUserFirstName }}
        </h1>
      </div>

      <!-- Continue Where You Left Off Section -->
      <ContinueSection />

      <!-- Stat Cards: Interactive with click-to-filter -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- Loading Skeletons -->
        <template v-if="taskStore.loading">
          <StatCardSkeleton v-for="i in 3" :key="i" />
        </template>

        <!-- Actual Stat Cards -->
        <template v-else>
          <!-- Urgent Tasks -->
          <div
            class="stat-card interactive"
            role="button"
            tabindex="0"
            aria-label="View urgent tasks"
            @click="navigateToTasks('urgent')"
            @keydown.enter="navigateToTasks('urgent')"
          >
            <div class="stat-icon urgent">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ taskStats.byPriority.urgent }}</div>
              <div class="stat-label">Urgent</div>
            </div>
            <div class="stat-arrow">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>

          <!-- High Priority Tasks -->
          <div
            class="stat-card interactive"
            role="button"
            tabindex="0"
            aria-label="View high priority tasks"
            @click="navigateToTasks('high-priority')"
            @keydown.enter="navigateToTasks('high-priority')"
          >
            <div class="stat-icon high-priority">
              <i class="pi pi-flag"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ taskStats.byPriority.high }}</div>
              <div class="stat-label">High Priority</div>
            </div>
            <div class="stat-arrow">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>

          <!-- Overdue Tasks -->
          <div
            class="stat-card interactive"
            role="button"
            tabindex="0"
            aria-label="View overdue tasks"
            @click="navigateToTasks('overdue')"
            @keydown.enter="navigateToTasks('overdue')"
          >
            <div class="stat-icon overdue">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value error">{{ taskStats.overdue }}</div>
              <div class="stat-label">Overdue</div>
            </div>
            <div class="stat-arrow">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </template>
      </div>

      <!-- Two Column Layout: My Tasks & Recent Notes -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- My Tasks Section -->
        <div class="content-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">My Tasks</h2>
            <router-link
              :to="{ name: 'tasks' }"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </router-link>
          </div>
          <div class="space-y-3">
            <div v-if="taskStore.activeTasks.length > 0">
              <TaskCard
                v-for="task in taskStore.activeTasks.slice(0, 5)"
                :key="task.id"
                :task="task"
                @edit="taskStore.editTask(task)"
                @delete="taskStore.deleteTask(task.id)"
                @toggle-complete="taskStore.toggleComplete(task)"
              />
            </div>
            <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
              No active tasks. Time to relax or add a new one!
            </div>
          </div>
        </div>

        <!-- Recent Notes Section -->
        <div class="content-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Recent Notes</h2>
            <a href="#" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </a>
          </div>
          <div class="space-y-4">
            <!-- Note Item 1 -->
            <div class="note-item">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Project Alpha Kickoff Ideas
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Updated 2 minutes ago</p>
            </div>

            <!-- Note Item 2 -->
            <div class="note-item">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Q4 Planning Session
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Updated 1 hour ago</p>
            </div>

            <!-- Note Item 3 -->
            <div class="note-item">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Competitor Analysis Summary
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Updated 3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Meetings Section -->
      <div class="content-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Upcoming Meetings</h2>
          <a href="#" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View Calendar
          </a>
        </div>
        <div class="space-y-4">
          <!-- Meeting 1 -->
          <div class="meeting-item">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Weekly Sync with Tokyo Team
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Monday at 8:00 AM EST (9:00 PM JST)
                </p>
              </div>
            </div>
            <div class="meeting-timeline">
              <div
                class="timeline-bar"
                style="background: linear-gradient(to right, #10b981 0%, #10b981 100%)"
              ></div>
            </div>
          </div>

          <!-- Meeting 2 -->
          <div class="meeting-item">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Design Review - London & NYC
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Tuesday at 2:00 PM EST (7:00 PM GMT)
                </p>
              </div>
            </div>
            <div class="meeting-timeline">
              <div
                class="timeline-bar"
                style="background: linear-gradient(to right, #f59e0b 0%, #f59e0b 100%)"
              ></div>
            </div>
          </div>

          <!-- Meeting 3 -->
          <div class="meeting-item">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Product Strategy Session
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Thu, Oct 26 at 10:00 AM EST (3:00 PM GMT)
                </p>
              </div>
            </div>
            <div class="meeting-timeline">
              <div
                class="timeline-bar"
                style="background: linear-gradient(to right, #f59e0b 0%, #f59e0b 100%)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style>
@reference "tailwindcss";

/* Add New Task Button */
.add-task-btn {
  @apply px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
         hover:bg-blue-700 transition-colors duration-200
         flex items-center gap-2;
}

.dark .add-task-btn {
  @apply bg-blue-600 hover:bg-blue-700;
}

/* Stat Cards */
.stat-card {
  @apply bg-white border border-gray-200 rounded-lg p-5
         hover:shadow-md transition-all duration-200;
}

.dark .stat-card {
  @apply bg-gray-800 border-gray-700;
}

/* Content Cards */
.content-card {
  @apply bg-white border border-gray-200 rounded-lg p-5
         hover:shadow-md transition-all duration-200;
}

.dark .content-card {
  @apply bg-gray-800 border-gray-700;
}

/* Task Items */
.task-item {
  @apply flex items-start gap-3 p-3 rounded-lg
         hover:bg-gray-50 transition-colors duration-150;
}

.dark .task-item {
  @apply hover:bg-gray-700/50;
}

.task-checkbox {
  @apply mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600
         focus:ring-blue-500 focus:ring-2
         cursor-pointer;
}

.dark .task-checkbox {
  @apply border-gray-600 bg-gray-700;
}

/* Priority Badges */
.priority-badge {
  @apply px-2 py-0.5 rounded text-xs font-medium;
}

.priority-badge.urgent {
  @apply bg-red-50 text-red-700 border border-red-200;
}

.dark .priority-badge.urgent {
  @apply bg-red-500/10 text-red-400 border-red-500/20;
}

.priority-badge.high {
  @apply bg-orange-50 text-orange-700 border border-orange-200;
}

.dark .priority-badge.high {
  @apply bg-orange-500/10 text-orange-400 border-orange-500/20;
}

/* Note Items */
.note-item {
  @apply p-3 rounded-lg hover:bg-gray-50
         transition-colors duration-150 cursor-pointer;
}

.dark .note-item {
  @apply hover:bg-gray-700/50;
}

/* Meeting Items */
.meeting-item {
  @apply pb-4;
}

.meeting-item:not(:last-child) {
  @apply border-b border-gray-200;
}

.dark .meeting-item:not(:last-child) {
  @apply border-gray-700;
}

/* Meeting Timeline */
.meeting-timeline {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.dark .meeting-timeline {
  @apply bg-gray-700;
}

.timeline-bar {
  @apply h-full rounded-full;
}

/* Interactive Stat Cards */
.stat-card {
  @apply relative flex items-center gap-4 p-5
         bg-white dark:bg-gray-800
         border border-gray-200 dark:border-gray-700
         rounded-lg overflow-hidden;
  transition: all 0.2s ease;
}

.stat-card.interactive {
  @apply cursor-pointer;
}

.stat-card.interactive:hover {
  transform: scale(1.02);
  border-color: var(--brand-teal-500);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.interactive:hover .stat-arrow {
  opacity: 1;
  transform: translateX(0);
}

.stat-icon {
  @apply flex items-center justify-center
         w-12 h-12 rounded-xl flex-shrink-0;
  background: var(--brand-teal-100);
  color: var(--brand-teal-600);
  font-size: 1.5rem;
}

.dark .stat-icon {
  background: rgba(20, 184, 166, 0.2);
  color: var(--brand-teal-400);
}

.stat-icon.urgent {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.dark .stat-icon.urgent {
  background: rgba(245, 158, 11, 0.2);
  color: var(--color-warning);
}

.stat-icon.high-priority {
  background: var(--brand-teal-100);
  color: var(--brand-teal-600);
}

.dark .stat-icon.high-priority {
  background: rgba(20, 184, 166, 0.2);
  color: var(--brand-teal-400);
}

.stat-icon.overdue {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.dark .stat-icon.overdue {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
}

.stat-content {
  @apply flex-1 min-w-0;
}

.stat-value {
  @apply text-3xl font-bold text-gray-900 dark:text-white leading-none mb-1;
}

.stat-value.error {
  @apply text-red-600 dark:text-red-500;
}

.stat-label {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.stat-arrow {
  @apply opacity-0 transform translate-x-2 transition-all duration-200;
  color: var(--brand-teal-500);
  font-size: 1.25rem;
}

/* Focus indicator for stat cards */
.stat-card.interactive:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: 2px;
}

/* Mobile: Always show arrow */
@media (max-width: 640px) {
  .stat-card.interactive .stat-arrow {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Animation */
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .stat-arrow {
    transition: none;
  }

  .stat-card.interactive:hover {
    transform: none;
  }
}
</style>
