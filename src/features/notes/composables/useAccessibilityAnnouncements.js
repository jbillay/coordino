import { ref } from 'vue'

/**
 * Composable for managing accessibility announcements via ARIA live regions
 *
 * This helps screen reader users stay informed about dynamic changes
 * in the application without needing to navigate away from their current focus
 *
 * @returns {Object} Methods and state for announcements
 */
export function useAccessibilityAnnouncements() {
  const announcement = ref('')
  const announcementPriority = ref('polite') // 'polite' or 'assertive'

  /**
   * Make an announcement to screen readers
   *
   * @param {string} message - The message to announce
   * @param {string} priority - 'polite' (default) or 'assertive' for urgent messages
   */
  const announce = (message, priority = 'polite') => {
    // Clear previous announcement first to ensure it re-announces even if same text
    announcement.value = ''
    announcementPriority.value = priority

    // Use setTimeout to ensure the screen reader picks up the change
    setTimeout(() => {
      announcement.value = message
    }, 100)

    // Clear after a delay to avoid cluttering the live region
    setTimeout(() => {
      announcement.value = ''
    }, 5000)
  }

  /**
   * Announce a loading state
   *
   * @param {string} context - What is being loaded (e.g., 'notes', 'topics')
   */
  const announceLoading = (context) => {
    announce(`Loading ${context}...`, 'polite')
  }

  /**
   * Announce completion
   *
   * @param {string} context - What was completed
   */
  const announceComplete = (context) => {
    announce(`${context} loaded`, 'polite')
  }

  /**
   * Announce an error
   *
   * @param {string} message - Error message
   */
  const announceError = (message) => {
    announce(`Error: ${message}`, 'assertive')
  }

  /**
   * Announce a success action
   *
   * @param {string} message - Success message
   */
  const announceSuccess = (message) => {
    announce(message, 'polite')
  }

  /**
   * Announce navigation change
   *
   * @param {string} destination - Where the user navigated to
   */
  const announceNavigation = (destination) => {
    announce(`Navigated to ${destination}`, 'polite')
  }

  /**
   * Announce search results
   *
   * @param {number} count - Number of results
   * @param {string} query - Search query
   */
  const announceSearchResults = (count, query) => {
    if (count === 0) {
      announce(`No results found for "${query}"`, 'polite')
    } else if (count === 1) {
      announce(`1 result found for "${query}"`, 'polite')
    } else {
      announce(`${count} results found for "${query}"`, 'polite')
    }
  }

  return {
    announcement,
    announcementPriority,
    announce,
    announceLoading,
    announceComplete,
    announceError,
    announceSuccess,
    announceNavigation,
    announceSearchResults
  }
}

/**
 * Generate a unique ID for accessibility purposes
 *
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateA11yId(prefix = 'a11y') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get ARIA label for priority level
 *
 * @param {string} priority - Priority level (urgent, high, medium, low)
 * @returns {string} Human-readable priority description
 */
export function getPriorityAriaLabel(priority) {
  const labels = {
    urgent: 'Urgent priority',
    high: 'High priority',
    medium: 'Medium priority',
    low: 'Low priority'
  }
  return labels[priority] || priority
}
