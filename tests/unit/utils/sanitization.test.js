/**
 * Unit tests for sanitization utilities
 * Feature: 001-user-config
 * Test-First Approach: Tests written BEFORE implementation (FR-047)
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeContent,
  sanitizeDisplayName,
  sanitizeNoteContent,
  sanitizeTaskTitle,
  escapeRegex,
  sanitizeURL
} from '../../../src/utils/sanitization.js'

describe('sanitizeContent', () => {
  it('should remove script tags by default', () => {
    const malicious = '<script>alert("xss")</script>Hello'
    const result = sanitizeContent(malicious)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toBe('Hello')
  })

  it('should remove event handlers', () => {
    const malicious = '<div onclick="alert()">Click me</div>'
    const result = sanitizeContent(malicious)
    expect(result).not.toContain('onclick')
    expect(result).toContain('Click me')
  })

  it('should strip all HTML when allowHTML is false', () => {
    const html = '<b>Bold</b> and <i>italic</i>'
    const result = sanitizeContent(html, { allowHTML: false })
    expect(result).toBe('Bold and italic')
  })

  it('should allow safe HTML when allowHTML is true', () => {
    const html = '<b>Bold</b> and <i>italic</i>'
    const result = sanitizeContent(html, { allowHTML: true })
    expect(result).toContain('<b>Bold</b>')
    expect(result).toContain('<i>italic</i>')
  })

  it('should remove dangerous HTML even when allowHTML is true', () => {
    const malicious = '<script>alert("xss")</script><b>Safe</b>'
    const result = sanitizeContent(malicious, { allowHTML: true })
    expect(result).not.toContain('<script>')
    expect(result).toContain('<b>Safe</b>')
  })

  it('should trim whitespace', () => {
    const result = sanitizeContent('  Hello World  ')
    expect(result).toBe('Hello World')
  })

  it('should enforce maxLength when specified', () => {
    const longText = 'a'.repeat(100)
    const result = sanitizeContent(longText, { maxLength: 50 })
    expect(result.length).toBe(50)
  })

  it('should return empty string for null or undefined input', () => {
    expect(sanitizeContent(null)).toBe('')
    expect(sanitizeContent(undefined)).toBe('')
  })

  it('should return empty string for non-string input', () => {
    expect(sanitizeContent(123)).toBe('')
    expect(sanitizeContent({})).toBe('')
    expect(sanitizeContent([])).toBe('')
  })
})

describe('sanitizeDisplayName', () => {
  it('should remove HTML tags from display name', () => {
    const result = sanitizeDisplayName('<b>John</b> Doe')
    expect(result).toBe('John Doe')
  })

  it('should enforce 100 character limit', () => {
    const longName = 'a'.repeat(150)
    const result = sanitizeDisplayName(longName)
    expect(result.length).toBe(100)
  })

  it('should trim whitespace', () => {
    const result = sanitizeDisplayName('  Jane Doe  ')
    expect(result).toBe('Jane Doe')
  })

  it('should handle XSS attempts', () => {
    const malicious = '<script>alert("xss")</script>John'
    const result = sanitizeDisplayName(malicious)
    expect(result).not.toContain('<script>')
    expect(result).toBe('John')
  })
})

describe('sanitizeNoteContent', () => {
  it('should allow safe HTML formatting in notes', () => {
    const formatted = '<b>Important:</b> <i>This is a note</i>'
    const result = sanitizeNoteContent(formatted)
    expect(result).toContain('<b>Important:</b>')
    expect(result).toContain('<i>This is a note</i>')
  })

  it('should remove dangerous HTML from notes', () => {
    const malicious = '<script>alert("xss")</script><p>Safe content</p>'
    const result = sanitizeNoteContent(malicious)
    expect(result).not.toContain('<script>')
    expect(result).toContain('Safe content')
  })

  it('should enforce 50000 character limit', () => {
    const veryLongNote = 'a'.repeat(60000)
    const result = sanitizeNoteContent(veryLongNote)
    expect(result.length).toBeLessThanOrEqual(50000)
  })
})

describe('sanitizeTaskTitle', () => {
  it('should remove all HTML from task titles', () => {
    const result = sanitizeTaskTitle('<b>Complete</b> project')
    expect(result).toBe('Complete project')
  })

  it('should enforce 500 character limit', () => {
    const longTitle = 'a'.repeat(600)
    const result = sanitizeTaskTitle(longTitle)
    expect(result.length).toBe(500)
  })

  it('should trim whitespace', () => {
    const result = sanitizeTaskTitle('  Review PR  ')
    expect(result).toBe('Review PR')
  })
})

describe('escapeRegex', () => {
  it('should escape regex special characters', () => {
    const special = '.*+?^${}()|[]'
    expect(escapeRegex(special)).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]')
  })

  it('should not modify regular text', () => {
    const result = escapeRegex('normal text')
    expect(result).toBe('normal text')
  })

  it('should return empty string for null or undefined', () => {
    expect(escapeRegex(null)).toBe('')
    expect(escapeRegex(undefined)).toBe('')
  })

  it('should prevent regex injection', () => {
    const userInput = '.*' // Would match everything in a regex
    const escaped = escapeRegex(userInput)
    const regex = new RegExp(escaped)
    expect(regex.test('anything')).toBe(false)
    expect(regex.test('.*')).toBe(true) // Only matches literal .*
  })
})

describe('sanitizeURL', () => {
  it('should allow http and https URLs', () => {
    expect(sanitizeURL('http://example.com')).toBe('http://example.com')
    expect(sanitizeURL('https://example.com')).toBe('https://example.com')
  })

  it('should allow mailto URLs', () => {
    expect(sanitizeURL('mailto:user@example.com')).toBe('mailto:user@example.com')
  })

  it('should allow relative paths', () => {
    expect(sanitizeURL('/about')).toBe('/about')
    expect(sanitizeURL('/docs/guide')).toBe('/docs/guide')
  })

  it('should block javascript: protocol', () => {
    expect(sanitizeURL('javascript:alert("xss")')).toBeNull()
    expect(sanitizeURL('JavaScript:alert("xss")')).toBeNull() // Case insensitive
  })

  it('should block data: protocol', () => {
    expect(sanitizeURL('data:text/html,<script>alert("xss")</script>')).toBeNull()
  })

  it('should block vbscript: protocol', () => {
    expect(sanitizeURL('vbscript:msgbox("xss")')).toBeNull()
  })

  it('should return null for null or undefined input', () => {
    expect(sanitizeURL(null)).toBeNull()
    expect(sanitizeURL(undefined)).toBeNull()
  })

  it('should return null for non-string input', () => {
    expect(sanitizeURL(123)).toBeNull()
    expect(sanitizeURL({})).toBeNull()
  })

  it('should trim whitespace from URLs', () => {
    expect(sanitizeURL('  https://example.com  ')).toBe('https://example.com')
  })

  it('should reject URLs without allowed protocols', () => {
    expect(sanitizeURL('ftp://example.com')).toBeNull()
    expect(sanitizeURL('file:///etc/passwd')).toBeNull()
  })
})
