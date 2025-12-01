import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../auth'

describe('getErrorMessage', () => {
  it('returns a default message for null or undefined errors', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred')
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
  })

  it('maps known error messages', () => {
    expect(getErrorMessage({ message: 'Invalid login credentials' })).toBe(
      'Invalid email or password. Please try again.'
    )
    expect(getErrorMessage({ message: 'User already registered' })).toBe(
      'An account with this email already exists. Please sign in instead.'
    )
    expect(getErrorMessage({ message: 'Email not confirmed' })).toBe(
      'Please check your email and confirm your account before signing in.'
    )
    expect(getErrorMessage({ message: 'Email rate limit exceeded' })).toBe(
      'Too many attempts. Please wait a moment before trying again.'
    )
    expect(getErrorMessage({ message: 'Invalid email' })).toBe(
      'Please enter a valid email address.'
    )
    expect(getErrorMessage({ message: 'Password should be at least 6 characters' })).toBe(
      'Password must be at least 6 characters long.'
    )
    expect(getErrorMessage({ message: 'Network request failed' })).toBe(
      'Network error. Please check your connection and try again.'
    )
    expect(getErrorMessage({ message: 'Failed to fetch' })).toBe(
      'Network error. Please check your internet connection.'
    )
  })

  it('handles network errors', () => {
    expect(getErrorMessage({ name: 'TypeError' })).toBe(
      'Network error. Please check your internet connection.'
    )
    expect(getErrorMessage({ message: 'fetch failed' })).toBe(
      'Network error. Please check your internet connection.'
    )
  })

  it('returns a generic message for long errors', () => {
    const longMessage = 'a'.repeat(101)
    expect(getErrorMessage({ message: longMessage })).toBe(
      'An error occurred. Please try again or contact support.'
    )
  })

  it('returns the original message if not mapped', () => {
    expect(getErrorMessage({ message: 'An unknown but specific error' })).toBe(
      'An unknown but specific error'
    )
  })
})
