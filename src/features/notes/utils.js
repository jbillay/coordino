import { formatDistanceToNow, format, differenceInDays, parseISO } from 'date-fns'
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - Raw HTML content
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html) {
    return ''
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
      'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  })
}

/**
 * Strip HTML tags from content to get plain text
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
export const stripHTMLTags = (html) => {
  if (!html) {
    return ''
  }

  // Create a temporary div to extract text content
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ''
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 150) => {
  if (!text) {
    return ''
  }
  if (text.length <= maxLength) {
    return text
  }

  return `${text.substring(0, maxLength)}...`
}

/**
 * Get truncated preview of note content (strips HTML first)
 * @param {string} htmlContent - HTML content
 * @param {number} maxLength - Maximum length
 * @returns {string} Plain text preview
 */
export const getNotePreview = (htmlContent, maxLength = 150) => {
  const plainText = stripHTMLTags(htmlContent)
  return truncateText(plainText, maxLength)
}

/**
 * Format note timestamp as relative or absolute date
 * Shows relative time (e.g., "2 minutes ago") for recent notes
 * Shows absolute date (e.g., "Dec 2, 2025") for older notes
 * @param {string} timestamp - ISO timestamp
 * @param {number} relativeDays - Days to show relative time (default 7)
 * @returns {string} Formatted timestamp
 */
export const formatNoteTimestamp = (timestamp, relativeDays = 7) => {
  if (!timestamp) {
    return ''
  }

  const date = parseISO(timestamp)
  const daysDiff = differenceInDays(new Date(), date)

  if (daysDiff <= relativeDays) {
    // Show relative time for recent notes
    return formatDistanceToNow(date, { addSuffix: true })
  }
  // Show absolute date for older notes
  return format(date, 'MMM d, yyyy')
}

/**
 * Escape special regex characters to prevent regex injection
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for regex
 */
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Highlight search terms in text (XSS-safe)
 * @param {string} text - Text to highlight in
 * @param {string} searchQuery - Search query
 * @returns {string} HTML with highlighted terms (sanitized)
 */
export const highlightSearchTerms = (text, searchQuery) => {
  if (!text || !searchQuery) {
    return text
  }

  // First, sanitize the input text to prevent stored XSS
  const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })

  const terms = searchQuery.split(' ').filter((term) => term.length > 0)
  let highlighted = sanitizedText

  terms.forEach((term) => {
    // Escape special regex characters to prevent regex injection
    const escapedTerm = escapeRegex(term)
    const regex = new RegExp(`(${escapedTerm})`, 'gi')
    highlighted = highlighted.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
    )
  })

  // Sanitize the output to only allow <mark> tags
  return DOMPurify.sanitize(highlighted, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: ['class']
  })
}

/**
 * Extract snippet around search match
 * @param {string} text - Full text
 * @param {string} searchQuery - Search query
 * @param {number} contextLength - Characters of context on each side
 * @returns {string} Text snippet with context
 */
export const getSearchSnippet = (text, searchQuery, contextLength = 60) => {
  if (!text || !searchQuery) {
    return truncateText(text, contextLength * 2)
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = searchQuery.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) {
    return truncateText(text, contextLength * 2)
  }

  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + searchQuery.length + contextLength)

  let snippet = text.substring(start, end)

  if (start > 0) {
    snippet = `...${snippet}`
  }
  if (end < text.length) {
    snippet = `${snippet}...`
  }

  return snippet
}

/**
 * Get color for topic with fallback
 * @param {string|null} color - Hex color
 * @returns {string} Valid hex color
 */
export const getTopicColor = (color) => color || '#6b7280' // Default gray color

/**
 * Validate topic name
 * @param {string} name - Topic name
 * @param {Array} existingTopics - Array of existing topics
 * @param {string|null} currentTopicId - ID of current topic (for edit mode)
 * @returns {Object} Validation result { valid: boolean, error: string }
 */
export const validateTopicName = (name, existingTopics, currentTopicId = null) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Topic name is required' }
  }

  if (name.length > 100) {
    return { valid: false, error: 'Topic name must be less than 100 characters' }
  }

  // Check for duplicate (case-insensitive)
  const duplicate = existingTopics.find(
    (t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== currentTopicId
  )

  if (duplicate) {
    return { valid: false, error: 'A topic with this name already exists' }
  }

  return { valid: true, error: null }
}

/**
 * Validate note data
 * @param {Object} noteData - Note data { title, content, topic_id }
 * @returns {Object} Validation result { valid: boolean, errors: Object }
 */
export const validateNote = (noteData) => {
  const errors = {}

  if (!noteData.title || noteData.title.trim().length === 0) {
    errors.title = 'Note title is required'
  } else if (noteData.title.length > 200) {
    errors.title = 'Title must be less than 200 characters'
  }

  if (!noteData.content || stripHTMLTags(noteData.content).trim().length === 0) {
    errors.content = 'Note content is required'
  }

  // topic_id is optional - notes can exist without a topic

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Get word count from HTML content
 * @param {string} html - HTML content
 * @returns {number} Word count
 */
export const getWordCount = (html) => {
  const text = stripHTMLTags(html)
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
  return words.length
}

/**
 * Calculate reading time (average 200 words per minute)
 * @param {string} html - HTML content
 * @returns {number} Reading time in minutes
 */
export const getReadingTime = (html) => {
  const wordCount = getWordCount(html)
  return Math.ceil(wordCount / 200)
}

/**
 * Sort notes by different criteria
 * @param {Array} notes - Array of notes
 * @param {string} sortBy - Sort criteria (updated_at, created_at, title)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted notes
 */
export const sortNotes = (notes, sortBy = 'updated_at', order = 'desc') => {
  const sorted = [...notes]

  sorted.sort((a, b) => {
    // Pinned notes always come first
    if (a.is_pinned && !b.is_pinned) {
      return -1
    }
    if (!a.is_pinned && b.is_pinned) {
      return 1
    }

    let compareValue = 0

    switch (sortBy) {
      case 'title':
        compareValue = a.title.localeCompare(b.title)
        break

      case 'created_at':
        compareValue = new Date(a.created_at) - new Date(b.created_at)
        break

      case 'updated_at':
      default:
        compareValue = new Date(a.updated_at) - new Date(b.updated_at)
        break
    }

    return order === 'asc' ? compareValue : -compareValue
  })

  return sorted
}

/**
 * Group notes by topic
 * @param {Array} notes - Array of notes
 * @returns {Object} Notes grouped by topic { topicId: [notes] }
 */
export const groupNotesByTopic = (notes) =>
  notes.reduce((groups, note) => {
    const topicId = note.topic_id
    if (!groups[topicId]) {
      groups[topicId] = []
    }
    groups[topicId].push(note)
    return groups
  }, {})

/**
 * Export notes to plain text format
 * @param {Array} notes - Array of notes
 * @returns {string} Plain text export
 */
export const exportNotesToText = (notes) =>
  notes
    .map((note) => {
      const title = `# ${note.title}\n`
      const meta = `Topic: ${note.topic?.name || 'Unknown'}\nDate: ${format(parseISO(note.created_at), 'PPP')}\n\n`
      const content = stripHTMLTags(note.content)
      return `${title}${meta}${content}\n\n${'='.repeat(80)}\n\n`
    })
    .join('')

/**
 * Get preset colors for topics
 * @returns {Array} Array of hex colors
 */
export const getPresetColors = () => [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1' // Indigo
]
