<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isExpanded = ref(false)

const toggleMenu = () => {
  isExpanded.value = !isExpanded.value
}

const closeMenu = () => {
  isExpanded.value = false
}

const createTask = () => {
  closeMenu()
  router.push({ name: 'tasks', query: { action: 'create' } })
}

const createNote = () => {
  closeMenu()
  router.push({ name: 'notes-create' })
}

const createMeeting = () => {
  closeMenu()
  router.push({ name: 'scheduling-create' })
}

// Close on ESC key
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}
</script>

<template>
  <div class="fab-container" @keydown="handleEscape">
    <!-- Backdrop for click-outside -->
    <div v-if="isExpanded" class="fab-backdrop" aria-hidden="true" @click="closeMenu"></div>

    <!-- FAB Menu -->
    <div class="fab-menu" :class="{ expanded: isExpanded }">
      <button class="fab-item" aria-label="Create new task" @click="createTask">
        <i class="pi pi-check-circle"></i>
        <span>New Task</span>
      </button>
      <button class="fab-item" aria-label="Create new note" @click="createNote">
        <i class="pi pi-file-edit"></i>
        <span>New Note</span>
      </button>
      <button class="fab-item" aria-label="Create new meeting" @click="createMeeting">
        <i class="pi pi-calendar-plus"></i>
        <span>New Meeting</span>
      </button>
    </div>

    <!-- Main FAB Button -->
    <button
      class="fab-main"
      :aria-expanded="isExpanded"
      aria-label="Quick actions"
      @click="toggleMenu"
    >
      <i class="pi" :class="isExpanded ? 'pi-times' : 'pi-plus'"></i>
    </button>
  </div>
</template>

<style scoped>
.fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.fab-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
}

.fab-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--brand-teal-500);
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  transition: all 0.2s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-main:hover {
  background: var(--brand-teal-600);
  box-shadow: 0 6px 16px rgba(20, 184, 166, 0.4);
  transform: scale(1.05);
}

.fab-main:active {
  transform: scale(0.95);
}

.fab-menu {
  position: absolute;
  bottom: 72px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(20px);
  transition: all 0.2s ease-out;
  z-index: 1000;
}

.fab-menu.expanded {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0);
}

.fab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 28px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-out;
  color: var(--text-primary);
}

.fab-item:hover {
  background: var(--bg-hover);
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.fab-item i {
  font-size: 18px;
  color: var(--brand-teal-500);
}

/* Accessibility: Focus indicators */
.fab-main:focus-visible,
.fab-item:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: 2px;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .fab-main,
  .fab-menu,
  .fab-item {
    transition: none;
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .fab-container {
    bottom: 16px;
    right: 16px;
  }

  .fab-item span {
    font-size: 13px;
  }

  /* Ensure minimum touch target size (44x44px) */
  .fab-item {
    min-height: 44px;
  }
}
</style>
