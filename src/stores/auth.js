import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'

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
  const loading = ref(false)
  const error = ref(null)

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
      const { data: _profile, error: profileError } = await supabase
        .from('users_extended')
        .select('*')
        .eq('id', user.value.id)
        .single()

      // Create profile if it doesn't exist (PGRST116 = no rows returned)
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertError } = await supabase.from('users_extended').insert({
          id: user.value.id,
          full_name: user.value.user_metadata?.full_name || ''
        })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
        }
      } else if (profileError) {
        console.error('Error fetching user profile:', profileError)
      }
    } catch (e) {
      console.error('Error in ensureUserProfile:', e)
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
      console.error('Sign up error:', e)
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
      console.error('Sign in error:', e)
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
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Sign out error:', signOutError)
      }
      user.value = null
      error.value = null
    } catch (e) {
      console.error('Error signing out:', e)
      // Still clear user even if error
      user.value = null
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialize,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut
  }
})
