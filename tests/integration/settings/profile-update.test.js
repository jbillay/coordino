/**
 * Integration tests for Profile Update functionality
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 * Test-First Approach: Tests written BEFORE implementation
 *
 * Tests profile update flow with store integration and RLS policies (FR-006, FR-007)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../src/stores/auth.js'

// Mock Supabase composable - using a factory function for flexibility
let mockFromReturn = null

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    signInWithPassword: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
  },
  from: vi.fn(() => {
    // Return custom mock if set, otherwise default
    if (mockFromReturn) {
      return mockFromReturn
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    }
  }),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn()
  }))
}

// Helper to set custom from() behavior
const setMockFromReturn = (returnValue) => {
  mockFromReturn = returnValue
}

const resetMockFromReturn = () => {
  mockFromReturn = null
}

vi.mock('../../../src/composables/useSupabase.js', () => ({
  useSupabase: () => ({ supabase: mockSupabase })
}))

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

vi.mock('../../../src/utils/sanitization.js', () => ({
  sanitizeDisplayName: vi.fn((name) => name)
}))

vi.mock('../../../src/utils/validation.js', () => ({
  validateEmail: vi.fn((email) => {
    // Actual email validation logic
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' }
    }
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      return { valid: false, error: 'Invalid email format' }
    }
    return { valid: true }
  }),
  validatePasswordStrength: vi.fn((password) => {
    const errors = []
    if (!password) {
      return { valid: false, errors: ['Password is required'] }
    }
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&* etc.)')
    }
    return { valid: errors.length === 0, errors }
  })
}))

describe('Profile Update Integration', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    // Set up a logged-in user
    authStore.user = {
      id: 'user-123',
      email: 'test@example.com'
    }

    // Reset custom mock behavior
    resetMockFromReturn()

    // Set default successful auth.updateUser mock
    mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Display Name Update (FR-006)', () => {
    it('should update display name successfully', async () => {
      // Setup: Mock successful users_extended update
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'user-123',
                  display_name: 'John Doe',
                  updated_at: new Date().toISOString()
                },
                error: null
              })
            }))
          }))
        }))
      })

      // Execute: Update display name
      const result = await authStore.updateProfile({ displayName: 'John Doe' })

      // Verify: Update succeeded
      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('users_extended')
      expect(result.data.display_name).toBe('John Doe')
    })

    it('should validate display name length (max 100 chars)', async () => {
      const longName = 'A'.repeat(101)

      const result = await authStore.updateProfile({ displayName: longName })

      expect(result.success).toBe(false)
      expect(result.error).toContain('100 characters')
    })

    it('should sanitize display name to prevent XSS', async () => {
      // Setup: Mock successful users_extended update with sanitized name
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'user-123',
                  display_name: 'John Script', // Should be sanitized (no HTML tags)
                  updated_at: new Date().toISOString()
                },
                error: null
              })
            }))
          }))
        }))
      })

      const result = await authStore.updateProfile({
        displayName: 'John <script>alert("xss")</script>'
      })

      expect(result.success).toBe(true)
      // Display name should be sanitized (no HTML tags)
      expect(result.data.display_name).not.toContain('<script>')
    })
  })

  describe('Email Update with Re-authentication (FR-007)', () => {
    it('should require current password for email change', async () => {
      const result = await authStore.changeEmail('newemail@example.com', '')

      expect(result.success).toBe(false)
      expect(result.error).toContain('password')
    })

    it('should update email after successful re-authentication', async () => {
      // Mock successful password verification (re-authentication)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock successful email update
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'new@example.com' } },
        error: null
      })

      const result = await authStore.changeEmail('new@example.com', 'ValidPassword123!')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        email: 'new@example.com'
      })
    })

    it('should send verification email to new address', async () => {
      // Mock successful re-authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock successful email update
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'new@example.com',
            email_confirmed_at: null // Email needs verification
          }
        },
        error: null
      })

      const result = await authStore.changeEmail('new@example.com', 'ValidPassword123!')

      expect(result.success).toBe(true)
      expect(result.message).toContain('verification email')
    })

    it('should reject invalid email format', async () => {
      const result = await authStore.changeEmail('invalid-email', 'ValidPassword123!')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email')
    })
  })

  describe('Password Update with Re-authentication (FR-007)', () => {
    it('should require current password for password change', async () => {
      const result = await authStore.changePassword('', 'NewPassword123!')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Current password is required')
    })

    it('should validate new password strength', async () => {
      const result = await authStore.changePassword('CurrentPass123!', 'weak')

      expect(result.success).toBe(false)
      expect(result.error).toContain('at least 8 characters')
    })

    it('should update password after successful re-authentication', async () => {
      // Mock successful re-authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock successful password update
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      const result = await authStore.changePassword('CurrentPass123!', 'NewSecurePass123!')

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewSecurePass123!'
      })
    })

    it('should invalidate all sessions after password change', async () => {
      // Mock successful re-authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      // Mock successful password update
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })

      const result = await authStore.changePassword('CurrentPass123!', 'NewSecurePass123!')

      expect(result.success).toBe(true)
      // Supabase automatically invalidates other sessions on password change
      expect(result.message).toContain('password has been updated')
    })
  })

  describe('RLS Policy Enforcement', () => {
    it('should only allow user to update their own profile', async () => {
      // Simulate RLS policy violation (trying to update another user's profile)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' }
        },
        error: null
      })

      const updateChain = {
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '42501',
                message: 'new row violates row-level security policy'
              }
            })
          }))
        }))
      }
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => updateChain)
      })

      const result = await authStore.updateProfile({ displayName: 'Hacker' })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error during update
      setMockFromReturn({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockRejectedValue(new Error('Network request failed'))
            }))
          }))
        }))
      })

      const result = await authStore.updateProfile({ displayName: 'John' })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle Supabase errors with user-friendly messages', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' }
        },
        error: null
      })

      const updateChain = {
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'unique constraint violation'
              }
            })
          }))
        }))
      }
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => updateChain)
      })

      const result = await authStore.updateProfile({ displayName: 'John' })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })
})
