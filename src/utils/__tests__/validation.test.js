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
  hasMaxLength,
  validateUUID,
  isUUID
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

describe('validateUUID', () => {
  describe('valid UUIDs', () => {
    it('accepts valid v4 UUID', () => {
      const result = validateUUID('123e4567-e89b-42d3-a456-426614174000')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts v4 UUID with uppercase letters', () => {
      const result = validateUUID('123E4567-E89B-42D3-A456-426614174000')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts v4 UUID with mixed case', () => {
      const result = validateUUID('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6')
      expect(result.valid).toBe(true)
    })

    it('accepts v4 UUID with all lowercase', () => {
      const result = validateUUID('550e8400-e29b-41d4-a716-446655440000')
      expect(result.valid).toBe(true)
    })

    it('accepts v4 UUID with valid variant bits (8, 9, a, b)', () => {
      expect(validateUUID('123e4567-e89b-42d3-8456-426614174000').valid).toBe(true)
      expect(validateUUID('123e4567-e89b-42d3-9456-426614174000').valid).toBe(true)
      expect(validateUUID('123e4567-e89b-42d3-a456-426614174000').valid).toBe(true)
      expect(validateUUID('123e4567-e89b-42d3-b456-426614174000').valid).toBe(true)
    })
  })

  describe('invalid UUIDs', () => {
    it('rejects UUID with wrong version (not v4)', () => {
      const result = validateUUID('123e4567-e89b-12d3-a456-426614174000')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects UUID with wrong version (v1)', () => {
      const result = validateUUID('123e4567-e89b-11d3-a456-426614174000')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects UUID with invalid variant bits', () => {
      const result = validateUUID('123e4567-e89b-42d3-c456-426614174000')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects UUID without hyphens', () => {
      const result = validateUUID('123e4567e89b42d3a456426614174000')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects UUID with wrong hyphen positions', () => {
      const result = validateUUID('123e4567-e89b42-d3a4-56426614174000')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects UUID with invalid characters', () => {
      const result = validateUUID('123e4567-e89g-42d3-a456-426614174000')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects UUID with wrong length', () => {
      const result = validateUUID('123e4567-e89b-42d3-a456-42661417400')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects completely invalid format', () => {
      const result = validateUUID('not-a-uuid')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('rejects random string', () => {
      const result = validateUUID('invalid-uuid-format-string')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })
  })

  describe('edge cases', () => {
    it('handles null input', () => {
      const result = validateUUID(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('UUID is required')
    })

    it('handles undefined input', () => {
      const result = validateUUID(undefined)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('UUID is required')
    })

    it('handles empty string', () => {
      const result = validateUUID('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('UUID is required')
    })

    it('handles non-string input (number)', () => {
      const result = validateUUID(123)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('UUID must be a string')
    })

    it('handles non-string input (object)', () => {
      const result = validateUUID({})
      expect(result.valid).toBe(false)
      expect(result.error).toBe('UUID must be a string')
    })

    it('handles non-string input (array)', () => {
      const result = validateUUID([])
      expect(result.valid).toBe(false)
      expect(result.error).toBe('UUID must be a string')
    })

    it('handles whitespace-only string', () => {
      const result = validateUUID('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })

    it('handles UUID with leading/trailing whitespace', () => {
      const result = validateUUID('  123e4567-e89b-42d3-a456-426614174000  ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid UUID format')
    })
  })
})

describe('isUUID', () => {
  describe('valid UUIDs', () => {
    it('accepts valid v4 UUID', () => {
      expect(isUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
    })

    it('accepts valid v1 UUID', () => {
      expect(isUUID('123e4567-e89b-11d3-a456-426614174000')).toBe(true)
    })

    it('accepts valid v3 UUID', () => {
      expect(isUUID('123e4567-e89b-31d3-a456-426614174000')).toBe(true)
    })

    it('accepts valid v5 UUID', () => {
      expect(isUUID('123e4567-e89b-51d3-a456-426614174000')).toBe(true)
    })

    it('accepts UUID with uppercase letters', () => {
      expect(isUUID('123E4567-E89B-42D3-A456-426614174000')).toBe(true)
    })

    it('accepts UUID with mixed case', () => {
      expect(isUUID('a1B2c3D4-e5F6-47A8-b9C0-d1E2f3A4b5C6')).toBe(true)
    })

    it('accepts UUID with all lowercase', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })
  })

  describe('invalid UUIDs', () => {
    it('rejects UUID without hyphens', () => {
      expect(isUUID('123e4567e89b42d3a456426614174000')).toBe(false)
    })

    it('rejects UUID with wrong hyphen positions', () => {
      expect(isUUID('123e4567-e89b42-d3a4-56426614174000')).toBe(false)
    })

    it('rejects UUID with invalid characters', () => {
      expect(isUUID('123e4567-e89g-42d3-a456-426614174000')).toBe(false)
    })

    it('rejects UUID with wrong length', () => {
      expect(isUUID('123e4567-e89b-42d3-a456-42661417400')).toBe(false)
    })

    it('rejects completely invalid format', () => {
      expect(isUUID('not-a-uuid')).toBe(false)
    })

    it('rejects random string', () => {
      expect(isUUID('invalid-uuid-format-string')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isUUID('')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles null input', () => {
      expect(isUUID(null)).toBe(false)
    })

    it('handles undefined input', () => {
      expect(isUUID(undefined)).toBe(false)
    })

    it('handles non-string input (number)', () => {
      expect(isUUID(123)).toBe(false)
    })

    it('handles non-string input (object)', () => {
      expect(isUUID({})).toBe(false)
    })

    it('handles non-string input (array)', () => {
      expect(isUUID([])).toBe(false)
    })

    it('handles whitespace-only string', () => {
      expect(isUUID('   ')).toBe(false)
    })

    it('handles UUID with leading/trailing whitespace', () => {
      expect(isUUID('  123e4567-e89b-42d3-a456-426614174000  ')).toBe(false)
    })
  })
})
