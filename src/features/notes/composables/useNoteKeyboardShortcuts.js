import { onMounted, onBeforeUnmount } from 'vue'

/**
 * Composable for managing keyboard shortcuts in the notes feature
 *
 * @param {Object} handlers - Object containing handler functions for different shortcuts
 * @param {Function} handlers.onNewNote - Handler for creating a new note (Ctrl/Cmd+N)
 * @param {Function} handlers.onSearch - Handler for focusing search (Ctrl/Cmd+K)
 * @param {Function} handlers.onSave - Handler for saving current note (Ctrl/Cmd+S)
 * @param {Function} handlers.onClose - Handler for closing current view (Escape)
 * @param {Function} handlers.onTogglePin - Handler for toggling pin (Ctrl/Cmd+P)
 * @param {Function} handlers.onDelete - Handler for deleting current note (Ctrl/Cmd+Delete)
 * @param {Boolean} enabled - Whether shortcuts are enabled (default: true)
 *
 * @returns {Object} Object with utility functions
 *
 * @example
 * useNoteKeyboardShortcuts({
 *   onNewNote: () => console.log('New note'),
 *   onSearch: () => console.log('Search'),
 *   onSave: () => console.log('Save')
 * })
 */
export function useNoteKeyboardShortcuts(handlers = {}, enabled = true) {
  const { onNewNote, onSearch, onSave, onClose, onTogglePin, onDelete } = handlers

  /**
   * Check if the modifier key is pressed (Ctrl on Windows/Linux, Cmd on Mac)
   */
  const isModifierKey = (event) => event.ctrlKey || event.metaKey

  /**
   * Check if the target is an input element where we should not intercept shortcuts
   */
  const isInputElement = (target) => {
    const tagName = target.tagName.toLowerCase()
    const { isContentEditable } = target

    return (
      tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable
    )
  }

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (event) => {
    if (!enabled) {
      return
    }

    const { key, target } = event
    const isInput = isInputElement(target)
    const isMod = isModifierKey(event)

    // Ctrl/Cmd + N: New Note (except when in input)
    if (isMod && key.toLowerCase() === 'n' && !isInput && onNewNote) {
      event.preventDefault()
      onNewNote()
      return
    }

    // Ctrl/Cmd + K: Focus Search (except when in editor)
    if (isMod && key.toLowerCase() === 'k' && !isInput && onSearch) {
      event.preventDefault()
      onSearch()
      return
    }

    // Ctrl/Cmd + S: Save (works everywhere)
    if (isMod && key.toLowerCase() === 's' && onSave) {
      event.preventDefault()
      onSave()
      return
    }

    // Ctrl/Cmd + P: Toggle Pin (except when in input)
    if (isMod && key.toLowerCase() === 'p' && !isInput && onTogglePin) {
      event.preventDefault()
      onTogglePin()
      return
    }

    // Ctrl/Cmd + Delete/Backspace: Delete (except when in input)
    if (isMod && (key === 'Delete' || key === 'Backspace') && !isInput && onDelete) {
      event.preventDefault()
      onDelete()
      return
    }

    // Escape: Close/Back (works everywhere)
    if (key === 'Escape' && onClose) {
      // Only prevent default if we actually handle it
      if (isInput) {
        // In input, blur the input first
        target.blur()
      } else {
        event.preventDefault()
        onClose()
      }
    }
  }

  /**
   * Set up keyboard shortcuts
   */
  const setupShortcuts = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Clean up keyboard shortcuts
   */
  const cleanupShortcuts = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }

  // Automatically set up and clean up shortcuts
  onMounted(() => {
    setupShortcuts()
  })

  onBeforeUnmount(() => {
    cleanupShortcuts()
  })

  return {
    setupShortcuts,
    cleanupShortcuts
  }
}

/**
 * Get keyboard shortcut display text based on platform
 * @param {string} key - The key (e.g., 'n', 'k', 's')
 * @param {boolean} modifier - Whether to include modifier key (default: true)
 * @returns {string} Formatted shortcut text
 */
export function getShortcutText(key, modifier = true) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  if (!modifier) {
    return key.toUpperCase()
  }

  return `${modKey}+${key.toUpperCase()}`
}

/**
 * Common keyboard shortcuts for notes feature
 */
export const SHORTCUTS = {
  NEW_NOTE: { key: 'n', modifier: true, label: 'New Note' },
  SEARCH: { key: 'k', modifier: true, label: 'Search' },
  SAVE: { key: 's', modifier: true, label: 'Save' },
  TOGGLE_PIN: { key: 'p', modifier: true, label: 'Toggle Pin' },
  DELETE: { key: 'Delete', modifier: true, label: 'Delete' },
  CLOSE: { key: 'Escape', modifier: false, label: 'Close/Back' }
}

/**
 * Get all shortcuts as formatted text
 * @returns {Array} Array of shortcut objects with text
 */
export function getAllShortcuts() {
  return Object.entries(SHORTCUTS).map(([id, shortcut]) => ({
    id,
    text: getShortcutText(shortcut.key, shortcut.modifier),
    label: shortcut.label
  }))
}
