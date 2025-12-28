/**
 * Password Reset Composable
 * Feature: 001-user-config - User Story 1 (Password Reset)
 *
 * Implements secure password reset flow with email verification (FR-001 through FR-005)
 * - Request password reset email (FR-001, FR-002)
 * - Validate password strength (FR-003)
 * - Update password with session invalidation (FR-004)
 * - Handle expired/invalid tokens (FR-005)
 */

import { ref } from 'vue'
import { useSupabase } from './useSupabase.js'
import { validateEmail, validatePasswordStrength } from '../utils/validation.js'

/**
 * Composable for password reset functionality
 * @returns {Object} Password reset state and methods
 */
export const usePasswordReset = () => {
  const { supabase } = useSupabase()

  // Reactive state
  const isLoading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)
  const emailSent = ref(false)

  /**
   * Reset all state to initial values
   */
  const resetState = () => {
    error.value = null
    successMessage.value = null
    emailSent.value = false
  }

  /**
   * Request password reset email (FR-001, FR-002)
   * Sends time-limited (24 hour) reset link to user's email
   *
   * @param {string} email - User's email address
   * @returns {Promise<void>}
   */
  const requestPasswordReset = async (email) => {
    resetState()
    isLoading.value = true

    try {
      // Validate email format (client-side)
      const validation = validateEmail(email)
      if (!validation.valid) {
        error.value = validation.error
        return
      }

      // Get current origin for redirect URL
      const redirectUrl = `${window.location.origin}/reset-password`

      // Request password reset from Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (resetError) {
        // Handle Supabase errors
        error.value = getErrorMessage(resetError)
        return
      }

      // Success - FR-001: Don't reveal whether email exists
      emailSent.value = true
      successMessage.value =
        'If an account exists with this email, you will receive a password reset link shortly. Please check your inbox.'
    } catch (err) {
      // Handle network or unexpected errors
      error.value = getErrorMessage(err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update user password (FR-003, FR-004)
   * Validates password strength and updates password in Supabase
   *
   * @param {string} newPassword - New password to set
   * @returns {Promise<void>}
   */
  const updatePassword = async (newPassword) => {
    resetState()
    isLoading.value = true

    try {
      // Validate password strength (FR-003)
      const validation = validatePasswordStrength(newPassword)
      if (!validation.valid) {
        error.value = validation.errors.join('. ')
        return
      }

      // Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        // Handle token expiration and other errors (FR-005)
        error.value = getErrorMessage(updateError)
        return
      }

      // Success - FR-004: All other sessions automatically invalidated by Supabase
      successMessage.value =
        'Your password has been updated successfully. You can now log in with your new password.'
    } catch (err) {
      // Handle network or unexpected errors
      error.value = getErrorMessage(err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Convert technical errors to user-friendly messages
   * @param {Error|Object} err - Error object from Supabase or network
   * @returns {string} User-friendly error message
   */
  const getErrorMessage = (err) => {
    // Handle Supabase Auth error codes (FR-005)
    if (err.code === 'expired_token' || err.message?.includes('expired')) {
      return 'Your password reset link has expired. Please request a new one.'
    }

    if (err.code === 'invalid_token' || err.message?.includes('invalid')) {
      return 'This password reset link is invalid or has already been used. Please request a new one.'
    }

    if (err.message?.includes('Email') || err.message?.includes('email')) {
      return err.message
    }

    // Network errors
    if (
      err.message?.includes('network') ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('Failed to fetch')
    ) {
      return 'Unable to connect. Please check your internet connection and try again.'
    }

    // Rate limiting
    if (err.message?.includes('rate limit')) {
      return 'Too many attempts. Please wait a few minutes before trying again.'
    }

    // Generic fallback
    return (
      err.message ||
      'An unexpected error occurred. Please try again or contact support if the issue persists.'
    )
  }

  return {
    // State
    isLoading,
    error,
    successMessage,
    emailSent,

    // Methods
    requestPasswordReset,
    updatePassword,
    resetState
  }
}
