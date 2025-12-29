/**
 * Session Timeout Composable
 * T089: Inactivity detection, warning trigger, and session extension
 *
 * Implements:
 * - FR-039: 30-minute inactivity timeout with 2-minute warning
 * - FR-040: Session extension capability
 * - SC-011: Warning at 28 minutes of inactivity
 * - Multi-tab session coordination via localStorage
 */

import { ref, computed, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

// Constants
const WARNING_THRESHOLD = 28 * 60 * 1000 // 28 minutes in milliseconds
const LOGOUT_THRESHOLD = 30 * 60 * 1000 // 30 minutes in milliseconds
const CHECK_INTERVAL = 1000 // Check every second
const STORAGE_KEY = 'lastActivity'

// Activity event types to track
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

export function useSessionTimeout() {
  const authStore = useAuthStore()
  const router = useRouter()

  // State
  const lastActivityTime = ref(Date.now())
  const isWarningVisible = ref(false)
  const isTracking = ref(false)

  // Timers
  let checkInterval = null
  let activityListeners = []

  /**
   * Get time since last activity in milliseconds
   */
  const timeSinceLastActivity = computed(() => Date.now() - lastActivityTime.value)

  /**
   * Get remaining time until logout in seconds
   */
  const remainingTime = computed(() => {
    const timeRemaining = LOGOUT_THRESHOLD - timeSinceLastActivity.value
    return Math.max(0, Math.floor(timeRemaining / 1000))
  })

  /**
   * Get remaining time in human-readable format
   */
  const remainingTimeFormatted = computed(() => {
    const seconds = remainingTime.value
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60

    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`
  })

  /**
   * Update last activity time and sync across tabs
   */
  function updateActivity() {
    const now = Date.now()
    lastActivityTime.value = now

    // Sync across tabs via localStorage
    try {
      localStorage.setItem(STORAGE_KEY, now.toString())
    } catch (error) {
      // Silently handle localStorage errors (e.g., in private browsing)
      console.warn('Failed to update activity in localStorage:', error)
    }
  }

  /**
   * Reset the inactivity timer
   */
  function resetTimer() {
    updateActivity()
    isWarningVisible.value = false
  }

  /**
   * Extend the session (called from warning dialog)
   */
  async function extendSession() {
    resetTimer()

    // Also refresh the auth token
    await authStore.extendSession()
  }

  /**
   * Handle user activity event
   */
  function handleActivity() {
    updateActivity()

    // Hide warning if visible
    if (isWarningVisible.value) {
      isWarningVisible.value = false
    }
  }

  /**
   * Check inactivity and trigger warnings/logout
   */
  function checkInactivity() {
    const elapsed = timeSinceLastActivity.value

    // Check if we should show warning (28 minutes)
    if (elapsed >= WARNING_THRESHOLD && elapsed < LOGOUT_THRESHOLD) {
      if (!isWarningVisible.value) {
        isWarningVisible.value = true
      }
    }

    // Check if we should logout (30 minutes)
    if (elapsed >= LOGOUT_THRESHOLD) {
      logout()
    }
  }

  /**
   * Logout user due to inactivity
   */
  async function logout() {
    // Stop tracking
    stopTracking()

    // Logout
    await authStore.logout()

    // Redirect to login with timeout message
    router.push({
      name: 'login',
      query: { reason: 'timeout' }
    })
  }

  /**
   * Handle storage events from other tabs
   */
  function handleStorageEvent(event) {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const otherTabActivity = parseInt(event.newValue, 10)

        // Update our last activity time if other tab was more recent
        if (otherTabActivity > lastActivityTime.value) {
          lastActivityTime.value = otherTabActivity

          // Hide warning if it's showing
          if (isWarningVisible.value) {
            isWarningVisible.value = false
          }
        }
      } catch (error) {
        console.warn('Failed to parse activity from other tab:', error)
      }
    }
  }

  /**
   * Start tracking user activity
   */
  function startTracking() {
    if (isTracking.value) {
      return // Already tracking
    }

    isTracking.value = true

    // Initialize last activity time
    updateActivity()

    // Load last activity from localStorage (for page refreshes)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const storedTime = parseInt(stored, 10)
        if (!isNaN(storedTime)) {
          lastActivityTime.value = storedTime
        }
      }
    } catch (error) {
      console.warn('Failed to load activity from localStorage:', error)
    }

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach((eventType) => {
      const isWindowEvent = eventType === 'scroll'
      const target = isWindowEvent ? window : document

      target.addEventListener(eventType, handleActivity, { passive: true })

      activityListeners.push({
        target,
        eventType,
        handler: handleActivity
      })
    })

    // Add storage event listener for multi-tab coordination
    window.addEventListener('storage', handleStorageEvent)

    // Start inactivity check interval
    checkInterval = setInterval(checkInactivity, CHECK_INTERVAL)

    // Immediate check
    checkInactivity()
  }

  /**
   * Stop tracking user activity
   */
  function stopTracking() {
    if (!isTracking.value) {
      return
    }

    isTracking.value = false

    // Remove activity event listeners
    activityListeners.forEach(({ target, eventType, handler }) => {
      target.removeEventListener(eventType, handler)
    })
    activityListeners = []

    // Remove storage event listener
    window.removeEventListener('storage', handleStorageEvent)

    // Clear interval
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }

    // Hide warning
    isWarningVisible.value = false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopTracking()
  })

  return {
    // State
    lastActivityTime,
    isWarningVisible,
    remainingTime,
    remainingTimeFormatted,
    timeSinceLastActivity,

    // Methods
    resetTimer,
    extendSession,
    startTracking,
    stopTracking
  }
}
