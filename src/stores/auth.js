import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'

export const useAuthStore = defineStore('auth', () => {
  const { supabase } = useSupabase()

  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  // Initialize by checking for existing session
  const initialize = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
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
    }
  }

  // Ensure user has extended profile
  const ensureUserProfile = async () => {
    if (!user.value) return

    const { data: profile, error: profileError } = await supabase
      .from('users_extended')
      .select('*')
      .eq('id', user.value.id)
      .single()

    // Create profile if it doesn't exist
    if (profileError && profileError.code === 'PGRST116') {
      await supabase
        .from('users_extended')
        .insert({
          id: user.value.id,
          full_name: user.value.user_metadata?.full_name || ''
        })
    }
  }

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

      if (signUpError) throw signUpError

      user.value = data.user
      await ensureUserProfile()

      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email, password) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      user.value = data.user
      await ensureUserProfile()

      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

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

      if (magicLinkError) throw magicLinkError

      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
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
