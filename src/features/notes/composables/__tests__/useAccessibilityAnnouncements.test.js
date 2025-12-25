import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  useAccessibilityAnnouncements,
  generateA11yId,
  getPriorityAriaLabel
} from '../useAccessibilityAnnouncements'

describe('useAccessibilityAnnouncements', () => {
  let composable

  beforeEach(() => {
    vi.useFakeTimers()
    mount({
      setup() {
        composable = useAccessibilityAnnouncements()
        return composable
      },
      template: '<div></div>'
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('announce', () => {
    it('should set announcement with polite priority by default', () => {
      expect(composable.announcement.value).toBe('')
      composable.announce('Test announcement')

      // Initially cleared
      expect(composable.announcement.value).toBe('')
      expect(composable.announcementPriority.value).toBe('polite')

      // After 100ms timeout
      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Test announcement')
    })

    it('should set announcement with assertive priority', () => {
      composable.announce('Urgent message', 'assertive')

      expect(composable.announcementPriority.value).toBe('assertive')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Urgent message')
    })

    it('should clear announcement after 5 seconds', () => {
      composable.announce('Temporary message')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Temporary message')

      vi.advanceTimersByTime(5000)
      expect(composable.announcement.value).toBe('')
    })

    it('should clear previous announcement before setting new one', () => {
      composable.announce('First message')
      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('First message')

      composable.announce('Second message')
      expect(composable.announcement.value).toBe('')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Second message')
    })

    it('should re-announce same message by clearing first', () => {
      composable.announce('Same message')
      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Same message')

      // Clear it
      composable.announcement.value = ''

      // Announce same message again
      composable.announce('Same message')
      expect(composable.announcement.value).toBe('')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Same message')
    })
  })

  describe('announceLoading', () => {
    it('should announce loading state with polite priority', () => {
      composable.announceLoading('notes')

      expect(composable.announcementPriority.value).toBe('polite')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Loading notes...')
    })

    it('should announce loading for different contexts', () => {
      composable.announceLoading('topics')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Loading topics...')
    })
  })

  describe('announceComplete', () => {
    it('should announce completion with polite priority', () => {
      composable.announceComplete('Notes')

      expect(composable.announcementPriority.value).toBe('polite')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Notes loaded')
    })

    it('should announce completion for different contexts', () => {
      composable.announceComplete('Topics')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Topics loaded')
    })
  })

  describe('announceError', () => {
    it('should announce error with assertive priority', () => {
      composable.announceError('Failed to save note')

      expect(composable.announcementPriority.value).toBe('assertive')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Error: Failed to save note')
    })

    it('should prefix error message', () => {
      composable.announceError('Network connection lost')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Error: Network connection lost')
    })
  })

  describe('announceSuccess', () => {
    it('should announce success with polite priority', () => {
      composable.announceSuccess('Note saved successfully')

      expect(composable.announcementPriority.value).toBe('polite')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Note saved successfully')
    })
  })

  describe('announceNavigation', () => {
    it('should announce navigation with polite priority', () => {
      composable.announceNavigation('Dashboard')

      expect(composable.announcementPriority.value).toBe('polite')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Navigated to Dashboard')
    })

    it('should announce navigation to different destinations', () => {
      composable.announceNavigation('Settings')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('Navigated to Settings')
    })
  })

  describe('announceSearchResults', () => {
    it('should announce no results found', () => {
      composable.announceSearchResults(0, 'test query')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('No results found for "test query"')
    })

    it('should announce single result', () => {
      composable.announceSearchResults(1, 'important')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('1 result found for "important"')
    })

    it('should announce multiple results', () => {
      composable.announceSearchResults(5, 'meeting')

      vi.advanceTimersByTime(100)
      expect(composable.announcement.value).toBe('5 results found for "meeting"')
    })

    it('should use polite priority for search results', () => {
      composable.announceSearchResults(3, 'test')

      expect(composable.announcementPriority.value).toBe('polite')
    })
  })

  describe('reactive properties', () => {
    it('should expose announcement as a ref', () => {
      expect(composable.announcement.value).toBeDefined()
      expect(typeof composable.announcement.value).toBe('string')
    })

    it('should expose announcementPriority as a ref', () => {
      expect(composable.announcementPriority.value).toBeDefined()
      expect(typeof composable.announcementPriority.value).toBe('string')
    })
  })
})

describe('generateA11yId', () => {
  it('should generate unique ID with default prefix', () => {
    const id1 = generateA11yId()
    const id2 = generateA11yId()

    expect(id1).toContain('a11y-')
    expect(id2).toContain('a11y-')
    expect(id1).not.toBe(id2)
  })

  it('should generate unique ID with custom prefix', () => {
    const id1 = generateA11yId('button')
    const id2 = generateA11yId('button')

    expect(id1).toContain('button-')
    expect(id2).toContain('button-')
    expect(id1).not.toBe(id2)
  })

  it('should generate ID with correct format', () => {
    const id = generateA11yId('test')

    expect(id).toMatch(/^test-[a-z0-9]+$/)
  })

  it('should generate different IDs each time', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateA11yId())
    }

    expect(ids.size).toBe(100)
  })
})

describe('getPriorityAriaLabel', () => {
  it('should return label for urgent priority', () => {
    expect(getPriorityAriaLabel('urgent')).toBe('Urgent priority')
  })

  it('should return label for high priority', () => {
    expect(getPriorityAriaLabel('high')).toBe('High priority')
  })

  it('should return label for medium priority', () => {
    expect(getPriorityAriaLabel('medium')).toBe('Medium priority')
  })

  it('should return label for low priority', () => {
    expect(getPriorityAriaLabel('low')).toBe('Low priority')
  })

  it('should return original value for unknown priority', () => {
    expect(getPriorityAriaLabel('custom')).toBe('custom')
  })

  it('should handle null or undefined gracefully', () => {
    expect(getPriorityAriaLabel(null)).toBe(null)
    expect(getPriorityAriaLabel(undefined)).toBe(undefined)
  })

  it('should handle empty string', () => {
    expect(getPriorityAriaLabel('')).toBe('')
  })
})
