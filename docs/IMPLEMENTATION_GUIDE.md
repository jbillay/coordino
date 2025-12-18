# Coordino UI/UX Implementation Guide

## Overview

This document provides detailed user stories and implementation tasks for transforming Coordino's UI/UX to match best-in-class applications like Netflix, Airbnb, and Apple. All improvements are based on the comprehensive UX analysis and follow the updated [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md).

## Implementation Phases

The improvements are organized into 4 phases, prioritized by impact and dependency:

- **Phase 1: Critical Quick Wins** - High-impact changes that improve speed and reduce clicks (1-2 weeks)
- **Phase 2: Information Density** - Optimize layout to show more content per screen (1-2 weeks)
- **Phase 3: Navigation & Context** - Prevent context loss and improve navigation (2-3 weeks)
- **Phase 4: Polish & Delight** - Micro-interactions and loading states (1-2 weeks)

---

## Phase 1: Critical Quick Wins

### US-001: Fix Dark Mode to Use Netflix-Style Background

**As a:** User who prefers dark mode
**I want:** A dark theme that doesn't cause eye strain
**So that:** I can work comfortably for extended periods

**Current Problem:**
- Dark mode uses pure black (`#000000`) causing excessive contrast and eye strain
- No depth perception between different UI layers
- Contributes to OLED burn-in on mobile devices

**Acceptance Criteria:**
- ✅ Dark mode base background is `#141414` (Netflix standard), not pure black
- ✅ Surface color is `#1f1f1f` for cards and panels
- ✅ Elevated surfaces (modals, dropdowns) use `#2a2a2a`
- ✅ All dark mode colors provide proper contrast ratios (WCAG AA)
- ✅ Theme transition is smooth (no flash of wrong colors)

**Technical Details:**
- **File:** `src/assets/styles/main.css`
- **Lines to modify:** 145-160 (dark theme variables)
- **Before:**
```css
.dark {
  --bg-base: #000000;
  --bg-surface: #1a1a1a;
}
```
- **After:**
```css
.dark {
  /* Netflix-inspired dark theme - NOT pure black */
  --bg-base: #141414;           /* Base background */
  --bg-surface: #1f1f1f;        /* Cards, panels */
  --bg-elevated: #2a2a2a;       /* Modals, dropdowns, tooltips */
  --bg-interactive: #2d2d2d;    /* Hover states */
  --bg-hover: #353535;          /* Interactive hover */
}
```

**Effort:** 1 story point (30 minutes)
**Priority:** P0 - Critical
**Dependencies:** None

---

### US-002: Implement Brand Teal Color Throughout

**As a:** User of Coordino
**I want:** A consistent brand identity across all interactions
**So that:** The application feels cohesive and professional

**Current Problem:**
- Application uses generic blue (`#3b82f6`) instead of brand teal
- Inconsistent color usage across components
- Weak brand identity

**Acceptance Criteria:**
- ✅ Primary color is brand teal `#14b8a6` everywhere
- ✅ Interactive elements (buttons, links, checkboxes) use teal
- ✅ Focus states use teal-600 `#0d9488`
- ✅ Hover states use appropriate teal variants
- ✅ Both light and dark themes use teal consistently

**Technical Details:**
- **File:** `src/assets/styles/main.css`
- **Lines to modify:** 54-79 (color definitions)
- **Changes:**
```css
:root {
  /* Brand Identity - Teal Scale */
  --brand-teal-50: #f0fdfa;
  --brand-teal-100: #ccfbf1;
  --brand-teal-200: #99f6e4;
  --brand-teal-300: #5eead4;
  --brand-teal-400: #2dd4bf;
  --brand-teal-500: #14b8a6;  /* Base brand color */
  --brand-teal-600: #0d9488;  /* Hover/focus */
  --brand-teal-700: #0f766e;
  --brand-teal-800: #115e59;
  --brand-teal-900: #134e4a;

  /* Point primary color to brand teal */
  --color-primary: var(--brand-teal-500);
  --color-primary-hover: var(--brand-teal-600);
  --color-primary-active: var(--brand-teal-700);
}
```

**Additional Files to Update:**
- **AppLayout.vue:** Remove any hardcoded blue colors
- **PrimeVue theme:** Configure primary color in `main.js`
```javascript
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

const CoordinoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0fdfa',
      500: '#14b8a6',
      600: '#0d9488',
      // ... full teal scale
    }
  }
})
```

**Effort:** 2 story points (2 hours)
**Priority:** P0 - Critical
**Dependencies:** None

---

### US-003: Implement Global Floating Action Button (FAB)

**As a:** Busy knowledge worker
**I want:** Quick access to create tasks, notes, or meetings without navigation
**So that:** I can capture items in 1 click instead of 4-6 clicks

**Current Problem:**
- Creating a task requires: Dashboard → Tasks page → Click "New Task" button (3+ clicks)
- No quick access from any page
- Dashboard has non-functional decorative buttons

**Acceptance Criteria:**
- ✅ FAB visible on all authenticated pages (except auth pages)
- ✅ Fixed position: bottom-right, 24px from edges
- ✅ Clicking FAB expands menu with 3 options: "New Task", "New Note", "New Meeting"
- ✅ Each option has appropriate icon and opens respective creation dialog
- ✅ FAB uses brand teal color with shadow
- ✅ Menu closes on outside click, ESC key, or after selection
- ✅ Keyboard accessible with focus trap when expanded
- ✅ Mobile: Minimum 56x56px touch target
- ✅ Animation: Smooth expand/collapse (200ms ease-out)
- ✅ Z-index ensures FAB appears above other content

**Technical Details:**

**New File:** `src/components/global/GlobalFAB.vue`
```vue
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
  // Open task dialog or navigate to task creation
  router.push('/tasks?action=create')
}

const createNote = () => {
  closeMenu()
  router.push('/notes?action=create')
}

const createMeeting = () => {
  closeMenu()
  router.push('/scheduling/create')
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
    <div
      v-if="isExpanded"
      class="fab-backdrop"
      @click="closeMenu"
      aria-hidden="true"
    ></div>

    <!-- FAB Menu -->
    <div class="fab-menu" :class="{ expanded: isExpanded }">
      <button
        class="fab-item"
        @click="createTask"
        aria-label="Create new task"
      >
        <i class="pi pi-check-circle"></i>
        <span>New Task</span>
      </button>
      <button
        class="fab-item"
        @click="createNote"
        aria-label="Create new note"
      >
        <i class="pi pi-file-edit"></i>
        <span>New Note</span>
      </button>
      <button
        class="fab-item"
        @click="createMeeting"
        aria-label="Create new meeting"
      >
        <i class="pi pi-calendar-plus"></i>
        <span>New Meeting</span>
      </button>
    </div>

    <!-- Main FAB Button -->
    <button
      class="fab-main"
      @click="toggleMenu"
      :aria-expanded="isExpanded"
      aria-label="Quick actions"
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
  border: 1px solid var(--border-color);
  border-radius: 28px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-out;
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
}
</style>
```

**Integration File:** `src/components/layout/AppLayout.vue`
- Add `<GlobalFAB />` component before closing div
- Import: `import GlobalFAB from '@/components/global/GlobalFAB.vue'`

**Files to Modify:**
- **src/views/DashboardView.vue:** Remove non-functional buttons (lines 82-84)

**Effort:** 5 story points (4 hours)
**Priority:** P0 - Critical
**Dependencies:** None

---

### US-004: Implement Command Palette (⌘K)

**As a:** Power user who prefers keyboard shortcuts
**I want:** Quick access to all actions via keyboard
**So that:** I can navigate and perform actions without using the mouse

**Current Problem:**
- No global search or command interface
- Mouse-dependent navigation
- Inefficient for power users

**Acceptance Criteria:**
- ✅ Command palette opens with ⌘K (Mac) or Ctrl+K (Windows/Linux)
- ✅ Palette shows fuzzy-searchable list of actions and pages
- ✅ Arrow keys navigate results, Enter executes selected action
- ✅ ESC closes palette
- ✅ Recent actions appear at top when opened with empty query
- ✅ Search includes: pages, tasks, notes, meetings, actions
- ✅ Focus trap keeps focus within palette when open
- ✅ Backdrop blur effect (backdrop-filter: blur(4px))
- ✅ Animations: fade-in 150ms, list stagger 50ms per item

**Technical Details:**

**New File:** `src/components/global/CommandPalette.vue`
```vue
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '@/features/tasks/store'
import { useNotesStore } from '@/features/notes/store'

const router = useRouter()
const tasksStore = useTasksStore()
const notesStore = useNotesStore()

const isOpen = ref(false)
const query = ref('')
const selectedIndex = ref(0)
const commandInput = ref(null)

// Command definitions
const commands = computed(() => [
  // Navigation
  { id: 'nav-dashboard', title: 'Go to Dashboard', icon: 'pi-home', action: () => router.push('/dashboard'), category: 'Navigation', keywords: 'home' },
  { id: 'nav-tasks', title: 'Go to Tasks', icon: 'pi-check-circle', action: () => router.push('/tasks'), category: 'Navigation', keywords: 'todo' },
  { id: 'nav-notes', title: 'Go to Notes', icon: 'pi-file-edit', action: () => router.push('/notes'), category: 'Navigation', keywords: 'write' },
  { id: 'nav-scheduling', title: 'Go to Scheduling', icon: 'pi-calendar', action: () => router.push('/scheduling'), category: 'Navigation', keywords: 'meetings calendar' },
  { id: 'nav-settings', title: 'Go to Settings', icon: 'pi-cog', action: () => router.push('/settings'), category: 'Navigation', keywords: 'preferences config' },

  // Actions
  { id: 'action-new-task', title: 'Create New Task', icon: 'pi-plus-circle', action: () => router.push('/tasks?action=create'), category: 'Actions', keywords: 'add todo' },
  { id: 'action-new-note', title: 'Create New Note', icon: 'pi-file-plus', action: () => router.push('/notes?action=create'), category: 'Actions', keywords: 'write document' },
  { id: 'action-new-meeting', title: 'Schedule New Meeting', icon: 'pi-calendar-plus', action: () => router.push('/scheduling/create'), category: 'Actions', keywords: 'calendar event' },

  // Recent tasks
  ...tasksStore.tasks.slice(0, 5).map(task => ({
    id: `task-${task.id}`,
    title: task.title,
    icon: 'pi-check-circle',
    action: () => {
      router.push('/tasks')
      // TODO: Open task detail
    },
    category: 'Recent Tasks',
    keywords: task.title.toLowerCase()
  })),

  // Recent notes
  ...notesStore.notes.slice(0, 5).map(note => ({
    id: `note-${note.id}`,
    title: note.title,
    icon: 'pi-file-edit',
    action: () => {
      router.push('/notes')
      // TODO: Open note
    },
    category: 'Recent Notes',
    keywords: note.title.toLowerCase()
  }))
])

// Filtered commands based on query
const filteredCommands = computed(() => {
  if (!query.value) {
    return commands.value.slice(0, 8) // Show first 8 when no query
  }

  const searchTerm = query.value.toLowerCase()
  return commands.value.filter(cmd => {
    const titleMatch = cmd.title.toLowerCase().includes(searchTerm)
    const keywordsMatch = cmd.keywords?.toLowerCase().includes(searchTerm)
    return titleMatch || keywordsMatch
  }).slice(0, 10) // Limit to 10 results
})

// Group commands by category
const groupedCommands = computed(() => {
  const groups = {}
  filteredCommands.value.forEach(cmd => {
    if (!groups[cmd.category]) {
      groups[cmd.category] = []
    }
    groups[cmd.category].push(cmd)
  })
  return groups
})

const open = () => {
  isOpen.value = true
  query.value = ''
  selectedIndex.value = 0
  nextTick(() => {
    commandInput.value?.focus()
  })
}

const close = () => {
  isOpen.value = false
  query.value = ''
  selectedIndex.value = 0
}

const executeCommand = (command) => {
  command.action()
  close()
}

const handleKeydown = (event) => {
  if (!isOpen.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (filteredCommands.value[selectedIndex.value]) {
        executeCommand(filteredCommands.value[selectedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      close()
      break
  }
}

// Global keyboard shortcut
const handleGlobalKeydown = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <Transition name="palette-fade">
      <div
        v-if="isOpen"
        class="command-palette-overlay"
        @click="close"
      >
        <div
          class="command-palette"
          @click.stop
          @keydown="handleKeydown"
        >
          <!-- Search Input -->
          <div class="command-search">
            <i class="pi pi-search"></i>
            <input
              ref="commandInput"
              v-model="query"
              type="text"
              placeholder="Type a command or search..."
              class="command-input"
            />
            <kbd class="command-hint">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="command-results">
            <div
              v-for="(categoryCommands, category) in groupedCommands"
              :key="category"
              class="command-category"
            >
              <div class="category-label">{{ category }}</div>
              <div
                v-for="(command, index) in categoryCommands"
                :key="command.id"
                class="command-item"
                :class="{ selected: filteredCommands.indexOf(command) === selectedIndex }"
                @click="executeCommand(command)"
                @mouseenter="selectedIndex = filteredCommands.indexOf(command)"
              >
                <i class="pi" :class="command.icon"></i>
                <span class="command-title">{{ command.title }}</span>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="filteredCommands.length === 0" class="command-empty">
              <i class="pi pi-search text-3xl opacity-50"></i>
              <p>No results found for "{{ query }}"</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="command-footer">
            <div class="command-shortcuts">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Select</span>
              <span><kbd>ESC</kbd> Close</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}

.command-palette {
  width: 90%;
  max-width: 640px;
  background: var(--bg-elevated);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.command-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.command-search i {
  color: var(--text-muted);
  font-size: 18px;
}

.command-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--text-color);
}

.command-input::placeholder {
  color: var(--text-muted);
}

.command-hint {
  padding: 4px 8px;
  background: var(--bg-interactive);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  color: var(--text-muted);
}

.command-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.command-category {
  margin-bottom: 12px;
}

.category-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  padding: 8px 12px 4px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.command-item:hover,
.command-item.selected {
  background: var(--bg-hover);
}

.command-item i {
  color: var(--brand-teal-500);
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.command-title {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
}

.command-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-muted);
}

.command-footer {
  border-top: 1px solid var(--border-color);
  padding: 12px 20px;
  background: var(--bg-surface);
}

.command-shortcuts {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.command-shortcuts kbd {
  padding: 2px 6px;
  background: var(--bg-interactive);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
  margin: 0 2px;
}

/* Animations */
.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: opacity 0.15s ease;
}

.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
}

.palette-fade-enter-active .command-palette {
  animation: palette-slide-in 0.2s ease-out;
}

@keyframes palette-slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .command-palette-overlay,
  .command-item {
    transition: none;
  }

  .palette-fade-enter-active .command-palette {
    animation: none;
  }
}
</style>
```

**Integration File:** `src/components/layout/AppLayout.vue`
- Add `<CommandPalette ref="commandPaletteRef" />` before GlobalFAB
- Import: `import CommandPalette from '@/components/global/CommandPalette.vue'`

**Effort:** 8 story points (1 day)
**Priority:** P1 - High
**Dependencies:** US-003 (FAB should be implemented first)

---

## Phase 2: Information Density

### US-005: Implement Compact Task Cards

**As a:** User managing many tasks
**I want:** To see more tasks on screen at once
**So that:** I can scan and manage my workload efficiently

**Current Problem:**
- Only 3-4 tasks visible per screen due to excessive padding
- Each task uses PrimeVue Card wrapper with large padding
- Low information density wastes vertical space

**Acceptance Criteria:**
- ✅ 8-10 tasks visible on standard 1080p screen (was 3-4)
- ✅ Task items have 0.625rem (10px) vertical padding (was 1.25rem / 20px)
- ✅ Remove Card wrapper, use direct list items
- ✅ Actions appear on hover only (Gmail-style)
- ✅ Checkbox, title, metadata, badges all in compact single row
- ✅ Hover state provides visual feedback
- ✅ Keyboard navigation maintains accessibility
- ✅ Touch targets remain 44x44px minimum on mobile

**Technical Details:**

**File:** `src/features/tasks/components/TaskCard.vue`

**Before (Current - Lines 80-200):**
```vue
<Card class="task-card">
  <template #content>
    <div class="task-content" style="padding: 1.25rem">
      <Checkbox ... />
      <div class="task-info">
        <h3>{{ task.title }}</h3>
        <div class="task-metadata">...</div>
      </div>
      <div class="task-actions">
        <Button icon="pi pi-pencil" />
        <Button icon="pi pi-trash" />
      </div>
    </div>
  </template>
</Card>
```

**After (New Compact Design):**
```vue
<script setup>
import { ref } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle', 'edit', 'delete', 'click'])

const isHovered = ref(false)
</script>

<template>
  <div
    class="task-item"
    :class="{ completed: task.completed }"
    @click="emit('click', task)"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    role="button"
    tabindex="0"
    @keydown.enter="emit('click', task)"
  >
    <!-- Checkbox -->
    <Checkbox
      :model-value="task.completed"
      :binary="true"
      @click.stop
      @update:model-value="emit('toggle', task)"
      class="task-checkbox"
    />

    <!-- Content -->
    <div class="task-content">
      <div class="task-title">
        {{ task.title }}
      </div>
      <div class="task-metadata">
        <span v-if="task.category" class="task-badge category">
          {{ task.category.name }}
        </span>
        <span v-if="task.priority" class="task-badge priority" :class="`priority-${task.priority}`">
          {{ task.priority }}
        </span>
        <span v-if="task.due_date" class="task-due">
          <i class="pi pi-calendar"></i>
          {{ formatDate(task.due_date) }}
        </span>
      </div>
    </div>

    <!-- Actions (hover-only) -->
    <div class="task-actions" :class="{ visible: isHovered }">
      <Button
        icon="pi pi-pencil"
        text
        rounded
        size="small"
        severity="secondary"
        @click.stop="emit('edit', task)"
        aria-label="Edit task"
      />
      <Button
        icon="pi pi-trash"
        text
        rounded
        size="small"
        severity="danger"
        @click.stop="emit('delete', task)"
        aria-label="Delete task"
      />
    </div>
  </div>
</template>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem; /* Compact: 10px vertical */
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.task-item:hover {
  background: var(--bg-hover);
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-checkbox {
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  min-width: 0; /* Allow text truncation */
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-metadata {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.task-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  background: var(--bg-interactive);
  color: var(--text-muted);
  font-weight: 500;
}

.task-badge.priority {
  border: 1px solid transparent;
}

.task-badge.priority-high {
  background: var(--color-error-subtle);
  color: var(--color-error);
  border-color: var(--color-error);
}

.task-badge.priority-medium {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  border-color: var(--color-warning);
}

.task-badge.priority-low {
  background: var(--color-info-subtle);
  color: var(--color-info);
  border-color: var(--color-info);
}

.task-due {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.task-due i {
  font-size: 0.625rem;
}

.task-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.task-actions.visible {
  opacity: 1;
  pointer-events: all;
}

/* Keyboard focus: always show actions when focused */
.task-item:focus-within .task-actions {
  opacity: 1;
  pointer-events: all;
}

/* Focus indicator */
.task-item:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: -2px;
}

/* Mobile: Always show actions (no hover) */
@media (max-width: 768px) {
  .task-actions {
    opacity: 1;
    pointer-events: all;
  }

  .task-title {
    font-size: 0.9375rem; /* Slightly larger on mobile */
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .task-item,
  .task-actions {
    transition: none;
  }
}
</style>
```

**File:** `src/views/TasksView.vue`
- **Lines to modify:** 150-200 (task list section)
- **Before:**
```vue
<div class="task-grid">
  <TaskCard
    v-for="task in filteredTasks"
    :key="task.id"
    :task="task"
  />
</div>
```
- **After:**
```vue
<div class="task-list">
  <TaskCard
    v-for="task in filteredTasks"
    :key="task.id"
    :task="task"
    @toggle="handleToggleTask"
    @edit="handleEditTask"
    @delete="handleDeleteTask"
    @click="handleTaskClick"
  />
</div>
```

**CSS Updates in TasksView.vue:**
```css
.task-list {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* Remove old task-grid styles */
```

**Effort:** 5 story points (4 hours)
**Priority:** P1 - High
**Dependencies:** None

---

### US-006: Implement Chip-Based Filters

**As a:** User filtering tasks or notes
**I want:** Quick, space-efficient filters
**So that:** I can switch views without scrolling past bulky filter controls

**Current Problem:**
- Task filters use entire Card component (~150px vertical space)
- Multiple dropdowns for status, category, priority
- Search input buried within filters
- Low visual priority despite high usage

**Acceptance Criteria:**
- ✅ Filters use horizontal chip layout (Airbnb-style)
- ✅ Search bar is prominent and always visible at top
- ✅ Filter chips show count badges (e.g., "High Priority (5)")
- ✅ Active filter has teal background
- ✅ Clicking chip toggles filter on/off
- ✅ Chips wrap responsively on smaller screens
- ✅ Keyboard navigation: Tab through chips, Enter to toggle
- ✅ Total vertical space: ~60px (was ~150px)

**Technical Details:**

**File:** `src/features/tasks/components/TaskFilters.vue`

**Complete Rewrite:**
```vue
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filters', 'update:search'])

const searchQuery = ref('')
const activeFilters = ref(new Set())

// Preset filter definitions with dynamic counts
const filterPresets = computed(() => [
  {
    id: 'all',
    label: 'All Tasks',
    icon: 'pi-list',
    count: props.tasks.length,
    filter: () => true
  },
  {
    id: 'today',
    label: 'Today',
    icon: 'pi-calendar',
    count: props.tasks.filter(t => isDueToday(t)).length,
    filter: (task) => isDueToday(task)
  },
  {
    id: 'high-priority',
    label: 'High Priority',
    icon: 'pi-exclamation-circle',
    count: props.tasks.filter(t => t.priority === 'high').length,
    filter: (task) => task.priority === 'high'
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    icon: 'pi-spinner',
    count: props.tasks.filter(t => t.status?.name === 'In Progress').length,
    filter: (task) => task.status?.name === 'In Progress'
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: 'pi-check-circle',
    count: props.tasks.filter(t => t.completed).length,
    filter: (task) => task.completed
  }
])

const isDueToday = (task) => {
  if (!task.due_date) return false
  const today = new Date()
  const dueDate = new Date(task.due_date)
  return (
    dueDate.getDate() === today.getDate() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getFullYear() === today.getFullYear()
  )
}

const toggleFilter = (filterId) => {
  if (activeFilters.value.has(filterId)) {
    activeFilters.value.delete(filterId)
  } else {
    activeFilters.value.clear() // Single-select mode
    activeFilters.value.add(filterId)
  }

  emit('update:filters', Array.from(activeFilters.value))
}

const handleSearch = () => {
  emit('update:search', searchQuery.value)
}
</script>

<template>
  <div class="filter-bar">
    <!-- Prominent Search -->
    <div class="search-prominent">
      <i class="pi pi-search"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tasks... (⌘K for command palette)"
        class="search-input"
        @input="handleSearch"
      />
      <kbd v-if="!searchQuery" class="search-hint">⌘K</kbd>
    </div>

    <!-- Filter Chips -->
    <div class="filter-chips">
      <button
        v-for="preset in filterPresets"
        :key="preset.id"
        class="filter-chip"
        :class="{ active: activeFilters.has(preset.id) }"
        @click="toggleFilter(preset.id)"
      >
        <i class="pi" :class="preset.icon"></i>
        <span class="chip-label">{{ preset.label }}</span>
        <span v-if="preset.count > 0" class="chip-count">{{ preset.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

/* Prominent Search */
.search-prominent {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-base);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  transition: border-color 0.15s ease;
}

.search-prominent:focus-within {
  border-color: var(--brand-teal-500);
}

.search-prominent i {
  color: var(--text-muted);
  font-size: 1rem;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  color: var(--text-color);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-hint {
  padding: 0.25rem 0.5rem;
  background: var(--bg-interactive);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-muted);
}

/* Filter Chips */
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-interactive);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  transition: all 0.15s ease;
}

.filter-chip:hover {
  background: var(--bg-hover);
  border-color: var(--brand-teal-500);
}

.filter-chip.active {
  background: var(--brand-teal-500);
  border-color: var(--brand-teal-500);
  color: white;
}

.filter-chip i {
  font-size: 0.875rem;
}

.filter-chip.active i {
  color: white;
}

.chip-label {
  white-space: nowrap;
}

.chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.375rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-chip.active .chip-count {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Focus indicator */
.filter-chip:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: 2px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .filter-bar {
    padding: 0.75rem;
  }

  .search-prominent {
    padding: 0.625rem 0.75rem;
  }

  .filter-chip {
    font-size: 0.8125rem;
    padding: 0.4375rem 0.75rem;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .search-prominent,
  .filter-chip {
    transition: none;
  }
}
</style>
```

**Effort:** 3 story points (3 hours)
**Priority:** P1 - High
**Dependencies:** None

---

### US-007: Implement Interactive Stat Cards

**As a:** User reviewing task statistics
**I want:** Clickable stat cards that filter tasks
**So that:** I can quickly jump to relevant task views

**Current Problem:**
- Dashboard stat cards are purely informational
- No interaction, no filtering capability
- Missed opportunity for quick navigation

**Acceptance Criteria:**
- ✅ Stat cards show hover state with arrow indicator
- ✅ Clicking stat card navigates to Tasks page with appropriate filter
- ✅ Cursor changes to pointer on hover
- ✅ Smooth hover animation (transform scale 1.02)
- ✅ Arrow appears on right side during hover
- ✅ Keyboard accessible (Enter key activates)
- ✅ Touch-friendly on mobile (minimum 44x44px)

**Technical Details:**

**File:** `src/views/DashboardView.vue`

**Lines to modify:** 82-120 (stat cards section)

**Before:**
```vue
<div class="stats-grid">
  <Card>
    <template #content>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalTasks }}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
    </template>
  </Card>
  <!-- More cards... -->
</div>
```

**After:**
```vue
<script setup>
// ... existing imports
import { useRouter } from 'vue-router'

const router = useRouter()

// ... existing code

const navigateToTasks = (filter) => {
  router.push({ name: 'tasks', query: { filter } })
}
</script>

<template>
  <div class="stats-grid">
    <!-- Total Tasks -->
    <div
      class="stat-card interactive"
      @click="navigateToTasks('all')"
      @keydown.enter="navigateToTasks('all')"
      role="button"
      tabindex="0"
      aria-label="View all tasks"
    >
      <div class="stat-icon">
        <i class="pi pi-list"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.totalTasks }}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
      <div class="stat-arrow">
        <i class="pi pi-arrow-right"></i>
      </div>
    </div>

    <!-- Due Today -->
    <div
      class="stat-card interactive"
      @click="navigateToTasks('today')"
      @keydown.enter="navigateToTasks('today')"
      role="button"
      tabindex="0"
      aria-label="View tasks due today"
    >
      <div class="stat-icon urgent">
        <i class="pi pi-calendar"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.dueToday }}</div>
        <div class="stat-label">Due Today</div>
      </div>
      <div class="stat-arrow">
        <i class="pi pi-arrow-right"></i>
      </div>
    </div>

    <!-- In Progress -->
    <div
      class="stat-card interactive"
      @click="navigateToTasks('in-progress')"
      @keydown.enter="navigateToTasks('in-progress')"
      role="button"
      tabindex="0"
      aria-label="View in-progress tasks"
    >
      <div class="stat-icon">
        <i class="pi pi-spinner"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.inProgress }}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-arrow">
        <i class="pi pi-arrow-right"></i>
      </div>
    </div>

    <!-- Completed -->
    <div
      class="stat-card interactive"
      @click="navigateToTasks('completed')"
      @keydown.enter="navigateToTasks('completed')"
      role="button"
      tabindex="0"
      aria-label="View completed tasks"
    >
      <div class="stat-icon success">
        <i class="pi pi-check-circle"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-arrow">
        <i class="pi pi-arrow-right"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.stat-card.interactive {
  cursor: pointer;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--brand-teal-100);
  color: var(--brand-teal-600);
  font-size: 24px;
  flex-shrink: 0;
}

.stat-icon.urgent {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.stat-icon.success {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-arrow {
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
  color: var(--brand-teal-500);
  font-size: 1.25rem;
}

/* Focus indicator */
.stat-card.interactive:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: 2px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card.interactive .stat-arrow {
    opacity: 1;
    transform: translateX(0);
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
```

**File:** `src/views/TasksView.vue`
- Add support for `filter` query parameter
- Apply appropriate filter when navigating from dashboard

**Effort:** 3 story points (2-3 hours)
**Priority:** P1 - High
**Dependencies:** US-006 (chip filters should exist to apply the filter)

---

## Phase 3: Navigation & Context

### US-008: Implement "Continue Where You Left Off" Section

**As a:** User returning to Coordino
**I want:** Quick access to my recent work
**So that:** I can resume where I left off without searching

**Current Problem:**
- No context retention when navigating between sections
- Users must remember what they were working on
- No quick way to return to recent items

**Acceptance Criteria:**
- ✅ Dashboard shows "Continue where you left off" section
- ✅ Section displays 3-5 most recent items (tasks, notes, meetings)
- ✅ Each item shows: type icon, title, timestamp (e.g., "2m ago", "1h ago")
- ✅ Clicking item navigates to that specific item
- ✅ Activity tracked across sessions (localStorage)
- ✅ Activity logged when: opening task, editing note, viewing meeting
- ✅ Maximum 50 items stored (FIFO queue)
- ✅ Empty state if no recent activity

**Technical Details:**

**New File:** `src/stores/activity.js`
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useActivityStore = defineStore('activity', () => {
  const MAX_ACTIVITIES = 50
  const recentActivity = ref([])

  // Load from localStorage on init
  const loadActivity = () => {
    try {
      const stored = localStorage.getItem('coordino_recent_activity')
      if (stored) {
        recentActivity.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load activity:', error)
      recentActivity.value = []
    }
  }

  // Save to localStorage
  const saveActivity = () => {
    try {
      localStorage.setItem('coordino_recent_activity', JSON.stringify(recentActivity.value))
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  // Track new activity
  const trackActivity = (type, id, title, metadata = {}) => {
    const activity = {
      type, // 'task', 'note', 'meeting'
      id,
      title,
      metadata,
      timestamp: Date.now()
    }

    // Remove existing entry for same item (prevent duplicates)
    recentActivity.value = recentActivity.value.filter(
      (a) => !(a.type === type && a.id === id)
    )

    // Add to front
    recentActivity.value.unshift(activity)

    // Limit to MAX_ACTIVITIES
    if (recentActivity.value.length > MAX_ACTIVITIES) {
      recentActivity.value = recentActivity.value.slice(0, MAX_ACTIVITIES)
    }

    saveActivity()
  }

  // Get recent activities (limited)
  const getRecentActivities = (limit = 5) => {
    return computed(() => recentActivity.value.slice(0, limit))
  }

  // Clear all activity
  const clearActivity = () => {
    recentActivity.value = []
    saveActivity()
  }

  // Initialize
  loadActivity()

  return {
    recentActivity,
    trackActivity,
    getRecentActivities,
    clearActivity
  }
})
```

**New Component:** `src/components/dashboard/ContinueSection.vue`
```vue
<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '@/stores/activity'
import { formatDistanceToNow } from 'date-fns'

const router = useRouter()
const activityStore = useActivityStore()

const recentActivities = activityStore.getRecentActivities(5)

const getActivityIcon = (type) => {
  const icons = {
    task: 'pi-check-circle',
    note: 'pi-file-edit',
    meeting: 'pi-calendar'
  }
  return icons[type] || 'pi-circle'
}

const getActivityColor = (type) => {
  const colors = {
    task: 'var(--brand-teal-500)',
    note: 'var(--color-accent-purple)',
    meeting: 'var(--color-accent-ocean)'
  }
  return colors[type] || 'var(--text-muted)'
}

const formatTimestamp = (timestamp) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

const navigateToItem = (activity) => {
  const routes = {
    task: `/tasks?id=${activity.id}`,
    note: `/notes?id=${activity.id}`,
    meeting: `/scheduling/${activity.id}`
  }

  const route = routes[activity.type]
  if (route) {
    router.push(route)
  }
}
</script>

<template>
  <div v-if="recentActivities.value.length > 0" class="continue-section">
    <h2 class="section-title">Continue where you left off</h2>
    <div class="activity-list">
      <div
        v-for="activity in recentActivities.value"
        :key="`${activity.type}-${activity.id}`"
        class="activity-item"
        @click="navigateToItem(activity)"
        @keydown.enter="navigateToItem(activity)"
        role="button"
        tabindex="0"
      >
        <div
          class="activity-icon"
          :style="{ color: getActivityColor(activity.type) }"
        >
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
  color: var(--text-color);
  margin-bottom: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
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
  border-bottom: 1px solid var(--border-color);
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
  color: var(--text-color);
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
  color: var(--text-muted);
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
  color: var(--text-muted);
  font-size: 1rem;
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
```

**Integration:**
- **File:** `src/views/DashboardView.vue`
  - Import ContinueSection component
  - Add component above stats grid

**Activity Tracking Integration:**
- **File:** `src/views/TasksView.vue`
  - Track when opening task detail
```javascript
import { useActivityStore } from '@/stores/activity'
const activityStore = useActivityStore()

const handleTaskClick = (task) => {
  activityStore.trackActivity('task', task.id, task.title, {
    status: task.status?.name,
    priority: task.priority
  })
  // Open task detail...
}
```

- **File:** `src/views/NotesView.vue`
  - Track when opening note editor
```javascript
const handleNoteClick = (note) => {
  activityStore.trackActivity('note', note.id, note.title, {
    topic: note.topic?.name
  })
  // Open note...
}
```

- **File:** `src/features/scheduling/views/MeetingDetail.vue`
  - Track when viewing meeting
```javascript
onMounted(() => {
  activityStore.trackActivity('meeting', meeting.value.id, meeting.value.title, {
    proposedTime: meeting.value.proposed_time
  })
})
```

**Effort:** 8 story points (1 day)
**Priority:** P1 - High
**Dependencies:** None

---

### US-009: Implement Side-by-Side Notes View

**As a:** User taking notes while referencing other content
**I want:** Notes editor beside topic list, not replacing it
**So that:** I maintain context and can switch notes quickly

**Current Problem:**
- Opening note replaces entire view with editor
- Loses context of topic structure
- Must navigate back to see other notes

**Acceptance Criteria:**
- ✅ Notes page uses side-by-side layout: topic/note list (30%) | editor (70%)
- ✅ Topic list always visible on left
- ✅ Note list shows when topic selected
- ✅ Editor appears on right when note selected
- ✅ Empty state in editor when no note selected
- ✅ Responsive: Stack vertically on mobile (<768px)
- ✅ Smooth transition when opening/closing editor (200ms)
- ✅ Editor has "Close" button to return to empty state

**Technical Details:**

**File:** `src/views/NotesView.vue`

**Complete Layout Restructure:**
```vue
<script setup>
import { ref, computed } from 'vue'
import { useNotesStore } from '@/features/notes/store'
import { useActivityStore } from '@/stores/activity'

const notesStore = useNotesStore()
const activityStore = useActivityStore()

const selectedTopic = ref(null)
const selectedNote = ref(null)
const isEditing = ref(false)

const topicNotes = computed(() => {
  if (!selectedTopic.value) return []
  return notesStore.notes.filter((n) => n.topic_id === selectedTopic.value.id)
})

const handleTopicSelect = (topic) => {
  selectedTopic.value = topic
  selectedNote.value = null
}

const handleNoteSelect = (note) => {
  selectedNote.value = note
  isEditing.value = false

  // Track activity
  activityStore.trackActivity('note', note.id, note.title, {
    topic: selectedTopic.value?.name
  })
}

const handleCreateNote = () => {
  selectedNote.value = {
    title: '',
    content: '',
    topic_id: selectedTopic.value?.id
  }
  isEditing.value = true
}

const handleCloseEditor = () => {
  selectedNote.value = null
  isEditing.value = false
}
</script>

<template>
  <div class="notes-view">
    <!-- Left Sidebar: Topics & Notes -->
    <div class="notes-sidebar">
      <!-- Topic List -->
      <div class="topic-section">
        <div class="section-header">
          <h2>Topics</h2>
          <Button
            icon="pi pi-plus"
            text
            rounded
            size="small"
            @click="handleCreateTopic"
          />
        </div>
        <div class="topic-list">
          <div
            v-for="topic in notesStore.topics"
            :key="topic.id"
            class="topic-item"
            :class="{ active: selectedTopic?.id === topic.id }"
            @click="handleTopicSelect(topic)"
          >
            <i class="pi pi-folder"></i>
            <span>{{ topic.name }}</span>
            <span class="topic-count">{{ topic.note_count || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Note List (when topic selected) -->
      <div v-if="selectedTopic" class="note-section">
        <div class="section-header">
          <h3>{{ selectedTopic.name }}</h3>
          <Button
            icon="pi pi-plus"
            text
            rounded
            size="small"
            @click="handleCreateNote"
          />
        </div>
        <div class="note-list">
          <div
            v-for="note in topicNotes"
            :key="note.id"
            class="note-item"
            :class="{ active: selectedNote?.id === note.id }"
            @click="handleNoteSelect(note)"
          >
            <div class="note-title">{{ note.title || 'Untitled' }}</div>
            <div class="note-preview">{{ note.content?.substring(0, 60) }}...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Editor -->
    <div class="notes-editor-panel">
      <!-- Empty State -->
      <div v-if="!selectedNote" class="editor-empty-state">
        <i class="pi pi-file-edit text-6xl opacity-30"></i>
        <h3>No note selected</h3>
        <p>Select a note from the list or create a new one</p>
      </div>

      <!-- Note Editor -->
      <div v-else class="note-editor">
        <div class="editor-header">
          <input
            v-model="selectedNote.title"
            type="text"
            placeholder="Note title..."
            class="editor-title-input"
          />
          <div class="editor-actions">
            <Button
              label="Save"
              icon="pi pi-save"
              size="small"
              @click="handleSaveNote"
            />
            <Button
              icon="pi pi-times"
              text
              rounded
              size="small"
              @click="handleCloseEditor"
              aria-label="Close editor"
            />
          </div>
        </div>
        <div class="editor-content">
          <textarea
            v-model="selectedNote.content"
            placeholder="Start writing..."
            class="editor-textarea"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notes-view {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  height: calc(100vh - 120px); /* Adjust based on header height */
  padding: 2rem;
}

/* Sidebar */
.notes-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

.topic-section,
.note-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-base);
}

.section-header h2,
.section-header h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.topic-list,
.note-list {
  max-height: 400px;
  overflow-y: auto;
}

.topic-item,
.note-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid var(--border-color);
}

.topic-item:last-child,
.note-item:last-child {
  border-bottom: none;
}

.topic-item:hover,
.note-item:hover {
  background: var(--bg-hover);
}

.topic-item.active,
.note-item.active {
  background: var(--brand-teal-50);
  border-left: 3px solid var(--brand-teal-500);
}

:global(.dark) .topic-item.active,
:global(.dark) .note-item.active {
  background: rgba(20, 184, 166, 0.1);
}

.topic-item i {
  color: var(--brand-teal-500);
  font-size: 1rem;
}

.topic-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-interactive);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
}

.note-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.note-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.note-preview {
  font-size: 0.75rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

/* Editor Panel */
.notes-editor-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
}

.editor-empty-state h3 {
  font-size: 1.25rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-base);
}

.editor-title-input {
  flex: 1;
  font-size: 1.5rem;
  font-weight: 600;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-color);
}

.editor-title-input::placeholder {
  color: var(--text-muted);
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color);
  font-family: inherit;
}

.editor-textarea::placeholder {
  color: var(--text-muted);
}

/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .notes-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .notes-sidebar {
    max-height: 300px;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .topic-item,
  .note-item {
    transition: none;
  }
}
</style>
```

**Effort:** 8 story points (1 day)
**Priority:** P2 - Medium
**Dependencies:** US-008 (activity tracking should be in place)

---

## Phase 4: Polish & Delight

### US-010: Implement Skeleton Loading States

**As a:** User waiting for content to load
**I want:** Visual feedback showing what's loading
**So that:** I understand the app is working and know what to expect

**Current Problem:**
- Generic spinners provide no context
- Users don't know what's loading
- Perceived loading time feels longer

**Acceptance Criteria:**
- ✅ Task list shows task-shaped skeletons while loading
- ✅ Dashboard shows stat card skeletons
- ✅ Notes list shows note item skeletons
- ✅ Skeleton matches actual content layout
- ✅ Shimmer animation (1.5s loop) indicates loading
- ✅ Smooth transition from skeleton to real content
- ✅ Accessible: aria-busy and aria-label on skeleton containers

**Technical Details:**

**New Component:** `src/components/common/SkeletonLoader.vue`
```vue
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
    var(--bg-interactive) 0%,
    var(--bg-hover) 50%,
    var(--bg-interactive) 100%
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
```

**New Component:** `src/components/skeletons/TaskSkeleton.vue`
```vue
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
    <div
      v-for="i in count"
      :key="i"
      class="task-skeleton-item"
    >
      <SkeletonLoader type="circle" width="20px" height="20px" />
      <div class="task-skeleton-content">
        <SkeletonLoader
          type="text"
          :width="`${60 + Math.random() * 30}%`"
          height="14px"
        />
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
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.task-skeleton-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--border-color);
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
```

**New Component:** `src/components/skeletons/StatCardSkeleton.vue`
```vue
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
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.stat-skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
```

**Integration:**

**File:** `src/views/TasksView.vue`
```vue
<script setup>
import TaskSkeleton from '@/components/skeletons/TaskSkeleton.vue'
// ... existing imports
</script>

<template>
  <!-- Replace loading spinner with skeleton -->
  <TaskSkeleton v-if="store.loading" :count="8" />
  <div v-else class="task-list">
    <!-- Actual tasks -->
  </div>
</template>
```

**File:** `src/views/DashboardView.vue`
```vue
<script setup>
import StatCardSkeleton from '@/components/skeletons/StatCardSkeleton.vue'
// ... existing imports
</script>

<template>
  <div class="stats-grid">
    <template v-if="loading">
      <StatCardSkeleton v-for="i in 4" :key="i" />
    </template>
    <template v-else>
      <!-- Actual stat cards -->
    </template>
  </div>
</template>
```

**Effort:** 5 story points (4 hours)
**Priority:** P2 - Medium
**Dependencies:** None

---

### US-011: Add Micro-Interactions and Hover Effects

**As a:** User interacting with the application
**I want:** Subtle visual feedback for my actions
**So that:** The interface feels responsive and alive

**Current Problem:**
- Interactions feel static and unresponsive
- No feedback for hover, click, or focus states
- Missing personality and delight

**Acceptance Criteria:**
- ✅ Buttons scale slightly on hover (1.02x) and press (0.98x)
- ✅ Task completion shows checkmark animation
- ✅ Dialog entries fade in with stagger effect
- ✅ Toast notifications slide in from top-right
- ✅ All transitions use ease-out timing (feels snappy)
- ✅ Respect prefers-reduced-motion (disable animations)
- ✅ Focus indicators are always visible (2px teal outline)

**Technical Details:**

**File:** `src/assets/styles/main.css`

**Add Animation Utilities:**
```css
/* ========================================
   ANIMATIONS & MICRO-INTERACTIONS
   ======================================== */

/* Button interactions */
button,
.btn,
.interactive {
  transition: all 0.2s ease-out;
}

button:hover,
.btn:hover,
.interactive:hover {
  transform: scale(1.02);
}

button:active,
.btn:active,
.interactive:active {
  transform: scale(0.98);
}

/* Checkmark animation */
@keyframes checkmark-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.checkbox-checked {
  animation: checkmark-pop 0.3s ease-out;
}

/* Dialog entry with stagger */
@keyframes dialog-fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-enter-active {
  animation: dialog-fade-in 0.2s ease-out;
}

.dialog-enter-active > *:nth-child(1) { animation-delay: 0ms; }
.dialog-enter-active > *:nth-child(2) { animation-delay: 50ms; }
.dialog-enter-active > *:nth-child(3) { animation-delay: 100ms; }
.dialog-enter-active > *:nth-child(4) { animation-delay: 150ms; }

/* Toast notifications */
@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.p-toast {
  animation: toast-slide-in 0.3s ease-out;
}

/* Card hover lift */
.card-interactive {
  transition: all 0.2s ease-out;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Focus indicators - ALWAYS visible */
*:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: 2px;
}

/* Loading pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Component Updates:**

**File:** `src/features/tasks/components/TaskCard.vue`
```vue
<template>
  <div class="task-item" :class="{ completed: task.completed }">
    <Checkbox
      :model-value="task.completed"
      @update:model-value="handleToggle"
      class="task-checkbox"
      :class="{ 'checkbox-checked': task.completed }"
    />
    <!-- rest of component -->
  </div>
</template>

<script setup>
const handleToggle = async (value) => {
  // Add haptic feedback on mobile if available
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }

  emit('toggle', task)
}
</script>
```

**File:** Configure PrimeVue Toasts in `main.js`
```javascript
import ToastService from 'primevue/toastservice'

app.use(ToastService)

// Configure toast position
app.config.globalProperties.$toast = {
  add: (options) => {
    app.config.globalProperties.$primevue.config.toast.add({
      ...options,
      position: 'top-right'
    })
  }
}
```

**Effort:** 3 story points (3 hours)
**Priority:** P2 - Medium
**Dependencies:** None

---

### US-012: Optimize Heatmap Visualization

**As a:** User scheduling international meetings
**I want:** Larger, more readable time slot visualizations
**So that:** I can easily identify optimal meeting times

**Current Problem:**
- Heatmap slots are too small (~30-60px each)
- Hard to read time labels and scores
- 12-column grid makes individual slots cramped
- Difficult to distinguish between score levels

**Acceptance Criteria:**
- ✅ Heatmap uses 6-column grid (was 12), doubling slot size
- ✅ Each slot shows: time (larger font), score (prominent), participant breakdown
- ✅ Color coding remains: green (80+), yellow (60-79), orange (40-59), red (0-39)
- ✅ Hover state shows tooltip with full details
- ✅ Selected slot has distinct outline (3px teal border)
- ✅ Responsive: 4-column on tablet, 2-column on mobile
- ✅ Keyboard navigation: arrow keys move between slots

**Technical Details:**

**File:** `src/features/scheduling/components/TimeSlotHeatmap.vue`

**Lines to modify:** 99-121 (grid and slot styling)

**Before:**
```vue
<div class="grid grid-cols-12 gap-2">
  <div v-for="slot in slots" :key="slot.hour" class="slot">
    <!-- Small content -->
  </div>
</div>
```

**After:**
```vue
<script setup>
// ... existing code

const handleKeyboardNav = (event, currentSlot) => {
  const currentIndex = slots.value.findIndex((s) => s.hour === currentSlot.hour)
  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowRight':
      newIndex = Math.min(currentIndex + 1, slots.value.length - 1)
      break
    case 'ArrowLeft':
      newIndex = Math.max(currentIndex - 1, 0)
      break
    case 'ArrowDown':
      newIndex = Math.min(currentIndex + 6, slots.value.length - 1)
      break
    case 'ArrowUp':
      newIndex = Math.max(currentIndex - 6, 0)
      break
    default:
      return
  }

  event.preventDefault()
  const newSlot = slots.value[newIndex]
  handleSlotClick(newSlot)
}
</script>

<template>
  <div class="time-slot-heatmap">
    <!-- Loading state -->
    <div v-if="loading" class="heatmap-loading">
      <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
      <span class="loading-text">Analyzing optimal times across timezones...</span>
    </div>

    <!-- Heatmap Grid -->
    <div v-else-if="slots.length > 0" class="heatmap-container">
      <!-- Legend -->
      <div class="heatmap-legend">
        <h3 class="legend-title">24-Hour Equity Analysis</h3>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color excellent"></div>
            <span>Excellent (80-100)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color good"></div>
            <span>Good (60-79)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color fair"></div>
            <span>Fair (40-59)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color poor"></div>
            <span>Poor (0-39)</span>
          </div>
        </div>
      </div>

      <!-- Slots Grid -->
      <div class="heatmap-grid">
        <div
          v-for="slot in slots"
          :key="slot.hour"
          :class="getSlotClass(slot)"
          :title="getSlotTooltip(slot)"
          role="button"
          :tabindex="0"
          :aria-label="`${formatHour(slot.hour)}, equity score ${slot.score}`"
          @click="handleSlotClick(slot)"
          @keydown="(e) => handleKeyboardNav(e, slot)"
        >
          <div class="slot-time">{{ formatHour(slot.hour) }}</div>
          <div class="slot-score">{{ Math.round(slot.score) }}</div>
          <div class="slot-participants">
            <span class="participant-badge green">{{ slot.green_count }}</span>
            <span class="participant-badge orange">{{ slot.orange_count }}</span>
            <span class="participant-badge red">{{ slot.red_count }}</span>
          </div>
        </div>
      </div>

      <!-- Selected Slot Details -->
      <div v-if="selectedSlot" class="slot-details">
        <h4 class="details-title">Selected Time: {{ formatHour(selectedSlot.hour) }}</h4>
        <div class="details-content">
          <div class="detail-row">
            <span class="detail-label">Equity Score:</span>
            <span class="detail-value">{{ Math.round(selectedSlot.score) }}/100</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Participants:</span>
            <span class="detail-value">
              <span class="badge green">{{ selectedSlot.green_count }} green</span>
              <span class="badge orange">{{ selectedSlot.orange_count }} orange</span>
              <span class="badge red">{{ selectedSlot.red_count }} red</span>
            </span>
          </div>
          <div v-if="selectedSlot.critical_count > 0" class="critical-warning">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ selectedSlot.critical_count }} participants have critical conflicts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="heatmap-empty">
      <i class="pi pi-info-circle text-5xl opacity-40"></i>
      <p>Add participants and propose a time to generate the equity heatmap.</p>
    </div>
  </div>
</template>

<style scoped>
.time-slot-heatmap {
  width: 100%;
  padding: 1.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

/* Loading State */
.heatmap-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-text {
  font-size: 1.125rem;
  color: var(--text-muted);
}

/* Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.legend-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.legend-items {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.excellent { background: var(--color-success); }
.legend-color.good { background: var(--color-warning); }
.legend-color.fair { background: #fb923c; }
.legend-color.poor { background: var(--color-error); }

/* Heatmap Grid */
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.slot:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slot:focus-visible {
  outline: 2px solid var(--brand-teal-500);
  outline-offset: 2px;
}

/* Score-based colors */
.slot.excellent {
  background: #d1fae5;
  border-color: #6ee7b7;
}

.slot.good {
  background: #fef3c7;
  border-color: #fcd34d;
}

.slot.fair {
  background: #fed7aa;
  border-color: #fdba74;
}

.slot.poor {
  background: #fecaca;
  border-color: #fca5a5;
}

/* Dark mode colors */
:global(.dark) .slot.excellent {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

:global(.dark) .slot.good {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.4);
}

:global(.dark) .slot.fair {
  background: rgba(251, 146, 60, 0.2);
  border-color: rgba(251, 146, 60, 0.4);
}

:global(.dark) .slot.poor {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

/* Selected state */
.slot.selected {
  border-color: var(--brand-teal-500);
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.slot-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.slot-score {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.slot-participants {
  display: flex;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.participant-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  font-weight: 600;
}

.participant-badge.green {
  background: rgba(16, 185, 129, 0.3);
  color: var(--color-success);
}

.participant-badge.orange {
  background: rgba(245, 158, 11, 0.3);
  color: var(--color-warning);
}

.participant-badge.red {
  background: rgba(239, 68, 68, 0.3);
  color: var(--color-error);
}

/* Selected Slot Details */
.slot-details {
  padding: 1.25rem;
  background: var(--bg-base);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.details-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--text-color);
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.detail-label {
  font-weight: 500;
  color: var(--text-muted);
}

.detail-value {
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

.badge.green {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.badge.orange {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.badge.red {
  background: var(--color-error-subtle);
  color: var(--color-error);
}

.critical-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-error-subtle);
  border: 1px solid var(--color-error);
  border-radius: 6px;
  color: var(--color-error);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Empty State */
.heatmap-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
}

.heatmap-empty p {
  margin-top: 1rem;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .heatmap-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .legend-items {
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .heatmap-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .heatmap-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .slot {
    padding: 1rem 0.5rem;
  }

  .slot-score {
    font-size: 1.5rem;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .slot {
    transition: none;
  }

  .slot:hover {
    transform: none;
  }
}
</style>
```

**Effort:** 5 story points (4 hours)
**Priority:** P2 - Medium
**Dependencies:** None

---

## Summary & Metrics

### Implementation Priority

**P0 - Critical (Must Have):**
- US-001: Fix Dark Mode (Netflix #141414)
- US-002: Brand Teal Color System
- US-003: Global FAB

**P1 - High (Should Have):**
- US-004: Command Palette
- US-005: Compact Task Cards
- US-006: Chip-Based Filters
- US-007: Interactive Stat Cards
- US-008: Continue Where You Left Off

**P2 - Medium (Nice to Have):**
- US-009: Side-by-Side Notes
- US-010: Skeleton Loading States
- US-011: Micro-Interactions
- US-012: Optimized Heatmap

### Total Effort Estimation

- **Phase 1:** 16 story points (~3-4 days)
- **Phase 2:** 11 story points (~2-3 days)
- **Phase 3:** 16 story points (~3-4 days)
- **Phase 4:** 13 story points (~2-3 days)

**Total:** 56 story points (~2-3 weeks for single developer)

### Success Metrics (Track After Implementation)

**Speed Metrics:**
- Time to create task: Target <5 seconds (measure from click to save)
- Clicks to common action: Target 1-2 clicks (measure FAB usage)
- Page load time: Target <1 second (measure with Lighthouse)

**Engagement Metrics:**
- Task completions per session: Target +30% increase
- Notes created per week: Target +50% increase
- Meeting scheduling completion rate: Target +25% increase

**Quality Metrics:**
- Dark mode adoption rate: Track % of users using dark theme
- FAB usage: Track % of tasks/notes/meetings created via FAB
- Command palette usage: Track keyboard shortcut engagement
- Mobile bounce rate: Target <20% (ensure responsive design works)

### Testing Checklist

**Cross-Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Device Testing:**
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667, 414x896)

**Accessibility Testing:**
- [ ] Keyboard navigation (Tab, Enter, ESC, Arrow keys)
- [ ] Screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Color contrast (WCAG AA minimum 4.5:1)
- [ ] Focus indicators (always visible)
- [ ] Reduced motion preference respected

**Theme Testing:**
- [ ] Light mode renders correctly
- [ ] Dark mode uses #141414 background
- [ ] Brand teal visible in both themes
- [ ] Transitions smooth between themes

---

## File Reference Index

This section maps each user story to the specific files that need to be created or modified:

### US-001: Dark Mode Fix
- **Modified:** `src/assets/styles/main.css` (lines 145-160)

### US-002: Brand Teal
- **Modified:** `src/assets/styles/main.css` (lines 54-79)
- **Modified:** `src/main.js` (PrimeVue theme configuration)

### US-003: Global FAB
- **Created:** `src/components/global/GlobalFAB.vue`
- **Modified:** `src/components/layout/AppLayout.vue` (add FAB component)
- **Modified:** `src/views/DashboardView.vue` (remove non-functional buttons)

### US-004: Command Palette
- **Created:** `src/components/global/CommandPalette.vue`
- **Modified:** `src/components/layout/AppLayout.vue` (add palette component)

### US-005: Compact Task Cards
- **Modified:** `src/features/tasks/components/TaskCard.vue` (complete rewrite)
- **Modified:** `src/views/TasksView.vue` (update task list structure)

### US-006: Chip Filters
- **Modified:** `src/features/tasks/components/TaskFilters.vue` (complete rewrite)

### US-007: Interactive Stat Cards
- **Modified:** `src/views/DashboardView.vue` (add click handlers, navigation)

### US-008: Continue Section
- **Created:** `src/stores/activity.js`
- **Created:** `src/components/dashboard/ContinueSection.vue`
- **Modified:** `src/views/DashboardView.vue` (add continue section)
- **Modified:** `src/views/TasksView.vue` (track activity)
- **Modified:** `src/views/NotesView.vue` (track activity)
- **Modified:** `src/features/scheduling/views/MeetingDetail.vue` (track activity)

### US-009: Side-by-Side Notes
- **Modified:** `src/views/NotesView.vue` (complete layout restructure)

### US-010: Skeleton Loaders
- **Created:** `src/components/common/SkeletonLoader.vue`
- **Created:** `src/components/skeletons/TaskSkeleton.vue`
- **Created:** `src/components/skeletons/StatCardSkeleton.vue`
- **Modified:** `src/views/TasksView.vue` (use skeleton)
- **Modified:** `src/views/DashboardView.vue` (use skeleton)

### US-011: Micro-Interactions
- **Modified:** `src/assets/styles/main.css` (add animation utilities)
- **Modified:** `src/features/tasks/components/TaskCard.vue` (add checkmark animation)
- **Modified:** `src/main.js` (configure toast animations)

### US-012: Optimized Heatmap
- **Modified:** `src/features/scheduling/components/TimeSlotHeatmap.vue` (complete rewrite)

---

## Next Steps

1. **Review & Prioritize:** Review this implementation guide with the team and confirm priorities
2. **Create Issues:** Convert each user story into GitHub issues with appropriate labels
3. **Sprint Planning:** Organize user stories into sprints based on phases
4. **Development:** Begin implementation starting with Phase 1 (Critical Quick Wins)
5. **Testing:** Conduct thorough testing after each phase before moving to the next
6. **Metrics:** Set up analytics to track success metrics
7. **Iteration:** Gather user feedback and iterate on improvements

---

**Document Version:** 1.0
**Last Updated:** 2025-12-16
**Author:** Claude (Coordino UX Analysis)
