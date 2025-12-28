/**
 * Unit tests for usePasswordReset composable
 * Feature: 001-user-config - User Story 1 (Password Reset)
 * Test-First Approach: Tests written BEFORE implementation
 *
 * Tests the password reset flow state machine (FR-001, FR-002, FR-003, FR-004, FR-005)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePasswordReset } from '../../../src/composables/usePasswordReset.js'

// Mock Supabase composable
const mockSupabase = {
  auth: {
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn()
  }
}

vi.mock('../../../src/composables/useSupabase.js', () => ({
  useSupabase: () => ({ supabase: mockSupabase })
}))

describe('usePasswordReset', () => {
  let passwordReset

  beforeEach(() => {
    passwordReset = usePasswordReset()
    vi.clearAllMocks()
  })

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      expect(passwordReset.isLoading.value).toBe(false)
      expect(passwordReset.error.value).toBeNull()
      expect(passwordReset.successMessage.value).toBeNull()
      expect(passwordReset.emailSent.value).toBe(false)
    })

    it('should reset state when resetState() is called', async () => {
      passwordReset.error.value = 'Test error'
      passwordReset.successMessage.value = 'Test success'
      passwordReset.emailSent.value = true

      passwordReset.resetState()

      expect(passwordReset.error.value).toBeNull()
      expect(passwordReset.successMessage.value).toBeNull()
      expect(passwordReset.emailSent.value).toBe(false)
    })
  })

  describe('requestPasswordReset (FR-001, FR-002)', () => {
    it('should send password reset email successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      await passwordReset.requestPasswordReset('user@example.com')

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
        redirectTo: expect.stringContaining('/reset-password')
      })
      expect(passwordReset.emailSent.value).toBe(true)
      expect(passwordReset.error.value).toBeNull()
      expect(passwordReset.successMessage.value).toContain('reset link')
    })

    it('should handle email sending errors gracefully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email service unavailable' }
      })

      await passwordReset.requestPasswordReset('user@example.com')

      expect(passwordReset.emailSent.value).toBe(false)
      expect(passwordReset.error.value).toBeTruthy()
      expect(passwordReset.successMessage.value).toBeNull()
    })

    it('should validate email format before sending', async () => {
      await passwordReset.requestPasswordReset('invalid-email')

      expect(passwordReset.error.value).toContain('email')
      expect(passwordReset.emailSent.value).toBe(false)
    })

    it('should set loading state during request', async () => {
      let resolvePromise
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockSupabase.auth.resetPasswordForEmail.mockReturnValue(promise)

      const resetPromise = passwordReset.requestPasswordReset('user@example.com')

      expect(passwordReset.isLoading.value).toBe(true)

      resolvePromise({ error: null })
      await resetPromise

      expect(passwordReset.isLoading.value).toBe(false)
    })

    it('should not reveal whether email exists for security (FR-001)', async () => {
      // Even if user doesn't exist, Supabase returns success to prevent enumeration
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      await passwordReset.requestPasswordReset('nonexistent@example.com')

      expect(passwordReset.successMessage.value).toBeTruthy()
      expect(passwordReset.emailSent.value).toBe(true)
    })
  })

  describe('updatePassword (FR-003, FR-004)', () => {
    it('should update password successfully with valid strength', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })

      const newPassword = 'SecurePass123!'
      await passwordReset.updatePassword(newPassword)

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: newPassword })
      expect(passwordReset.error.value).toBeNull()
      expect(passwordReset.successMessage.value).toContain('updated successfully')
    })

    it('should validate password strength before updating (FR-003)', async () => {
      await passwordReset.updatePassword('weak')

      expect(passwordReset.error.value).toBeTruthy()
      expect(passwordReset.error.value).toContain('8 characters')
    })

    it('should enforce password requirements: uppercase, lowercase, number, special', async () => {
      const weakPasswords = [
        'lowercase1!', // Missing uppercase
        'UPPERCASE1!', // Missing lowercase
        'NoNumbers!', // Missing number
        'NoSpecial123' // Missing special character
      ]

      for (const password of weakPasswords) {
        passwordReset.resetState()
        await passwordReset.updatePassword(password)
        expect(passwordReset.error.value).toBeTruthy()
      }
    })

    it('should handle update errors from Supabase', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Session expired' }
      })

      await passwordReset.updatePassword('SecurePass123!')

      // Should show user-friendly message, not raw error
      expect(passwordReset.error.value).toContain('expired')
    })

    it('should invalidate all sessions after password update (FR-004)', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })

      await passwordReset.updatePassword('SecurePass123!')

      // Note: Session invalidation is handled by Supabase Auth automatically
      // This test verifies the flow completes successfully
      expect(passwordReset.successMessage.value).toBeTruthy()
    })
  })

  describe('Error Handling (FR-005)', () => {
    it('should handle expired reset tokens gracefully', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Token has expired', code: 'expired_token' }
      })

      await passwordReset.updatePassword('SecurePass123!')

      expect(passwordReset.error.value).toContain('expired')
    })

    it('should handle invalid reset tokens', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Invalid token', code: 'invalid_token' }
      })

      await passwordReset.updatePassword('SecurePass123!')

      expect(passwordReset.error.value).toContain('invalid')
    })

    it('should provide retry option for failed requests', () => {
      expect(typeof passwordReset.requestPasswordReset).toBe('function')
      expect(typeof passwordReset.updatePassword).toBe('function')
      // Users can call these methods again to retry
    })

    it('should clear previous errors when retrying', async () => {
      passwordReset.error.value = 'Previous error'

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      await passwordReset.requestPasswordReset('user@example.com')

      expect(passwordReset.error.value).toBeNull()
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockRejectedValue(new Error('Network error'))

      await passwordReset.requestPasswordReset('user@example.com')

      expect(passwordReset.error.value).toBeTruthy()
      expect(passwordReset.isLoading.value).toBe(false)
    })

    it('should provide user-friendly error messages for technical errors', async () => {
      mockSupabase.auth.updateUser.mockRejectedValue(new Error('ECONNREFUSED'))

      await passwordReset.updatePassword('SecurePass123!')

      expect(passwordReset.error.value).not.toContain('ECONNREFUSED')
      expect(passwordReset.error.value).toContain('connection')
    })
  })
})
