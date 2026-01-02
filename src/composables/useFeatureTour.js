/**
 * useFeatureTour Composable
 * Manages feature tour completion tracking and persistence
 *
 * Feature: 001-user-config - User Story 9 (First-Time User Experience)
 *
 * Provides methods to:
 * - Check if a tour has been completed
 * - Mark a tour as completed
 * - Reset individual or all tours
 * - Get list of completed tours
 *
 * This composable wraps the config store tour methods and handles
 * userId retrieval automatically from the auth store.
 */

import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/auth'

export function useFeatureTour() {
  const configStore = useConfigStore()
  const authStore = useAuthStore()

  /**
   * Get current user ID
   * @returns {string|null} User ID or null if not authenticated
   */
  function getUserId() {
    return authStore.user?.id || null
  }

  /**
   * Check if a specific tour has been completed
   * @param {string} tourId - The unique identifier for the tour
   * @returns {boolean} True if tour is completed, false otherwise
   */
  function isTourCompleted(tourId) {
    return configStore.isTourCompleted(tourId)
  }

  /**
   * Mark a tour as completed and persist to database
   * @param {string} tourId - The unique identifier for the tour
   * @returns {Promise<boolean>} True if successful, false on error
   */
  async function markTourCompleted(tourId) {
    const userId = getUserId()
    if (!userId) {
      console.error('Cannot mark tour completed: User not authenticated')
      return false
    }

    const result = await configStore.completeTour(tourId, userId)
    return result.success
  }

  /**
   * Reset a specific tour (mark as not completed)
   * @param {string} tourId - The unique identifier for the tour
   * @returns {Promise<boolean>} True if successful, false on error
   */
  async function resetTour(tourId) {
    const userId = getUserId()
    if (!userId) {
      console.error('Cannot reset tour: User not authenticated')
      return false
    }

    const result = await configStore.resetTour(tourId, userId)
    return result.success
  }

  /**
   * Reset all tours (mark all as not completed)
   * @returns {Promise<boolean>} True if successful, false on error
   */
  async function resetAllTours() {
    const userId = getUserId()
    if (!userId) {
      console.error('Cannot reset all tours: User not authenticated')
      return false
    }

    const result = await configStore.resetAllTours(userId)
    return result.success
  }

  /**
   * Get list of all completed tour IDs
   * @returns {string[]} Array of completed tour IDs
   */
  function getCompletedTours() {
    return configStore.getCompletedTours()
  }

  /**
   * Check if a tour should be shown to the user
   * Alias for !isTourCompleted for better readability
   * @param {string} tourId - The unique identifier for the tour
   * @returns {boolean} True if tour should be shown, false if already completed
   */
  function shouldShowTour(tourId) {
    return !isTourCompleted(tourId)
  }

  return {
    isTourCompleted,
    markTourCompleted,
    resetTour,
    resetAllTours,
    getCompletedTours,
    shouldShowTour
  }
}
