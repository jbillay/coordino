/**
 * Unit Tests for useValidation Composable
 * Tests form validation logic and rules
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useValidation, commonRules } from '../useValidation'

describe('useValidation', () => {
  let validation

  beforeEach(() => {
    validation = useValidation()
  })

  describe('validateField', () => {
    it('validates field with single rule', () => {
      const rules = [
        { validator: (v) => v.length > 0, message: 'Field is required' }
      ]

      const isValid = validation.validateField('username', 'test', rules)
      expect(isValid).toBe(true)
      expect(validation.errors.username).toBeUndefined()
    })

    it('returns error for invalid field', () => {
      const rules = [
        { validator: (v) => v.length > 5, message: 'Too short' }
      ]

      const isValid = validation.validateField('username', 'abc', rules)
      expect(isValid).toBe(false)
      expect(validation.errors.username).toBe('Too short')
    })

    it('validates field with multiple rules', () => {
      const rules = [
        { validator: (v) => v.length > 0, message: 'Required' },
        { validator: (v) => v.length >= 3, message: 'Min 3 chars' },
        { validator: (v) => /^[a-z]+$/.test(v), message: 'Lowercase only' }
      ]

      expect(validation.validateField('username', 'abc', rules)).toBe(true)
      expect(validation.validateField('username', 'AB', rules)).toBe(false)
      // AB fails at Min 3 chars (length 2), not Lowercase only
      expect(validation.errors.username).toBe('Min 3 chars')
    })

    it('stops at first failing rule', () => {
      const rules = [
        { validator: (v) => v.length > 0, message: 'Required' },
        { validator: (v) => v.length >= 10, message: 'Min 10 chars' }
      ]

      validation.validateField('password', 'short', rules)
      expect(validation.errors.password).toBe('Min 10 chars')
    })

    it('clears error when field becomes valid', () => {
      const rules = [
        { validator: (v) => v.length > 0, message: 'Required' }
      ]

      validation.validateField('email', '', rules)
      expect(validation.errors.email).toBe('Required')

      validation.validateField('email', 'test@example.com', rules)
      expect(validation.errors.email).toBeUndefined()
    })

    it('returns true for empty rules array', () => {
      const isValid = validation.validateField('field', 'value', [])
      expect(isValid).toBe(true)
      expect(validation.errors.field).toBeUndefined()
    })

    it('returns true for null/undefined rules', () => {
      expect(validation.validateField('field', 'value', null)).toBe(true)
      expect(validation.validateField('field', 'value', undefined)).toBe(true)
    })
  })

  describe('validateForm', () => {
    it('validates all fields successfully', () => {
      const formData = {
        username: 'john',
        email: 'john@example.com',
        age: 25
      }

      const rules = {
        username: [
          { validator: (v) => v.length > 0, message: 'Username required' }
        ],
        email: [
          { validator: (v) => v.includes('@'), message: 'Invalid email' }
        ],
        age: [
          { validator: (v) => v >= 18, message: 'Must be 18+' }
        ]
      }

      const isValid = validation.validateForm(formData, rules)
      expect(isValid).toBe(true)
      expect(Object.keys(validation.errors)).toHaveLength(0)
    })

    it('returns false when any field is invalid', () => {
      const formData = {
        username: '',
        email: 'valid@example.com'
      }

      const rules = {
        username: [
          { validator: (v) => v.length > 0, message: 'Username required' }
        ],
        email: [
          { validator: (v) => v.includes('@'), message: 'Invalid email' }
        ]
      }

      const isValid = validation.validateForm(formData, rules)
      expect(isValid).toBe(false)
      expect(validation.errors.username).toBe('Username required')
      expect(validation.errors.email).toBeUndefined()
    })

    it('validates multiple fields with multiple errors', () => {
      const formData = {
        username: '',
        email: 'invalid',
        password: '123'
      }

      const rules = {
        username: [
          { validator: (v) => v.length > 0, message: 'Username required' }
        ],
        email: [
          { validator: (v) => v.includes('@'), message: 'Email invalid' }
        ],
        password: [
          { validator: (v) => v.length >= 6, message: 'Password too short' }
        ]
      }

      const isValid = validation.validateForm(formData, rules)
      expect(isValid).toBe(false)
      expect(validation.errors.username).toBe('Username required')
      expect(validation.errors.email).toBe('Email invalid')
      expect(validation.errors.password).toBe('Password too short')
    })
  })

  describe('clearErrors', () => {
    it('clears all validation errors', () => {
      validation.errors.field1 = 'Error 1'
      validation.errors.field2 = 'Error 2'
      validation.errors.field3 = 'Error 3'

      validation.clearErrors()

      expect(Object.keys(validation.errors)).toHaveLength(0)
    })

    it('works when no errors exist', () => {
      validation.clearErrors()
      expect(Object.keys(validation.errors)).toHaveLength(0)
    })
  })

  describe('clearFieldError', () => {
    it('clears error for specific field', () => {
      validation.errors.email = 'Email invalid'
      validation.errors.password = 'Password too short'

      validation.clearFieldError('email')

      expect(validation.errors.email).toBeUndefined()
      expect(validation.errors.password).toBe('Password too short')
    })

    it('works for non-existent field', () => {
      validation.clearFieldError('nonexistent')
      expect(validation.errors.nonexistent).toBeUndefined()
    })
  })

  describe('hasErrors computed', () => {
    it('returns false when no errors', () => {
      expect(validation.hasErrors.value).toBe(false)
    })

    it('returns true when errors exist', () => {
      validation.errors.field = 'Error message'
      expect(validation.hasErrors.value).toBe(true)
    })

    it('updates reactively when errors change', () => {
      expect(validation.hasErrors.value).toBe(false)

      validation.errors.field = 'Error'
      expect(validation.hasErrors.value).toBe(true)

      delete validation.errors.field
      expect(validation.hasErrors.value).toBe(false)
    })
  })
})

describe('commonRules', () => {
  describe('required', () => {
    it('creates required rule with custom label', () => {
      const rule = commonRules.required('Email')

      expect(rule.validator('test')).toBe(true)
      expect(rule.validator('')).toBe(false)
      expect(rule.validator('   ')).toBe(false)
      expect(rule.message).toBe('Email is required')
    })
  })

  describe('email', () => {
    it('validates email format', () => {
      expect(commonRules.email.validator('test@example.com')).toBe(true)
      expect(commonRules.email.validator('invalid')).toBe(false)
      expect(commonRules.email.validator('')).toBe(true) // Empty is allowed
      expect(commonRules.email.validator(null)).toBe(true)
    })
  })

  describe('emailRequired', () => {
    it('requires valid email', () => {
      expect(commonRules.emailRequired.validator('test@example.com')).toBe(true)
      expect(commonRules.emailRequired.validator('')).toBe(false)
      expect(commonRules.emailRequired.validator('invalid')).toBe(false)
    })
  })

  describe('minLength', () => {
    it('validates minimum length', () => {
      const rule = commonRules.minLength(5, 'Username')

      expect(rule.validator('12345')).toBe(true)
      expect(rule.validator('123456')).toBe(true)
      expect(rule.validator('1234')).toBe(false)
      expect(rule.validator('')).toBe(true) // Empty allowed
      expect(rule.message).toBe('Username must be at least 5 characters')
    })
  })

  describe('password', () => {
    it('validates password with default min length', () => {
      const rule = commonRules.password()

      expect(rule.validator('123456')).toBe(true)
      expect(rule.validator('12345')).toBe(false)
      expect(rule.validator('')).toBe(false)
    })

    it('validates password with custom min length', () => {
      const rule = commonRules.password(8)

      expect(rule.validator('12345678')).toBe(true)
      expect(rule.validator('1234567')).toBe(false)
      expect(rule.message).toBe('Password must be at least 8 characters')
    })
  })

  describe('passwordMatch', () => {
    it('validates password match', () => {
      const password = ref('mypassword')
      const rule = commonRules.passwordMatch(password)

      expect(rule.validator('mypassword')).toBe(true)
      expect(rule.validator('different')).toBe(false)
      expect(rule.message).toBe('Passwords do not match')
    })

    it('updates when ref changes', () => {
      const password = ref('password1')
      const rule = commonRules.passwordMatch(password)

      expect(rule.validator('password1')).toBe(true)

      password.value = 'password2'
      expect(rule.validator('password1')).toBe(false)
      expect(rule.validator('password2')).toBe(true)
    })
  })
})
