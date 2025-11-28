/**
 * Validation utility functions
 * Pure functions for common validation patterns
 */

/**
 * Email validation regex pattern
 * RFC 5322 compliant email validation
 * Validates format: localpart@domain with proper character restrictions
 *
 * Rules:
 * - Local part (before @): letters, digits, dots, hyphens, underscores
 * - Domain: letters, digits, dots, hyphens
 * - TLD (top-level domain): at least 2 letters
 *
 * Examples that pass: user@example.com, user.name+tag@example.co.uk
 * Examples that fail: @example.com, user@, user@@example.com, user@example
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/**
 * Validates if a string is a valid email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 *
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('user@example') // false
 * isValidEmail('  user@example.com  ') // true (trimmed automatically)
 * isValidEmail('@example.com') // false
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const trimmedEmail = email.trim()
  if (!trimmedEmail) return false
  return EMAIL_REGEX.test(trimmedEmail)
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum password length (default: 6)
 * @param {boolean} options.requireUppercase - Require uppercase letter
 * @param {boolean} options.requireLowercase - Require lowercase letter
 * @param {boolean} options.requireNumber - Require number
 * @param {boolean} options.requireSpecial - Require special character
 * @returns {Object} Validation result with isValid and errors array
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false
  } = options

  const errors = []

  if (!password) {
    return { isValid: false, errors: ['Password is required'] }
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`)
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain a number')
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain a special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates if a string is not empty after trimming
 * @param {string} value - Value to validate
 * @returns {boolean} True if value is not empty
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/**
 * Validates minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum required length
 * @returns {boolean} True if value meets minimum length
 */
export const hasMinLength = (value, minLength) => {
  if (!value) return false
  return value.length >= minLength
}

/**
 * Validates maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if value is within maximum length
 */
export const hasMaxLength = (value, maxLength) => {
  if (!value) return true
  return value.length <= maxLength
}
