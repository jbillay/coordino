import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { logger } from '@/utils/logger'

/**
 * Authentication error types and user-friendly messages
 */
const AUTH_ERRORS = {
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'User already registered': 'An account with this email already exists. Please sign in instead.',
  'Email not confirmed': 'Please check your email and confirm your account before signing in.',
  'Email rate limit exceeded': 'Too many attempts. Please wait a moment before trying again.',
  'Invalid email': 'Please enter a valid email address.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Network request failed': 'Network error. Please check your connection and try again.',
  'Failed to fetch': 'Network error. Please check your internet connection.'
}

/**
 * Converts Supabase error to user-friendly message
 * @param {Error} error - The error object from Supabase
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return 'An unexpected error occurred'
  }

  const message = error.message || error.error_description || error.toString()

  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(AUTH_ERRORS)) {
    if (message.includes(pattern)) {
      return friendlyMessage
    }
  }

  // Network errors
  if (error.name === 'TypeError' || message.includes('fetch')) {
    return AUTH_ERRORS['Failed to fetch']
  }

  // Default error message
  if (message.length > 100) {
    return 'An error occurred. Please try again or contact support.'
  }

  return message
}

/**
 * Authentication store
 * Manages user authentication state and operations
 */
export const useAuthStore = defineStore('auth', () => {
  const { supabase } = useSupabase()

  const user = ref(null)
  const userProfile = ref(null) // Extended profile data from users_extended
  const loading = ref(false)
  const error = ref(null)
  const profileSubscription = ref(null) // Realtime subscription

  const isAuthenticated = computed(() => !!user.value)

  /**
   * Initialize authentication by checking for existing session
   * Sets up auth state change listener
   */
  const initialize = async () => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Error getting session:', sessionError)
        error.value = getErrorMessage(sessionError)
        return
      }

      if (session) {
        user.value = session.user
        await ensureUserProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } catch (e) {
      console.error('Error initializing auth:', e)
      error.value = getErrorMessage(e)
    }
  }

  /**
   * Ensure user has extended profile in database
   * Creates profile if it doesn't exist
   */
  const ensureUserProfile = async () => {
    if (!user.value) {
      return
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('users_extended')
        .select('*')
        .eq('id', user.value.id)
        .single()

      // Create profile if it doesn't exist (PGRST116 = no rows returned)
      if (profileError && profileError.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('users_extended')
          .insert({
            id: user.value.id,
            full_name: user.value.user_metadata?.full_name || ''
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating user profile:', insertError)
        } else {
          userProfile.value = newProfile
        }
      } else if (profileError) {
        console.error('Error fetching user profile:', profileError)
      } else {
        // Profile fetched successfully
        userProfile.value = profile
      }

      // Set up realtime sync after profile is loaded
      setupProfileSync()
    } catch (e) {
      console.error('Error in ensureUserProfile:', e)
    }
  }

  /**
   * Set up realtime subscription for profile changes
   * Feature: 001-user-config - User Story 2 (FR-012)
   * Syncs profile changes across tabs/devices in real-time
   */
  const setupProfileSync = () => {
    if (!user.value) {
      return
    }

    // Clean up existing subscription if any
    if (profileSubscription.value) {
      profileSubscription.value.unsubscribe()
    }

    // Subscribe to changes on this user's profile
    profileSubscription.value = supabase
      .channel(`profile-${user.value.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users_extended',
          filter: `id=eq.${user.value.id}`
        },
        (payload) => {
          logger.info('Profile updated from realtime sync:', payload.new)
          userProfile.value = payload.new
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Profile realtime sync active')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Profile realtime sync error')
        }
      })
  }

  /**
   * Clean up realtime subscription
   */
  const cleanupProfileSync = () => {
    if (profileSubscription.value) {
      profileSubscription.value.unsubscribe()
      profileSubscription.value = null
      logger.info('Profile realtime sync cleaned up')
    }
  }

  /**
   * Sign up a new user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {string} fullName - User's full name
   * @returns {Promise<Object>} Result object with success status and error if any
   */
  const signUp = async (email, password, fullName) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      user.value = data.user
      await ensureUserProfile()

      return { success: true }
    } catch (e) {
      const friendlyError = getErrorMessage(e)
      error.value = friendlyError
      logger.error('Sign up error:', e)
      return { success: false, error: friendlyError }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in existing user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<Object>} Result object with success status and error if any
   */
  const signIn = async (email, password) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        throw signInError
      }

      user.value = data.user
      await ensureUserProfile()

      return { success: true }
    } catch (e) {
      const friendlyError = getErrorMessage(e)
      error.value = friendlyError
      logger.error('Sign in error:', e)
      return { success: false, error: friendlyError }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in user with magic link (passwordless)
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Result object with success status and error if any
   */
  const signInWithMagicLink = async (email) => {
    loading.value = true
    error.value = null

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (magicLinkError) {
        throw magicLinkError
      }

      return { success: true }
    } catch (e) {
      const friendlyError = getErrorMessage(e)
      error.value = friendlyError
      console.error('Magic link error:', e)
      return { success: false, error: friendlyError }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  const signOut = async () => {
    try {
      // Clean up realtime subscription
      cleanupProfileSync()

      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Sign out error:', signOutError)
      }
      user.value = null
      userProfile.value = null
      error.value = null
    } catch (e) {
      console.error('Error signing out:', e)
      // Still clear user even if error
      cleanupProfileSync()
      user.value = null
      userProfile.value = null
    }
  }

  /**
   * Update user profile information
   * Feature: 001-user-config - User Story 2 (FR-006)
   * @param {Object} profileData - Profile data to update
   * @param {string} profileData.displayName - New display name
   * @returns {Promise<Object>} Result object with success status and error if any
   */
  const updateProfile = async (profileData) => {
    if (!user.value) {
      return { success: false, error: 'No user logged in' }
    }

    loading.value = true
    error.value = null

    try {
      // Validate display name length
      if (profileData.displayName && profileData.displayName.length > 100) {
        return { success: false, error: 'Display name must be 100 characters or less' }
      }

      // Sanitize display name (import sanitization utility)
      const { sanitizeDisplayName } = await import('@/utils/sanitization.js')
      const sanitizedName = sanitizeDisplayName(profileData.displayName)

      // Update users_extended table
      const { data, error: updateError } = await supabase
        .from('users_extended')
        .update({
          display_name: sanitizedName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update user metadata in auth
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { display_name: sanitizedName }
      })

      if (metadataError) {
        console.warn('Error updating user metadata:', metadataError)
        // Don't fail the whole operation if metadata update fails
      }

      return { success: true, data }
    } catch (e) {
      const friendlyError = getErrorMessage(e)
      error.value = friendlyError
      logger.error('Profile update error:', e)
      return { success: false, error: friendlyError }
    } finally {
      loading.value = false
    }
  }

  /**
   * Change user email address with re-authentication
   * Feature: 001-user-config - User Story 2 (FR-007)
   * @param {string} newEmail - New email address
   * @param {string} currentPassword - Current password for verification
   * @returns {Promise<Object>} Result object with success status and error if any
   */
  const changeEmail = async (newEmail, currentPassword) => {
    if (!user.value) {
      return { success: false, error: 'No user logged in' }
    }

    if (!currentPassword) {
      return { success: false, error: 'Current password is required to change email' }
    }

    loading.value = true
    error.value = null

    try {
      // Validate email format
      const { validateEmail } = await import('@/utils/validation.js')
      const validation = validateEmail(newEmail)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Re-authenticate user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.value.email,
        password: currentPassword
      })

      if (signInError) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (updateError) {
        throw updateError
      }

      return {
        success: true,
        message:
          'A verification email has been sent to your new email address. Please verify to complete the change.'
      }
    } catch (e) {
      const friendlyError = getErrorMessage(e)
      error.value = friendlyError
      logger.error('Email change error:', e)
      return { success: false, error: friendlyError }
    } finally {
      loading.value = false
    }
  }

  /**
   * Change user password with re-authentication
   * Feature: 001-user-config - User Story 2 (FR-007)
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result object with success status and error if any
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!user.value) {
      return { success: false, error: 'No user logged in' }
    }

    if (!currentPassword) {
      return { success: false, error: 'Current password is required to change password' }
    }

    loading.value = true
    error.value = null

    try {
      // Validate new password strength
      const { validatePasswordStrength } = await import('@/utils/validation.js')
      const validation = validatePasswordStrength(newPassword)
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('. ') }
      }

      // Re-authenticate user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.value.email,
        password: currentPassword
      })

      if (signInError) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      // Supabase automatically invalidates all other sessions on password change
      return {
        success: true,
        message:
          'Your password has been updated successfully. All other sessions have been signed out for security.'
      }
    } catch (e) {
      const friendlyError = getErrorMessage(e)
      error.value = friendlyError
      logger.error('Password change error:', e)
      return { success: false, error: friendlyError }
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete the current user's account permanently
   * Feature: 001-user-config - User Story 3 (Account Deletion)
   *
   * This will permanently delete the user's account and all associated data.
   * CASCADE delete rules in the database will automatically remove:
   * - Tasks and todos
   * - Notes and topics
   * - Meetings and participants
   * - User preferences and settings
   * - Extended profile data
   *
   * @throws {Error} If user is not authenticated
   * @returns {Promise<Object>} Result object with success status
   */
  const deleteAccount = async () => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    loading.value = true
    error.value = null

    try {
      const userId = user.value.id

      // Delete user via Supabase Admin API
      // This triggers CASCADE delete for all related data
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

      if (deleteError) {
        throw deleteError
      }

      // Sign out the user and clear all state
      await signOut()

      logger.info('Account deleted successfully:', userId)

      return { success: true }
    } catch (e) {
      const friendlyError = getErrorMessage(e)
      error.value = friendlyError
      logger.error('Account deletion error:', e)
      throw new Error(friendlyError)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,
    supabase,
    initialize,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    updateProfile,
    changeEmail,
    changePassword,
    deleteAccount
  }
})
