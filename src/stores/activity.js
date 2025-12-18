import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Activity Store
 *
 * Tracks user activity across the application for "Continue where you left off" feature.
 * Stores recent tasks, notes, and meetings that user has interacted with.
 * Persists to localStorage for cross-session continuity.
 */
export const useActivityStore = defineStore('activity', () => {
  const MAX_ACTIVITIES = 50
  const recentActivity = ref([])

  /**
   * Load activity from localStorage on init
   */
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

  /**
   * Save activity to localStorage
   */
  const saveActivity = () => {
    try {
      localStorage.setItem('coordino_recent_activity', JSON.stringify(recentActivity.value))
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  /**
   * Track new activity
   * @param {string} type - Activity type: 'task', 'note', 'meeting'
   * @param {string} id - Item ID
   * @param {string} title - Item title
   * @param {Object} metadata - Additional metadata
   */
  const trackActivity = (type, id, title, metadata = {}) => {
    const activity = {
      type,
      id,
      title,
      metadata,
      timestamp: Date.now()
    }

    // Remove existing entry for same item (prevent duplicates)
    recentActivity.value = recentActivity.value.filter((a) => !(a.type === type && a.id === id))

    // Add to front
    recentActivity.value.unshift(activity)

    // Limit to MAX_ACTIVITIES
    if (recentActivity.value.length > MAX_ACTIVITIES) {
      recentActivity.value = recentActivity.value.slice(0, MAX_ACTIVITIES)
    }

    saveActivity()
  }

  /**
   * Get recent activities (limited)
   * @param {number} limit - Number of activities to return
   * @returns {ComputedRef} Recent activities
   */
  const getRecentActivities = (limit = 5) => computed(() => recentActivity.value.slice(0, limit))

  /**
   * Clear all activity
   */
  const clearActivity = () => {
    recentActivity.value = []
    saveActivity()
  }

  /**
   * Remove specific activity
   * @param {string} type - Activity type
   * @param {string} id - Item ID
   */
  const removeActivity = (type, id) => {
    recentActivity.value = recentActivity.value.filter((a) => !(a.type === type && a.id === id))
    saveActivity()
  }

  // Initialize on store creation
  loadActivity()

  return {
    recentActivity,
    trackActivity,
    getRecentActivities,
    clearActivity,
    removeActivity
  }
})
