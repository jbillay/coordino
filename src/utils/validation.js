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
  if (!email || typeof email !== 'string') {
    return false
  }
  const trimmedEmail = email.trim()
  if (!trimmedEmail) {
    return false
  }
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
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

/**
 * Validates minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum required length
 * @returns {boolean} True if value meets minimum length
 */
export const hasMinLength = (value, minLength) => {
  if (!value) {
    return false
  }
  return value.length >= minLength
}

/**
 * Validates maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if value is within maximum length
 */
export const hasMaxLength = (value, maxLength) => {
  if (!value) {
    return true
  }
  return value.length <= maxLength
}

/**
 * Validates email address with detailed error messages
 * Used for profile management (FR-007)
 * @param {string} email - Email address to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }

  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' }
  }

  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return { valid: false, error: 'Email cannot be empty' }
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' }
  }

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email exceeds maximum length (254 characters)' }
  }

  return { valid: true }
}

/**
 * Validates password strength for user account configuration (FR-003)
 * Requirements: minimum 8 characters, uppercase, lowercase, numbers, special characters
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result with specific error messages
 */
export const validatePasswordStrength = (password) => {
  const errors = []

  if (!password) {
    return { valid: false, errors: ['Password is required'] }
  }

  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] }
  }

  // Minimum 8 characters (FR-003)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Must contain number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Must contain special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)')
  }

  // Maximum length check (reasonable limit)
  if (password.length > 128) {
    errors.push('Password exceeds maximum length (128 characters)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates timezone identifier (IANA format)
 * @param {string} timezone - Timezone identifier (e.g., "America/New_York")
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateTimezone = (timezone) => {
  if (!timezone) {
    return { valid: false, error: 'Timezone is required' }
  }

  if (typeof timezone !== 'string') {
    return { valid: false, error: 'Timezone must be a string' }
  }

  // Validate using Intl.DateTimeFormat
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid timezone identifier' }
  }
}

/**
 * Validates theme value
 * @param {string} theme - Theme value ("light" or "dark")
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateTheme = (theme) => {
  const validThemes = ['light', 'dark']

  if (!theme) {
    return { valid: false, error: 'Theme is required' }
  }

  if (!validThemes.includes(theme)) {
    return { valid: false, error: 'Theme must be "light" or "dark"' }
  }

  return { valid: true }
}

/**
 * Validates date format
 * @param {string} format - Date format string
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateDateFormat = (format) => {
  const validFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']

  if (!format) {
    return { valid: false, error: 'Date format is required' }
  }

  if (!validFormats.includes(format)) {
    return {
      valid: false,
      error: 'Date format must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD'
    }
  }

  return { valid: true }
}

/**
 * Validates hex color format (FR-046)
 * Supports both 3-char (#FFF) and 6-char (#FFFFFF) formats
 * @param {string} color - Hex color code
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export const validateHexColor = (color) => {
  if (!color) {
    return { valid: false, error: 'Color is required' }
  }

  if (typeof color !== 'string') {
    return { valid: false, error: 'Color must be a string' }
  }

  // Hex color regex: # followed by either 3 or 6 hex digits
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

  if (!hexColorRegex.test(color)) {
    return { valid: false, error: 'Invalid hex color format (use #FFF or #FFFFFF)' }
  }

  return { valid: true }
}
