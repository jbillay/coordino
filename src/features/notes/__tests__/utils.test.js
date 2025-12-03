import { describe, it, expect } from 'vitest'
import {
  sanitizeHTML,
  stripHTMLTags,
  truncateText,
  getNotePreview,
  validateTopicName,
  validateNote,
  getWordCount,
  getReadingTime,
  highlightSearchTerms,
  getSearchSnippet
} from '../utils'

describe('Notes Utils', () => {
  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>'
      const result = sanitizeHTML(html)
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
    })

    it('should remove dangerous script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>'
      const result = sanitizeHTML(html)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should remove dangerous event handlers', () => {
      const html = '<p onclick="alert(\'xss\')">Click me</p>'
      const result = sanitizeHTML(html)
      expect(result).not.toContain('onclick')
    })

    it('should allow safe link attributes', () => {
      const html = '<a href="https://example.com" target="_blank">Link</a>'
      const result = sanitizeHTML(html)
      expect(result).toContain('href')
      expect(result).toContain('target')
    })
  })

  describe('stripHTMLTags', () => {
    it('should remove all HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>'
      const result = stripHTMLTags(html)
      expect(result).toBe('Hello world')
    })

    it('should handle nested tags', () => {
      const html = '<div><p>Hello <em><strong>world</strong></em></p></div>'
      const result = stripHTMLTags(html)
      expect(result).toBe('Hello world')
    })

    it('should handle empty string', () => {
      expect(stripHTMLTags('')).toBe('')
    })
  })

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      const text = 'Hello world'
      expect(truncateText(text, 20)).toBe('Hello world')
    })

    it('should truncate long text and add ellipsis', () => {
      const text = 'This is a very long text that should be truncated'
      const result = truncateText(text, 20)
      expect(result).toHaveLength(23) // 20 + '...'
      expect(result).toContain('...')
    })

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('getNotePreview', () => {
    it('should strip HTML and truncate', () => {
      const html = '<p>This is a <strong>test</strong> note with HTML</p>'
      const result = getNotePreview(html, 20)
      expect(result).not.toContain('<')
      expect(result).toHaveLength(23) // 20 + '...'
    })

    it('should handle plain text', () => {
      const text = 'Plain text note'
      expect(getNotePreview(text, 50)).toBe('Plain text note')
    })
  })

  describe('validateTopicName', () => {
    it('should validate valid topic name', () => {
      const result = validateTopicName('My Topic', [])
      expect(result.valid).toBe(true)
    })

    it('should reject empty topic name', () => {
      const result = validateTopicName('', [])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject duplicate topic name', () => {
      const existingTopics = [{ id: '1', name: 'Existing Topic' }]
      const result = validateTopicName('Existing Topic', existingTopics)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already exists')
    })

    it('should allow same name when editing same topic', () => {
      const existingTopics = [{ id: '1', name: 'My Topic' }]
      const result = validateTopicName('My Topic', existingTopics, '1')
      expect(result.valid).toBe(true)
    })

    it('should reject too long topic name', () => {
      const longName = 'a'.repeat(101)
      const result = validateTopicName(longName, [])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('100 characters')
    })
  })

  describe('validateNote', () => {
    it('should validate valid note', () => {
      const note = {
        title: 'Test Note',
        content: 'Some content',
        topic_id: '123' // Add topic_id
      }
      const result = validateNote(note)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject note without title', () => {
      const note = {
        title: '',
        content: 'Some content'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.title).toBeDefined()
    })

    it('should reject note with too long title', () => {
      const note = {
        title: 'a'.repeat(201), // Adjusted to 201 for > 200
        content: 'Content'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.title).toContain('200 characters') // Adjusted expectation
    })
  })

  describe('getWordCount', () => {
    it('should count words in plain text', () => {
      expect(getWordCount('Hello world test')).toBe(3)
    })

    it('should count words in HTML', () => {
      const html = '<p>Hello <strong>world</strong> test</p>'
      expect(getWordCount(html)).toBe(3)
    })

    it('should return 0 for empty content', () => {
      expect(getWordCount('')).toBe(0)
    })

    it('should handle multiple spaces', () => {
      expect(getWordCount('Hello    world')).toBe(2)
    })
  })

  describe('getReadingTime', () => {
    it('should calculate reading time', () => {
      // Assuming 200 words per minute
      const text = 'word '.repeat(200) // 200 words
      expect(getReadingTime(text)).toBe(1)
    })

    it('should return 0 for empty content', () => {
      expect(getReadingTime('')).toBe(0)
    })

    it('should round up reading time', () => {
      const text = 'word '.repeat(250) // 250 words = 1.25 minutes
      expect(getReadingTime(text)).toBe(2) // Should round to 2
    })
  })

  describe('highlightSearchTerms', () => {
    it('should highlight search terms', () => {
      const text = 'Hello world, this is a test'
      const result = highlightSearchTerms(text, 'world')
      expect(result).toContain('<mark') // Check for opening mark tag
      expect(result).toContain('world')
      expect(result).toContain('</mark>') // Check for closing mark tag
    })

    it('should be case-insensitive', () => {
      const text = 'Hello World'
      const result = highlightSearchTerms(text, 'world')
      expect(result).toContain('<mark') // Check for opening mark tag
      expect(result).toContain('World')
      expect(result).toContain('</mark>') // Check for closing mark tag
    })

    it('should handle no matches', () => {
      const text = 'Hello world'
      const result = highlightSearchTerms(text, 'test')
      expect(result).toBe('Hello world')
    })

    it('should handle empty query', () => {
      const text = 'Hello world'
      const result = highlightSearchTerms(text, '')
      expect(result).toBe('Hello world')
    })
  })

  describe('getSearchSnippet', () => {
    it('should return snippet around search term', () => {
      const text =
        'This is a very long text that contains the search term somewhere in the middle of it'
      const result = getSearchSnippet(text, 'search', 30)
      expect(result).toContain('search')
      expect(result.length).toBeLessThanOrEqual(72) // Adjusted expectation for 30 (left) + 6 (search) + 30 (right) + 3 ('...') + 3 ('...') max
    })

    it('should return beginning if search term not found', () => {
      const text = 'This is some text without the term'
      const result = getSearchSnippet(text, 'missing', 20)
      expect(result).toContain('This is some text')
    })

    it('should handle short text', () => {
      const text = 'Short text'
      const result = getSearchSnippet(text, 'text', 50)
      expect(result).toBe('Short text')
    })
  })
})
