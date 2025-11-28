/**
 * Unit Tests for Validation Utilities
 * Tests email validation, password validation, and other validators
 */

import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  EMAIL_REGEX,
  validatePassword,
  isNotEmpty,
  hasMinLength,
  hasMaxLength
} from '../validation'

describe('isValidEmail', () => {
  describe('valid emails', () => {
    it('accepts standard email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
    })

    it('accepts email with subdomains', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true)
    })

    it('accepts email with dots in local part', () => {
      expect(isValidEmail('user.name@example.com')).toBe(true)
    })

    it('accepts email with plus sign', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('accepts email with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true)
    })

    it('accepts email with hyphens in domain', () => {
      expect(isValidEmail('user@my-domain.com')).toBe(true)
    })

    it('accepts email with multiple TLD parts', () => {
      expect(isValidEmail('user@example.co.uk')).toBe(true)
    })
  })

  describe('invalid emails', () => {
    it('rejects email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false)
    })

    it('rejects email without domain', () => {
      expect(isValidEmail('user@')).toBe(false)
    })

    it('rejects email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false)
    })

    it('rejects email without TLD', () => {
      expect(isValidEmail('user@example')).toBe(false)
    })

    it('rejects email with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false)
    })

    it('rejects email with double @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false)
    })

    it('rejects email with invalid characters', () => {
      expect(isValidEmail('user<>@example.com')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles null input', () => {
      expect(isValidEmail(null)).toBe(false)
    })

    it('handles undefined input', () => {
      expect(isValidEmail(undefined)).toBe(false)
    })

    it('handles empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })

    it('handles whitespace only', () => {
      expect(isValidEmail('   ')).toBe(false)
    })

    it('trims whitespace before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true)
    })

    it('handles non-string input', () => {
      expect(isValidEmail(123)).toBe(false)
      expect(isValidEmail({})).toBe(false)
      expect(isValidEmail([])).toBe(false)
    })
  })
})

describe('EMAIL_REGEX', () => {
  it('is exported and accessible', () => {
    expect(EMAIL_REGEX).toBeDefined()
    expect(EMAIL_REGEX).toBeInstanceOf(RegExp)
  })

  it('follows RFC 5322 pattern', () => {
    // The regex should be anchored (^ and $)
    expect(EMAIL_REGEX.source).toContain('^')
    expect(EMAIL_REGEX.source).toContain('$')
  })
})

describe('validatePassword', () => {
  describe('basic validation', () => {
    it('accepts password meeting minimum length', () => {
      const result = validatePassword('password123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects password below minimum length', () => {
      const result = validatePassword('pass')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 6 characters')
    })

    it('rejects empty password', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is required')
    })

    it('rejects null password', () => {
      const result = validatePassword(null)
      expect(result.isValid).toBe(false)
    })
  })

  describe('custom minLength', () => {
    it('respects custom minimum length', () => {
      const result = validatePassword('pass', { minLength: 8 })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters')
    })

    it('accepts password meeting custom minimum', () => {
      const result = validatePassword('password', { minLength: 8 })
      expect(result.isValid).toBe(true)
    })
  })

  describe('character requirements', () => {
    it('validates uppercase requirement', () => {
      const result = validatePassword('password', { requireUppercase: true })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain an uppercase letter')

      const validResult = validatePassword('Password', { requireUppercase: true })
      expect(validResult.isValid).toBe(true)
    })

    it('validates lowercase requirement', () => {
      const result = validatePassword('PASSWORD', { requireLowercase: true })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain a lowercase letter')

      const validResult = validatePassword('Password', { requireLowercase: true })
      expect(validResult.isValid).toBe(true)
    })

    it('validates number requirement', () => {
      const result = validatePassword('password', { requireNumber: true })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain a number')

      const validResult = validatePassword('password1', { requireNumber: true })
      expect(validResult.isValid).toBe(true)
    })

    it('validates special character requirement', () => {
      const result = validatePassword('password', { requireSpecial: true })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain a special character')

      const validResult = validatePassword('password!', { requireSpecial: true })
      expect(validResult.isValid).toBe(true)
    })
  })

  describe('combined requirements', () => {
    it('validates all requirements together', () => {
      const options = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
      }

      const result = validatePassword('pass', options)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)

      const validResult = validatePassword('Password123!', options)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)
    })
  })
})

describe('isNotEmpty', () => {
  it('accepts non-empty string', () => {
    expect(isNotEmpty('test')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isNotEmpty('')).toBe(false)
  })

  it('rejects string with only whitespace', () => {
    expect(isNotEmpty('   ')).toBe(false)
  })

  it('accepts string with content and whitespace', () => {
    expect(isNotEmpty('  test  ')).toBe(true)
  })

  it('handles null', () => {
    expect(isNotEmpty(null)).toBe(false)
  })

  it('handles undefined', () => {
    expect(isNotEmpty(undefined)).toBe(false)
  })

  it('accepts non-string truthy values', () => {
    expect(isNotEmpty(123)).toBe(true)
    expect(isNotEmpty(true)).toBe(true)
    expect(isNotEmpty({})).toBe(true)
  })
})

describe('hasMinLength', () => {
  it('accepts string meeting minimum length', () => {
    expect(hasMinLength('testing', 5)).toBe(true)
  })

  it('accepts string exactly at minimum length', () => {
    expect(hasMinLength('test', 4)).toBe(true)
  })

  it('rejects string below minimum length', () => {
    expect(hasMinLength('ab', 5)).toBe(false)
  })

  it('handles empty string', () => {
    expect(hasMinLength('', 1)).toBe(false)
  })

  it('handles null', () => {
    expect(hasMinLength(null, 5)).toBe(false)
  })
})

describe('hasMaxLength', () => {
  it('accepts string below maximum length', () => {
    expect(hasMaxLength('test', 10)).toBe(true)
  })

  it('accepts string exactly at maximum length', () => {
    expect(hasMaxLength('test', 4)).toBe(true)
  })

  it('rejects string above maximum length', () => {
    expect(hasMaxLength('testing', 5)).toBe(false)
  })

  it('accepts empty string', () => {
    expect(hasMaxLength('', 5)).toBe(true)
  })

  it('accepts null', () => {
    expect(hasMaxLength(null, 5)).toBe(true)
  })
})
