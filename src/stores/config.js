import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { logger } from '@/utils/logger'

/**
 * User Configuration Store
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 *
 * Manages user preferences and configuration:
 * - Completed onboarding tours
 * - Feature discovery state
 * - User-specific settings
 */
export const useConfigStore = defineStore('config', () => {
  const { supabase } = useSupabase()

  // State
  const completedTours = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Initialize configuration by loading from database
   * Sets up realtime sync for configuration changes
   * @param {string} userId - User ID to load configuration for
   */
  const initialize = async (userId) => {
    if (!userId) {
      logger.warn('Cannot initialize config without user ID')
      return
    }

    loading.value = true
    error.value = null

    try {
      // Load user configuration from database
      const { data, error: fetchError } = await supabase
        .from('users_extended')
        .select('completed_tours')
        .eq('id', userId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Update state
      completedTours.value = data?.completed_tours || []

      logger.info('User configuration loaded successfully')
    } catch (e) {
      error.value = 'Failed to load user configuration'
      logger.error('Error loading user configuration:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a tour as completed
   * Feature: FR-013 - Tour completion tracking
   * @param {string} tourId - ID of the tour to mark as completed
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object with success status
   */
  const completeTour = async (tourId, userId) => {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    if (!tourId || typeof tourId !== 'string') {
      return { success: false, error: 'Valid tour ID is required' }
    }

    // Check if tour is already completed
    if (completedTours.value.includes(tourId)) {
      return { success: true, message: 'Tour already completed' }
    }

    loading.value = true
    error.value = null

    try {
      // Add tour to completed list
      const updatedTours = [...completedTours.value, tourId]

      // Update database
      const { error: updateError } = await supabase
        .from('users_extended')
        .update({
          completed_tours: updatedTours,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Update local state
      completedTours.value = updatedTours

      logger.info(`Tour completed: ${tourId}`)
      return { success: true }
    } catch (e) {
      error.value = 'Failed to save tour completion'
      logger.error('Error completing tour:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset a specific tour (mark as not completed)
   * Useful for testing or if user wants to see a tour again
   * @param {string} tourId - ID of the tour to reset
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object with success status
   */
  const resetTour = async (tourId, userId) => {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    if (!tourId || typeof tourId !== 'string') {
      return { success: false, error: 'Valid tour ID is required' }
    }

    loading.value = true
    error.value = null

    try {
      // Remove tour from completed list
      const updatedTours = completedTours.value.filter((id) => id !== tourId)

      // Update database
      const { error: updateError } = await supabase
        .from('users_extended')
        .update({
          completed_tours: updatedTours,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Update local state
      completedTours.value = updatedTours

      logger.info(`Tour reset: ${tourId}`)
      return { success: true }
    } catch (e) {
      error.value = 'Failed to reset tour'
      logger.error('Error resetting tour:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset all completed tours
   * Useful for testing or complete onboarding restart
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result object with success status
   */
  const resetAllTours = async (userId) => {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    loading.value = true
    error.value = null

    try {
      // Update database with empty array
      const { error: updateError } = await supabase
        .from('users_extended')
        .update({
          completed_tours: [],
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Update local state
      completedTours.value = []

      logger.info('All tours reset')
      return { success: true }
    } catch (e) {
      error.value = 'Failed to reset all tours'
      logger.error('Error resetting all tours:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if a specific tour has been completed
   * @param {string} tourId - ID of the tour to check
   * @returns {boolean} True if tour is completed
   */
  const isTourCompleted = (tourId) => completedTours.value.includes(tourId)

  /**
   * Get all completed tour IDs
   * @returns {string[]} Array of completed tour IDs
   */
  const getCompletedTours = () => [...completedTours.value]

  /**
   * Clear all configuration state
   * Called on logout
   */
  const clearConfig = () => {
    completedTours.value = []
    error.value = null
  }

  return {
    // State
    completedTours,
    loading,
    error,

    // Methods
    initialize,
    completeTour,
    resetTour,
    resetAllTours,
    isTourCompleted,
    getCompletedTours,
    clearConfig
  }
})
