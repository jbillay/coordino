import { describe, it, expect } from 'vitest'
import {
  sanitizeHTML,
  stripHTMLTags,
  truncateText,
  getNotePreview,
  formatNoteTimestamp,
  highlightSearchTerms,
  getSearchSnippet,
  getTopicColor,
  validateTopicName,
  validateNote,
  getWordCount,
  getReadingTime,
  sortNotes,
  groupNotesByTopic,
  exportNotesToText,
  getPresetColors
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

    it('should return empty string for null input', () => {
      expect(sanitizeHTML(null)).toBe('')
    })

    it('should return empty string for undefined input', () => {
      expect(sanitizeHTML(undefined)).toBe('')
    })

    it('should allow all specified safe tags', () => {
      const html = `
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <ul><li>List item</li></ul>
        <ol><li>Ordered item</li></ol>
        <blockquote>Quote</blockquote>
        <code>code</code>
        <pre>preformatted</pre>
        <hr>
        <em>emphasis</em>
        <u>underline</u>
      `
      const result = sanitizeHTML(html)
      expect(result).toContain('<h1>')
      expect(result).toContain('<h2>')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('<code>')
      expect(result).toContain('<pre>')
      expect(result).toContain('<em>')
      expect(result).toContain('<u>')
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

    it('should return empty string for null input', () => {
      expect(stripHTMLTags(null)).toBe('')
    })

    it('should return empty string for undefined input', () => {
      expect(stripHTMLTags(undefined)).toBe('')
    })

    it('should preserve text content while removing tags', () => {
      const html = '<p>Line 1</p><p>Line 2</p>'
      const result = stripHTMLTags(html)
      expect(result).toContain('Line 1')
      expect(result).toContain('Line 2')
    })

    it('should use textContent when available', () => {
      const html = '<p>Test content</p>'
      const result = stripHTMLTags(html)
      expect(result).toBe('Test content')
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

    it('should return empty string for null input', () => {
      expect(truncateText(null)).toBe('')
    })

    it('should return empty string for undefined input', () => {
      expect(truncateText(undefined)).toBe('')
    })

    it('should use default maxLength of 150 when not provided', () => {
      const text = 'a'.repeat(200)
      const result = truncateText(text)
      expect(result).toHaveLength(153) // 150 + '...'
    })

    it('should not add ellipsis when text equals maxLength', () => {
      const text = 'a'.repeat(20)
      const result = truncateText(text, 20)
      expect(result).toBe(text)
      expect(result).not.toContain('...')
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

    it('should add ellipsis at start when snippet starts after beginning', () => {
      const text = 'The beginning of the text with search term at the end'
      const result = getSearchSnippet(text, 'search', 10)
      expect(result).toContain('...')
      expect(result.startsWith('...')).toBe(true)
    })

    it('should add ellipsis at end when snippet ends before end', () => {
      const text = 'search term at beginning followed by lots of additional text'
      const result = getSearchSnippet(text, 'search', 10)
      expect(result).toContain('...')
      expect(result.endsWith('...')).toBe(true)
    })

    it('should handle empty text', () => {
      const result = getSearchSnippet('', 'search', 20)
      expect(result).toBe('')
    })

    it('should handle empty search query', () => {
      const text = 'Some text here'
      const result = getSearchSnippet(text, '', 20)
      expect(result).toBe('Some text here')
    })

    it('should be case-insensitive', () => {
      const text = 'This contains the SEARCH term in uppercase'
      const result = getSearchSnippet(text, 'search', 15)
      expect(result).toContain('SEARCH')
    })

    it('should handle search term at the very beginning', () => {
      const text = 'search term at the start of a long text'
      const result = getSearchSnippet(text, 'search', 10)
      expect(result).not.toMatch(/^\.\.\./)
      expect(result).toContain('search')
    })

    it('should handle search term at the very end', () => {
      const text = 'A long text that ends with search'
      const result = getSearchSnippet(text, 'search', 10)
      expect(result).not.toMatch(/\.\.\.$/)
      expect(result).toContain('search')
    })
  })

  describe('formatNoteTimestamp', () => {
    it('should return empty string for null timestamp', () => {
      expect(formatNoteTimestamp(null)).toBe('')
    })

    it('should return empty string for undefined timestamp', () => {
      expect(formatNoteTimestamp(undefined)).toBe('')
    })

    it('should return empty string for empty string', () => {
      expect(formatNoteTimestamp('')).toBe('')
    })

    it('should format recent dates as relative time (within 7 days)', () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const result = formatNoteTimestamp(yesterday.toISOString())
      expect(result).toContain('ago')
    })

    it('should format old dates as absolute date (beyond 7 days)', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 30)
      const result = formatNoteTimestamp(oldDate.toISOString())
      expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
    })

    it('should respect custom relativeDays parameter', () => {
      const date = new Date()
      date.setDate(date.getDate() - 10)
      const result = formatNoteTimestamp(date.toISOString(), 15)
      expect(result).toContain('ago')
    })

    it('should use absolute format when relativeDays is 0', () => {
      // When relativeDays is 0, current date should still show as relative
      // because the differenceInDays will be 0, which is <= 0
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10)
      const result = formatNoteTimestamp(oldDate.toISOString(), 0)
      expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
    })
  })

  describe('getTopicColor', () => {
    it('should return the provided color', () => {
      expect(getTopicColor('#ff0000')).toBe('#ff0000')
    })

    it('should return default color for null', () => {
      expect(getTopicColor(null)).toBe('#6b7280')
    })

    it('should return default color for undefined', () => {
      expect(getTopicColor(undefined)).toBe('#6b7280')
    })

    it('should return default color for empty string', () => {
      expect(getTopicColor('')).toBe('#6b7280')
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

    it('should reject null topic name', () => {
      const result = validateTopicName(null, [])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject whitespace-only topic name', () => {
      const result = validateTopicName('   ', [])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject duplicate topic name', () => {
      const existingTopics = [{ id: '1', name: 'Existing Topic' }]
      const result = validateTopicName('Existing Topic', existingTopics)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already exists')
    })

    it('should reject duplicate topic name (case-insensitive)', () => {
      const existingTopics = [{ id: '1', name: 'Existing Topic' }]
      const result = validateTopicName('existing topic', existingTopics)
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

    it('should accept topic name at max length', () => {
      const maxName = 'a'.repeat(100)
      const result = validateTopicName(maxName, [])
      expect(result.valid).toBe(true)
    })
  })

  describe('validateNote', () => {
    it('should validate valid note', () => {
      const note = {
        title: 'Test Note',
        content: 'Some content',
        topic_id: '123'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should validate note without topic_id', () => {
      const note = {
        title: 'Test Note',
        content: 'Some content'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(true)
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

    it('should reject note with null title', () => {
      const note = {
        title: null,
        content: 'Some content'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.title).toContain('required')
    })

    it('should reject note with whitespace-only title', () => {
      const note = {
        title: '   ',
        content: 'Some content'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.title).toContain('required')
    })

    it('should reject note with too long title', () => {
      const note = {
        title: 'a'.repeat(201),
        content: 'Content'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.title).toContain('200 characters')
    })

    it('should accept note with title at max length', () => {
      const note = {
        title: 'a'.repeat(200),
        content: 'Content'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(true)
    })

    it('should reject note without content', () => {
      const note = {
        title: 'Test Note',
        content: ''
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.content).toContain('required')
    })

    it('should reject note with null content', () => {
      const note = {
        title: 'Test Note',
        content: null
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.content).toContain('required')
    })

    it('should reject note with HTML-only content (whitespace when stripped)', () => {
      const note = {
        title: 'Test Note',
        content: '<p>   </p>'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.content).toContain('required')
    })

    it('should accept note with HTML content', () => {
      const note = {
        title: 'Test Note',
        content: '<p>Real content here</p>'
      }
      const result = validateNote(note)
      expect(result.valid).toBe(true)
    })

    it('should return multiple errors when both title and content are invalid', () => {
      const note = {
        title: '',
        content: ''
      }
      const result = validateNote(note)
      expect(result.valid).toBe(false)
      expect(result.errors.title).toBeDefined()
      expect(result.errors.content).toBeDefined()
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

    it('should handle newlines and multiple whitespace types', () => {
      expect(getWordCount('Hello\nworld\t\ttest')).toBe(3)
    })

    it('should handle text with leading/trailing whitespace', () => {
      expect(getWordCount('  Hello world  ')).toBe(2)
    })

    it('should return 0 for whitespace-only content', () => {
      expect(getWordCount('   \n\t  ')).toBe(0)
    })
  })

  describe('getReadingTime', () => {
    it('should calculate reading time', () => {
      const text = 'word '.repeat(200)
      expect(getReadingTime(text)).toBe(1)
    })

    it('should return 0 for empty content', () => {
      expect(getReadingTime('')).toBe(0)
    })

    it('should round up reading time', () => {
      const text = 'word '.repeat(250)
      expect(getReadingTime(text)).toBe(2)
    })

    it('should calculate reading time for 100 words', () => {
      const text = 'word '.repeat(100)
      expect(getReadingTime(text)).toBe(1)
    })

    it('should calculate reading time for 1 word', () => {
      expect(getReadingTime('word')).toBe(1)
    })

    it('should calculate reading time for HTML content', () => {
      const html = `<p>${'word '.repeat(400)}</p>`
      expect(getReadingTime(html)).toBe(2)
    })
  })

  describe('highlightSearchTerms', () => {
    it('should highlight search terms', () => {
      const text = 'Hello world, this is a test'
      const result = highlightSearchTerms(text, 'world')
      expect(result).toContain('<mark')
      expect(result).toContain('world')
      expect(result).toContain('</mark>')
    })

    it('should be case-insensitive', () => {
      const text = 'Hello World'
      const result = highlightSearchTerms(text, 'world')
      expect(result).toContain('<mark')
      expect(result).toContain('World')
      expect(result).toContain('</mark>')
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

    it('should handle null text', () => {
      const result = highlightSearchTerms(null, 'search')
      expect(result).toBeNull()
    })

    it('should handle empty text', () => {
      const result = highlightSearchTerms('', 'search')
      expect(result).toBe('')
    })

    it('should highlight multiple occurrences', () => {
      const text = 'test test test'
      const result = highlightSearchTerms(text, 'test')
      const markCount = (result.match(/<mark/g) || []).length
      expect(markCount).toBe(3)
    })

    it('should highlight multiple search terms', () => {
      const text = 'Hello world this is a test'
      const result = highlightSearchTerms(text, 'hello test')
      expect(result).toContain('<mark')
      const resultLower = result.toLowerCase()
      expect(resultLower).toContain('hello')
      expect(resultLower).toContain('test')
    })

    it('should sanitize input text to prevent XSS', () => {
      const text = '<script>alert("xss")</script>Hello'
      const result = highlightSearchTerms(text, 'Hello')
      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
    })

    it('should escape special regex characters in search term', () => {
      const text = 'Price: $100.00 for item(s)'
      const result = highlightSearchTerms(text, '$100')
      expect(result).toContain('<mark')
      expect(result).toContain('$100')
    })

    it('should handle search term with parentheses', () => {
      const text = 'This is a test (with parentheses)'
      const result = highlightSearchTerms(text, '(with')
      expect(result).toContain('<mark')
    })

    it('should only allow mark tags in output', () => {
      const text = '<p>Hello</p>'
      const result = highlightSearchTerms(text, 'Hello')
      expect(result).not.toContain('<p>')
      expect(result).toContain('Hello')
    })
  })

  describe('sortNotes', () => {
    const mockNotes = [
      {
        id: '1',
        title: 'Zebra Note',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_pinned: false
      },
      {
        id: '2',
        title: 'Apple Note',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        is_pinned: false
      },
      {
        id: '3',
        title: 'Banana Note',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        is_pinned: true
      }
    ]

    it('should sort by title ascending', () => {
      const sorted = sortNotes(mockNotes, 'title', 'asc')
      expect(sorted[0].title).toBe('Banana Note') // Pinned first
      expect(sorted[1].title).toBe('Apple Note')
      expect(sorted[2].title).toBe('Zebra Note')
    })

    it('should sort by title descending', () => {
      const sorted = sortNotes(mockNotes, 'title', 'desc')
      expect(sorted[0].title).toBe('Banana Note') // Pinned first
      expect(sorted[1].title).toBe('Zebra Note')
      expect(sorted[2].title).toBe('Apple Note')
    })

    it('should sort by created_at descending (default)', () => {
      const sorted = sortNotes(mockNotes, 'created_at', 'desc')
      expect(sorted[0].id).toBe('3') // Pinned first
      expect(sorted[1].id).toBe('2') // Most recent
      expect(sorted[2].id).toBe('1')
    })

    it('should sort by created_at ascending', () => {
      const sorted = sortNotes(mockNotes, 'created_at', 'asc')
      expect(sorted[0].id).toBe('3') // Pinned first
      expect(sorted[1].id).toBe('1') // Oldest
      expect(sorted[2].id).toBe('2')
    })

    it('should sort by updated_at descending by default', () => {
      const sorted = sortNotes(mockNotes)
      expect(sorted[0].id).toBe('3') // Pinned and most recently updated
      expect(sorted[1].id).toBe('2')
      expect(sorted[2].id).toBe('1')
    })

    it('should sort by updated_at ascending', () => {
      const sorted = sortNotes(mockNotes, 'updated_at', 'asc')
      expect(sorted[0].id).toBe('3') // Pinned first
      expect(sorted[1].id).toBe('1')
      expect(sorted[2].id).toBe('2')
    })

    it('should always put pinned notes first', () => {
      const sorted = sortNotes(mockNotes, 'title', 'asc')
      expect(sorted[0].is_pinned).toBe(true)
    })

    it('should handle multiple pinned notes', () => {
      const notes = [
        { id: '1', title: 'Zebra', is_pinned: true, updated_at: '2024-01-01' },
        { id: '2', title: 'Apple', is_pinned: true, updated_at: '2024-01-03' },
        { id: '3', title: 'Banana', is_pinned: false, updated_at: '2024-01-02' }
      ]
      const sorted = sortNotes(notes, 'updated_at', 'desc')
      expect(sorted[0].id).toBe('2') // Pinned, most recent
      expect(sorted[1].id).toBe('1') // Pinned, older
      expect(sorted[2].id).toBe('3') // Not pinned
    })

    it('should not modify original array', () => {
      const original = [...mockNotes]
      sortNotes(mockNotes, 'title', 'asc')
      expect(mockNotes).toEqual(original)
    })

    it('should handle empty array', () => {
      const sorted = sortNotes([], 'title', 'asc')
      expect(sorted).toEqual([])
    })

    it('should handle single note', () => {
      const notes = [{ id: '1', title: 'Note', updated_at: '2024-01-01', is_pinned: false }]
      const sorted = sortNotes(notes, 'title', 'asc')
      expect(sorted).toHaveLength(1)
    })
  })

  describe('groupNotesByTopic', () => {
    it('should group notes by topic_id', () => {
      const notes = [
        { id: '1', topic_id: 'topic1' },
        { id: '2', topic_id: 'topic2' },
        { id: '3', topic_id: 'topic1' },
        { id: '4', topic_id: null }
      ]
      const grouped = groupNotesByTopic(notes)
      expect(grouped['topic1']).toHaveLength(2)
      expect(grouped['topic2']).toHaveLength(1)
      expect(grouped[null]).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const grouped = groupNotesByTopic([])
      expect(grouped).toEqual({})
    })

    it('should handle all notes with same topic', () => {
      const notes = [
        { id: '1', topic_id: 'topic1' },
        { id: '2', topic_id: 'topic1' }
      ]
      const grouped = groupNotesByTopic(notes)
      expect(Object.keys(grouped)).toHaveLength(1)
      expect(grouped['topic1']).toHaveLength(2)
    })

    it('should handle notes without topics', () => {
      const notes = [
        { id: '1', topic_id: null },
        { id: '2', topic_id: null }
      ]
      const grouped = groupNotesByTopic(notes)
      expect(grouped[null]).toHaveLength(2)
    })

    it('should preserve note objects', () => {
      const notes = [{ id: '1', topic_id: 'topic1', title: 'Note 1' }]
      const grouped = groupNotesByTopic(notes)
      expect(grouped['topic1'][0]).toEqual(notes[0])
    })
  })

  describe('exportNotesToText', () => {
    it('should export notes to text format', () => {
      const notes = [
        {
          title: 'Note 1',
          content: '<p>Content 1</p>',
          created_at: '2024-01-15T00:00:00Z',
          topic: { name: 'Work' }
        }
      ]
      const result = exportNotesToText(notes)
      expect(result).toContain('# Note 1')
      expect(result).toContain('Content 1')
      expect(result).toContain('Topic: Work')
      expect(result).toContain('='.repeat(80))
    })

    it('should handle notes without topic', () => {
      const notes = [
        {
          title: 'Note 1',
          content: 'Content',
          created_at: '2024-01-15T00:00:00Z',
          topic: null
        }
      ]
      const result = exportNotesToText(notes)
      expect(result).toContain('Topic: Unknown')
    })

    it('should strip HTML from content', () => {
      const notes = [
        {
          title: 'Note 1',
          content: '<p><strong>Bold</strong> text</p>',
          created_at: '2024-01-15T00:00:00Z',
          topic: { name: 'Work' }
        }
      ]
      const result = exportNotesToText(notes)
      expect(result).toContain('Bold text')
      expect(result).not.toContain('<p>')
      expect(result).not.toContain('<strong>')
    })

    it('should export multiple notes with separators', () => {
      const notes = [
        {
          title: 'Note 1',
          content: 'Content 1',
          created_at: '2024-01-15T00:00:00Z',
          topic: { name: 'Work' }
        },
        {
          title: 'Note 2',
          content: 'Content 2',
          created_at: '2024-01-16T00:00:00Z',
          topic: { name: 'Personal' }
        }
      ]
      const result = exportNotesToText(notes)
      expect(result).toContain('# Note 1')
      expect(result).toContain('# Note 2')
      const separatorCount = (result.match(/={80}/g) || []).length
      expect(separatorCount).toBe(2)
    })

    it('should handle empty notes array', () => {
      const result = exportNotesToText([])
      expect(result).toBe('')
    })

    it('should format date correctly', () => {
      const notes = [
        {
          title: 'Note',
          content: 'Content',
          created_at: '2024-01-15T00:00:00Z',
          topic: { name: 'Work' }
        }
      ]
      const result = exportNotesToText(notes)
      // date-fns format PPP produces "January 15th, 2024" format
      expect(result).toMatch(/Date: [A-Z][a-z]+ \d{1,2}(st|nd|rd|th)?, \d{4}/)
    })
  })

  describe('getPresetColors', () => {
    it('should return an array of colors', () => {
      const colors = getPresetColors()
      expect(Array.isArray(colors)).toBe(true)
      expect(colors.length).toBeGreaterThan(0)
    })

    it('should return hex color codes', () => {
      const colors = getPresetColors()
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    it('should return exactly 10 colors', () => {
      const colors = getPresetColors()
      expect(colors).toHaveLength(10)
    })

    it('should include expected color values', () => {
      const colors = getPresetColors()
      expect(colors).toContain('#3b82f6') // Blue
      expect(colors).toContain('#10b981') // Green
      expect(colors).toContain('#f59e0b') // Amber
      expect(colors).toContain('#ef4444') // Red
      expect(colors).toContain('#8b5cf6') // Purple
    })

    it('should return the same colors on multiple calls', () => {
      const colors1 = getPresetColors()
      const colors2 = getPresetColors()
      expect(colors1).toEqual(colors2)
    })
  })
})
