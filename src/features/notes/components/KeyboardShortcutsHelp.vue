<script setup>
import { getShortcutText } from '../composables/useNoteKeyboardShortcuts'
import ShortcutItem from './ShortcutItem.vue'

defineProps({
  visible: Boolean
})

defineEmits(['update:visible'])
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    header="Keyboard Shortcuts"
    :style="{ width: '500px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Use these keyboard shortcuts to navigate and work more efficiently with notes.
      </p>

      <!-- Navigation Section -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider"
        >
          Navigation
        </h3>
        <div class="space-y-2">
          <ShortcutItem :shortcut="getShortcutText('n', true)" label="Create New Note" />
          <ShortcutItem :shortcut="getShortcutText('k', true)" label="Focus Search" />
          <ShortcutItem :shortcut="getShortcutText('Escape', false)" label="Close / Go Back" />
        </div>
      </div>

      <!-- Editing Section -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider"
        >
          Editing
        </h3>
        <div class="space-y-2">
          <ShortcutItem :shortcut="getShortcutText('s', true)" label="Save Note" />
          <ShortcutItem :shortcut="getShortcutText('b', true)" label="Bold Text" />
          <ShortcutItem :shortcut="getShortcutText('i', true)" label="Italic Text" />
          <ShortcutItem :shortcut="getShortcutText('u', true)" label="Underline Text" />
        </div>
      </div>

      <!-- Actions Section -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider"
        >
          Actions
        </h3>
        <div class="space-y-2">
          <ShortcutItem :shortcut="getShortcutText('p', true)" label="Pin / Unpin Note" />
          <ShortcutItem :shortcut="getShortcutText('Delete', true)" label="Delete Note" />
        </div>
      </div>

      <!-- Search Navigation Section -->
      <div>
        <h3
          class="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider"
        >
          Search Navigation
        </h3>
        <div class="space-y-2">
          <ShortcutItem :shortcut="'↓ / ↑'" label="Navigate Search Results" />
          <ShortcutItem :shortcut="'Enter'" label="Open Selected Result" />
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Close"
        icon="pi pi-times"
        class="p-button-text"
        @click="$emit('update:visible', false)"
      />
    </template>
  </Dialog>
</template>
