/**
 * Secure Logger Utility
 * Conditionally logs messages based on environment
 * In production, errors are suppressed to prevent information disclosure
 *
 * Usage:
 *   import { logger } from '@/utils/logger'
 *   logger.error('Error message', error)
 *   logger.warn('Warning message')
 *   logger.info('Info message')
 *   logger.debug('Debug message', data)
 */

const isDevelopment = import.meta.env.DEV

/**
 * Log levels
 */
const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

/**
 * Sanitize error objects to remove sensitive data
 * @param {Error|Object} error - Error object to sanitize
 * @returns {Object} Sanitized error object
 */
const sanitizeError = (error) => {
  if (!error) {
    return null
  }

  // Return safe error representation without sensitive data
  return {
    message: error.message || 'An error occurred',
    name: error.name || 'Error',
    // Only include stack trace in development
    ...(isDevelopment && { stack: error.stack })
  }
}

/**
 * Log message to console (development only)
 * @param {string} level - Log level (error, warn, info, debug)
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
const log = (level, message, data = null) => {
  // In production, only log to external service (Sentry, etc.)
  // For now, we just suppress console logs in production
  if (!isDevelopment) {
    // TODO: Integrate with error monitoring service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(data) for errors
    return
  }

  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  switch (level) {
    case LogLevel.ERROR:
      console.error(prefix, message, data ? sanitizeError(data) : '')
      break
    case LogLevel.WARN:
      console.warn(prefix, message, data || '')
      break
    case LogLevel.INFO:
      console.info(prefix, message, data || '')
      break
    case LogLevel.DEBUG:
      console.debug(prefix, message, data || '')
      break
    default:
      console.log(prefix, message, data || '')
  }
}

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  /**
   * Log error message (development only)
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object
   */
  error: (message, error = null) => {
    log(LogLevel.ERROR, message, error)
  },

  /**
   * Log warning message (development only)
   * @param {string} message - Warning message
   * @param {any} data - Additional data
   */
  warn: (message, data = null) => {
    log(LogLevel.WARN, message, data)
  },

  /**
   * Log info message (development only)
   * @param {string} message - Info message
   * @param {any} data - Additional data
   */
  info: (message, data = null) => {
    log(LogLevel.INFO, message, data)
  },

  /**
   * Log debug message (development only)
   * @param {string} message - Debug message
   * @param {any} data - Additional data
   */
  debug: (message, data = null) => {
    log(LogLevel.DEBUG, message, data)
  }
}

/**
 * Default export
 */
export default logger
