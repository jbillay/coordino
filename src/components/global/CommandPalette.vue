<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/features/tasks/store'
import { useNotesStore } from '@/features/notes/store'

const router = useRouter()
const tasksStore = useTaskStore()
const notesStore = useNotesStore()

const isOpen = ref(false)
const query = ref('')
const selectedIndex = ref(0)
const commandInput = ref(null)

// Command definitions
const commands = computed(() => {
  const baseCommands = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      icon: 'pi-home',
      action: () => router.push('/dashboard'),
      category: 'Navigation',
      keywords: 'home'
    },
    {
      id: 'nav-tasks',
      title: 'Go to Tasks',
      icon: 'pi-check-circle',
      action: () => router.push('/tasks'),
      category: 'Navigation',
      keywords: 'todo'
    },
    {
      id: 'nav-notes',
      title: 'Go to Notes',
      icon: 'pi-file-edit',
      action: () => router.push('/notes'),
      category: 'Navigation',
      keywords: 'write'
    },
    {
      id: 'nav-scheduling',
      title: 'Go to Scheduling',
      icon: 'pi-calendar',
      action: () => router.push('/scheduling'),
      category: 'Navigation',
      keywords: 'meetings calendar'
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      icon: 'pi-cog',
      action: () => router.push('/settings'),
      category: 'Navigation',
      keywords: 'preferences config'
    },

    // Actions
    {
      id: 'action-new-task',
      title: 'Create New Task',
      icon: 'pi-plus-circle',
      action: () => router.push({ name: 'tasks', query: { action: 'create' } }),
      category: 'Actions',
      keywords: 'add todo'
    },
    {
      id: 'action-new-note',
      title: 'Create New Note',
      icon: 'pi-file-plus',
      action: () => router.push({ name: 'notes', query: { action: 'create' } }),
      category: 'Actions',
      keywords: 'write document'
    },
    {
      id: 'action-new-meeting',
      title: 'Schedule New Meeting',
      icon: 'pi-calendar-plus',
      action: () => router.push({ name: 'scheduling-create' }),
      category: 'Actions',
      keywords: 'calendar event'
    }
  ]

  // Add recent tasks if available
  const recentTasks =
    tasksStore.tasks?.slice(0, 5).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      icon: 'pi-check-circle',
      action: () => {
        router.push('/tasks')
        // Task detail will be opened by the Tasks view
      },
      category: 'Recent Tasks',
      keywords: task.title?.toLowerCase() || ''
    })) || []

  // Add recent notes if available
  const recentNotes =
    notesStore.notes?.slice(0, 5).map((note) => ({
      id: `note-${note.id}`,
      title: note.title || 'Untitled',
      icon: 'pi-file-edit',
      action: () => {
        router.push('/notes')
        // Note will be opened by the Notes view
      },
      category: 'Recent Notes',
      keywords: note.title?.toLowerCase() || ''
    })) || []

  return [...baseCommands, ...recentTasks, ...recentNotes]
})

// Filtered commands based on query
const filteredCommands = computed(() => {
  if (!query.value) {
    return commands.value.slice(0, 8) // Show first 8 when no query
  }

  const searchTerm = query.value.toLowerCase()
  return commands.value
    .filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(searchTerm)
      const keywordsMatch = cmd.keywords?.toLowerCase().includes(searchTerm)
      return titleMatch || keywordsMatch
    })
    .slice(0, 10) // Limit to 10 results
})

// Group commands by category
const groupedCommands = computed(() => {
  const groups = {}
  filteredCommands.value.forEach((cmd) => {
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
  if (!isOpen.value) {
    return
  }

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
      <div v-if="isOpen" class="command-palette-overlay" @click="close">
        <div class="command-palette" @click.stop @keydown="handleKeydown">
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
                v-for="command in categoryCommands"
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
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                Navigate
              </span>
              <span>
                <kbd>↵</kbd>
                Select
              </span>
              <span>
                <kbd>ESC</kbd>
                Close
              </span>
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
  border: 1px solid var(--border-default);
}

.command-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
}

.command-search i {
  color: var(--text-tertiary);
  font-size: 18px;
}

.command-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--text-primary);
}

.command-input::placeholder {
  color: var(--text-tertiary);
}

.command-hint {
  padding: 4px 8px;
  background: var(--bg-interactive);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  color: var(--text-tertiary);
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
  color: var(--text-tertiary);
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
  color: var(--text-primary);
}

.command-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-tertiary);
}

.command-footer {
  border-top: 1px solid var(--border-default);
  padding: 12px 20px;
  background: var(--bg-surface);
}

.command-shortcuts {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.command-shortcuts kbd {
  padding: 2px 6px;
  background: var(--bg-interactive);
  border: 1px solid var(--border-default);
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
