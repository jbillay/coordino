import { ref, reactive, computed } from 'vue'
import { isValidEmail, validatePassword, isNotEmpty, hasMinLength } from '@/utils/validation'

/**
 * Composable for form validation
 * Provides reactive validation state and helper functions
 *
 * @example
 * const { errors, validateField, validateForm, clearErrors } = useValidation()
 *
 * const rules = {
 *   email: [
 *     { validator: (v) => isNotEmpty(v), message: 'Email is required' },
 *     { validator: (v) => isValidEmail(v), message: 'Email is invalid' }
 *   ]
 * }
 *
 * validateField('email', emailValue, rules.email)
 */
export const useValidation = () => {
  const errors = reactive({})

  /**
   * Validates a single field against provided rules
   * @param {string} fieldName - Name of the field
   * @param {*} value - Field value to validate
   * @param {Array} rules - Array of validation rules
   * @returns {boolean} True if field is valid
   */
  const validateField = (fieldName, value, rules) => {
    if (!rules || rules.length === 0) {
      delete errors[fieldName]
      return true
    }

    for (const rule of rules) {
      if (!rule.validator(value)) {
        errors[fieldName] = rule.message
        return false
      }
    }

    delete errors[fieldName]
    return true
  }

  /**
   * Validates multiple fields
   * @param {Object} formData - Object containing field values
   * @param {Object} validationRules - Object mapping field names to rule arrays
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = (formData, validationRules) => {
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const fieldValue = formData[fieldName]
      const rules = validationRules[fieldName]

      if (!validateField(fieldName, fieldValue, rules)) {
        isValid = false
      }
    })

    return isValid
  }

  /**
   * Clears all validation errors
   */
  const clearErrors = () => {
    Object.keys(errors).forEach(key => delete errors[key])
  }

  /**
   * Clears error for a specific field
   * @param {string} fieldName - Name of the field
   */
  const clearFieldError = (fieldName) => {
    delete errors[fieldName]
  }

  /**
   * Checks if form has any errors
   */
  const hasErrors = computed(() => Object.keys(errors).length > 0)

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors
  }
}

/**
 * Common validation rules for reuse across forms
 */
export const commonRules = {
  required: (fieldLabel) => ({
    validator: (v) => isNotEmpty(v),
    message: `${fieldLabel} is required`
  }),

  email: {
    validator: (v) => !v || isValidEmail(v),
    message: 'Email is invalid'
  },

  emailRequired: {
    validator: (v) => isNotEmpty(v) && isValidEmail(v),
    message: 'Valid email is required'
  },

  minLength: (length, fieldLabel = 'Field') => ({
    validator: (v) => !v || hasMinLength(v, length),
    message: `${fieldLabel} must be at least ${length} characters`
  }),

  password: (minLength = 6) => ({
    validator: (v) => {
      if (!v) return false
      const result = validatePassword(v, { minLength })
      return result.isValid
    },
    message: `Password must be at least ${minLength} characters`
  }),

  passwordMatch: (passwordRef) => ({
    validator: (v) => v === passwordRef.value,
    message: 'Passwords do not match'
  })
}
