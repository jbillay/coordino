/**
 * Content sanitization utilities
 * Feature: 001-user-config
 * Purpose: Sanitize user-generated content before database storage (FR-047)
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes user-generated content to prevent XSS attacks
 * Uses DOMPurify for HTML sanitization
 *
 * @param {string} content - Raw user content
 * @param {Object} options - Sanitization options
 * @param {boolean} options.allowHTML - Whether to allow safe HTML tags (default: false)
 * @param {number} options.maxLength - Maximum content length (default: undefined)
 * @returns {string} Sanitized content
 *
 * @example
 * sanitizeContent('<script>alert("xss")</script>Hello') // 'Hello'
 * sanitizeContent('Normal text') // 'Normal text'
 * sanitizeContent('<b>Bold</b>', { allowHTML: true }) // '<b>Bold</b>'
 */
export const sanitizeContent = (content, options = {}) => {
  const { allowHTML = false, maxLength } = options

  if (!content || typeof content !== 'string') {
    return ''
  }

  let sanitized = content

  if (allowHTML) {
    // Allow safe HTML tags, remove scripts and event handlers
    sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'title', 'target']
    })
  } else {
    // Strip all HTML tags completely
    // DOMPurify with empty ALLOWED_TAGS will remove tags but keep content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = DOMPurify.sanitize(content)
    sanitized = tempDiv.textContent || tempDiv.innerText || ''
  }

  // Trim whitespace
  sanitized = sanitized.trim()

  // Apply max length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitizes display name for user profile
 * Removes HTML, trims whitespace, enforces max length
 *
 * @param {string} name - User's display name
 * @returns {string} Sanitized name
 */
export const sanitizeDisplayName = (name) => {
  return sanitizeContent(name, {
    allowHTML: false,
    maxLength: 100
  })
}

/**
 * Sanitizes note content
 * Allows safe HTML formatting, enforces reasonable max length
 *
 * @param {string} content - Note content
 * @returns {string} Sanitized content
 */
export const sanitizeNoteContent = (content) => {
  return sanitizeContent(content, {
    allowHTML: true,
    maxLength: 50000 // ~50KB of text
  })
}

/**
 * Sanitizes task title
 * Removes HTML, trims whitespace, enforces max length
 *
 * @param {string} title - Task title
 * @returns {string} Sanitized title
 */
export const sanitizeTaskTitle = (title) => {
  return sanitizeContent(title, {
    allowHTML: false,
    maxLength: 500
  })
}

/**
 * Escapes special characters for use in regex patterns
 * Prevents regex injection attacks
 *
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for regex
 */
export const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') {
    return ''
  }

  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Sanitizes URL to prevent javascript: and data: schemes
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
export const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') {
    return null
  }

  const trimmedURL = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript):/i
  if (dangerousProtocols.test(trimmedURL)) {
    return null
  }

  // Allow http, https, mailto
  const allowedProtocols = /^(https?|mailto):/i
  if (!allowedProtocols.test(trimmedURL) && !trimmedURL.startsWith('/')) {
    return null
  }

  return trimmedURL
}
