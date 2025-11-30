import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore, getErrorMessage } from '../auth'
import { useSupabase } from '@/composables/useSupabase'

// Mock the useSupabase composable
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn()
}
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({ supabase: mockSupabase })
}))

describe('Auth Store', () => {
  let from, select, eq, single, insert
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    insert = vi.fn()
    single = vi.fn()
    eq = vi.fn(() => ({ single }))
    select = vi.fn(() => ({ eq }))
    from = vi.fn(() => ({ select, insert }))
    mockSupabase.from = from
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  describe('initialize', () => {
    it('sets user on successful session fetch', async () => {
      const mockSession = { user: { id: '123', email: 'test@test.com' } }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      single.mockResolvedValue({ data: { id: '123' }, error: null })
      
      const authStore = useAuthStore()
      await authStore.initialize()

      expect(authStore.user).toEqual(mockSession.user)
      expect(authStore.error).toBeNull()
    })

    it('sets error on session fetch failure', async () => {
      const mockError = { message: 'Session fetch error' }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: mockError })

      const authStore = useAuthStore()
      await authStore.initialize()

      expect(authStore.user).toBeNull()
      expect(authStore.error).toBe(getErrorMessage(mockError))
    })

    it('handles no session', async () => {
      const authStore = useAuthStore()
      await authStore.initialize()

      expect(authStore.user).toBeNull()
      expect(authStore.error).toBeNull()
    })

    it('sets up onAuthStateChange listener', async () => {
      const authStore = useAuthStore()
      await authStore.initialize()

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    })
  })

  describe('signUp', () => {
    it('signs up a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      mockSupabase.auth.signUp.mockResolvedValue({ data: { user: mockUser }, error: null })
      single.mockResolvedValue({ data: { id: '123' }, error: { code: 'PGRST116' } })

      const authStore = useAuthStore()
      const result = await authStore.signUp('test@test.com', 'password', 'Test User')

      expect(result.success).toBe(true)
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.error).toBeNull()
    })

    it('handles sign up error', async () => {
      const mockError = { message: 'User already registered' }
      mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: mockError })

      const authStore = useAuthStore()
      const result = await authStore.signUp('test@test.com', 'password', 'Test User')

      expect(result.success).toBe(false)
      expect(result.error).toBe(getErrorMessage(mockError))
      expect(authStore.user).toBeNull()
      expect(authStore.error).toBe(getErrorMessage(mockError))
    })
  })

  describe('signIn', () => {
    it('signs in a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: mockUser }, error: null })
      single.mockResolvedValue({ data: { id: '123' }, error: null })

      const authStore = useAuthStore()
      const result = await authStore.signIn('test@test.com', 'password')

      expect(result.success).toBe(true)
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.error).toBeNull()
    })

    it('handles sign in error', async () => {
      const mockError = { message: 'Invalid login credentials' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: mockError })

      const authStore = useAuthStore()
      const result = await authStore.signIn('test@test.com', 'password')

      expect(result.success).toBe(false)
      expect(result.error).toBe(getErrorMessage(mockError))
      expect(authStore.user).toBeNull()
      expect(authStore.error).toBe(getErrorMessage(mockError))
    })
  })

  describe('signInWithMagicLink', () => {
    it('sends a magic link successfully', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null })

      const authStore = useAuthStore()
      const result = await authStore.signInWithMagicLink('test@test.com')

      expect(result.success).toBe(true)
      expect(authStore.error).toBeNull()
    })

    it('handles magic link error', async () => {
      const mockError = { message: 'Email rate limit exceeded' }
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: mockError })

      const authStore = useAuthStore()
      const result = await authStore.signInWithMagicLink('test@test.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe(getErrorMessage(mockError))
      expect(authStore.error).toBe(getErrorMessage(mockError))
    })
  })

  describe('signOut', () => {
    it('signs out a user successfully', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '123', email: 'test@test.com' }
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await authStore.signOut()

      expect(authStore.user).toBeNull()
      expect(authStore.error).toBeNull()
    })

    it('handles sign out error', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '123', email: 'test@test.com' }
      const mockError = { message: 'Sign out failed' }
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

      await authStore.signOut()

      expect(authStore.user).toBeNull()
      expect(authStore.error).toBeNull()
    })
  })

  describe('ensureUserProfile', () => {
    it('does nothing if user is not defined', async () => {
      const authStore = useAuthStore()
      authStore.user = null
      await authStore.initialize()
      expect(from).not.toHaveBeenCalled()
    })

    it('does not create a profile if it already exists', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '123' }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null })
      single.mockResolvedValue({ data: { id: '123' }, error: null })
      
      await authStore.initialize()
      
      expect(from).toHaveBeenCalledWith('users_extended')
      expect(insert).not.toHaveBeenCalled()
    })

    it('creates a profile if it does not exist', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '123', user_metadata: { full_name: 'Test User' } }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: authStore.user } }, error: null })
      single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      insert.mockResolvedValue({ error: null })

      await authStore.initialize()

      expect(from).toHaveBeenCalledWith('users_extended')
      expect(insert).toHaveBeenCalledWith({ id: '123', full_name: 'Test User' })
    })

    it('handles error when creating a profile', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '123' }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null })
      single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      insert.mockResolvedValue({ error: { message: 'Insert failed' } })

      await authStore.initialize()
      
      expect(insert).toHaveBeenCalled()
    })

    it('handles error when fetching a profile', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '123' }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null })
      single.mockResolvedValue({ data: null, error: { message: 'Fetch failed' } })

      await authStore.initialize()

      expect(from).toHaveBeenCalledWith('users_extended')
    })
  })
})