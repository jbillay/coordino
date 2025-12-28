/**
 * Unit tests for validation utilities
 * Feature: 001-user-config
 * Test-First Approach: Tests written BEFORE implementation
 */

import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePasswordStrength,
  validateTimezone,
  validateTheme,
  validateDateFormat,
  validateHexColor
} from '../../../src/utils/validation.js'

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true })
    expect(validateEmail('test.user+tag@example.co.uk')).toEqual({ valid: true })
    expect(validateEmail('user_name@subdomain.example.com')).toEqual({ valid: true })
  })

  it('should reject empty email', () => {
    const result = validateEmail('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should reject null or undefined email', () => {
    const result1 = validateEmail(null)
    expect(result1.valid).toBe(false)

    const result2 = validateEmail(undefined)
    expect(result2.valid).toBe(false)
  })

  it('should reject invalid email formats', () => {
    expect(validateEmail('@example.com').valid).toBe(false)
    expect(validateEmail('user@').valid).toBe(false)
    expect(validateEmail('user@@example.com').valid).toBe(false)
    expect(validateEmail('user@example').valid).toBe(false)
    expect(validateEmail('user example@test.com').valid).toBe(false)
  })

  it('should reject emails exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@test.com'
    const result = validateEmail(longEmail)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('maximum length')
  })

  it('should trim whitespace from email', () => {
    expect(validateEmail('  user@example.com  ')).toEqual({ valid: true })
  })
})

describe('validatePasswordStrength', () => {
  it('should validate strong passwords (FR-003)', () => {
    const result = validatePasswordStrength('SecurePass123!')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require minimum 8 characters', () => {
    const result = validatePasswordStrength('Short1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters long')
  })

  it('should require uppercase letter', () => {
    const result = validatePasswordStrength('password123!')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('uppercase'))).toBe(true)
  })

  it('should require lowercase letter', () => {
    const result = validatePasswordStrength('PASSWORD123!')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('lowercase'))).toBe(true)
  })

  it('should require number', () => {
    const result = validatePasswordStrength('SecurePassword!')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('number'))).toBe(true)
  })

  it('should require special character', () => {
    const result = validatePasswordStrength('SecurePassword123')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('special character'))).toBe(true)
  })

  it('should reject passwords exceeding 128 characters', () => {
    const longPassword = 'A1!' + 'a'.repeat(126)
    const result = validatePasswordStrength(longPassword)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password exceeds maximum length (128 characters)')
  })

  it('should return all validation errors at once', () => {
    const result = validatePasswordStrength('short')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })

  it('should reject empty password', () => {
    const result = validatePasswordStrength('')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password is required')
  })
})

describe('validateTimezone', () => {
  it('should validate IANA timezone identifiers', () => {
    expect(validateTimezone('America/New_York')).toEqual({ valid: true })
    expect(validateTimezone('Europe/London')).toEqual({ valid: true })
    expect(validateTimezone('Asia/Tokyo')).toEqual({ valid: true })
    expect(validateTimezone('UTC')).toEqual({ valid: true })
  })

  it('should reject invalid timezone identifiers', () => {
    const result = validateTimezone('Invalid/Timezone')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid timezone')
  })

  it('should reject empty timezone', () => {
    const result = validateTimezone('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should reject non-string timezone', () => {
    const result = validateTimezone(123)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must be a string')
  })
})

describe('validateTheme', () => {
  it('should validate "light" theme', () => {
    expect(validateTheme('light')).toEqual({ valid: true })
  })

  it('should validate "dark" theme', () => {
    expect(validateTheme('dark')).toEqual({ valid: true })
  })

  it('should reject invalid theme values', () => {
    const result = validateTheme('blue')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('"light" or "dark"')
  })

  it('should reject empty theme', () => {
    const result = validateTheme('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('validateDateFormat', () => {
  it('should validate MM/DD/YYYY format', () => {
    expect(validateDateFormat('MM/DD/YYYY')).toEqual({ valid: true })
  })

  it('should validate DD/MM/YYYY format', () => {
    expect(validateDateFormat('DD/MM/YYYY')).toEqual({ valid: true })
  })

  it('should validate YYYY-MM-DD format', () => {
    expect(validateDateFormat('YYYY-MM-DD')).toEqual({ valid: true })
  })

  it('should reject invalid date formats', () => {
    const result = validateDateFormat('DD-MM-YYYY')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('must be one of')
  })

  it('should reject empty date format', () => {
    const result = validateDateFormat('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('validateHexColor', () => {
  it('should validate 6-character hex colors (FR-046)', () => {
    expect(validateHexColor('#FFFFFF')).toEqual({ valid: true })
    expect(validateHexColor('#000000')).toEqual({ valid: true })
    expect(validateHexColor('#14b8a6')).toEqual({ valid: true }) // Brand teal
  })

  it('should validate 3-character hex colors', () => {
    expect(validateHexColor('#FFF')).toEqual({ valid: true })
    expect(validateHexColor('#000')).toEqual({ valid: true })
    expect(validateHexColor('#ABC')).toEqual({ valid: true })
  })

  it('should reject invalid hex color formats', () => {
    expect(validateHexColor('#GGGGGG').valid).toBe(false)
    expect(validateHexColor('FFFFFF').valid).toBe(false) // Missing #
    expect(validateHexColor('#FF').valid).toBe(false) // Too short
    expect(validateHexColor('#FFFFFFF').valid).toBe(false) // Too long
  })

  it('should reject empty color', () => {
    const result = validateHexColor('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should be case-insensitive', () => {
    expect(validateHexColor('#ffffff')).toEqual({ valid: true })
    expect(validateHexColor('#FfFfFf')).toEqual({ valid: true })
  })
})
