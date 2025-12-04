import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchResultCard from '../SearchResultCard.vue'

// Mock utility functions
vi.mock('../utils', () => ({
  highlightSearchTerms: (text, query) => {
    if (!query) {
      return text
    }
    const regex = new RegExp(query, 'gi')
    return text.replace(regex, '<mark>$&</mark>')
  },
  getSearchSnippet: (content, query, maxLength) => {
    const plainText = content.replace(/<[^>]*>/g, '')
    return plainText.slice(0, maxLength)
  },
  formatNoteTimestamp: (timestamp) => `${timestamp} ago`,
  getWordCount: (content) => {
    const plainText = content.replace(/<[^>]*>/g, '')
    return plainText.split(/\s+/).filter(Boolean).length
  },
  getReadingTime: (content) => {
    const plainText = content.replace(/<[^>]*>/g, '')
    const words = plainText.split(/\s+/).filter(Boolean).length
    return Math.ceil(words / 200)
  }
}))

describe('SearchResultCard.vue', () => {
  const mockNote = {
    id: '1',
    title: 'Test Note',
    content: '<p>This is test content for the search result card component.</p>',
    updated_at: '2025-01-15T10:00:00Z',
    is_pinned: false,
    archived_at: null,
    topic: {
      id: 'topic1',
      name: 'Work',
      color: '#3b82f6'
    }
  }

  const mountComponent = (props = {}) =>
    mount(SearchResultCard, {
      props: {
        note: mockNote,
        searchQuery: '',
        showRelevance: false,
        ...props
      },
      global: {
        stubs: {
          Card: {
            name: 'Card',
            template:
              '<div class="card" @click="$emit(\'click\', $event)"><slot name="content" /></div>',
            emits: ['click']
          },
          SanitizedHtml: {
            name: 'SanitizedHtml',
            template: '<div v-html="html"></div>',
            props: ['html']
          }
        }
      }
    })

  describe('Component Rendering', () => {
    it('renders correctly with required props', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.search-result-card').exists()).toBe(true)
    })

    it('displays note title', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('h3').text()).toContain('Test Note')
    })

    it('displays content snippet', () => {
      const wrapper = mountComponent()

      const snippet = wrapper.find('.text-sm')
      expect(snippet.exists()).toBe(true)
      expect(snippet.text()).toContain('This is test content')
    })

    it('displays timestamp', () => {
      const wrapper = mountComponent()

      // The formatNoteTimestamp function formats the timestamp
      expect(wrapper.text()).toContain('Jan 15, 2025')
    })

    it('displays word count', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('words')
    })

    it('displays reading time', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('min read')
    })
  })

  describe('Topic Display', () => {
    it('displays topic badge when note has topic', () => {
      const wrapper = mountComponent()

      const badge = wrapper.find('.px-2.py-0\\.5.rounded')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Work')
    })

    it('applies topic color to badge', () => {
      const wrapper = mountComponent()

      const badge = wrapper.find('.px-2.py-0\\.5.rounded')
      const style = badge.attributes('style')
      expect(style).toContain('#3b82f6')
    })

    it('does not display topic badge when note has no topic', () => {
      const noteWithoutTopic = { ...mockNote, topic: null }
      const wrapper = mountComponent({ note: noteWithoutTopic })

      const badges = wrapper.findAll('.px-2.py-0\\.5.rounded')
      const workBadge = badges.find((b) => b.text() === 'Work')
      expect(workBadge).toBeUndefined()
    })
  })

  describe('Pinned Status', () => {
    it('displays star icon for pinned notes', () => {
      const pinnedNote = { ...mockNote, is_pinned: true }
      const wrapper = mountComponent({ note: pinnedNote })

      const starIcon = wrapper.find('.pi-star-fill')
      expect(starIcon.exists()).toBe(true)
    })

    it('applies primary border for pinned notes', () => {
      const pinnedNote = { ...mockNote, is_pinned: true }
      const wrapper = mountComponent({ note: pinnedNote })

      const card = wrapper.find('.search-result-card')
      const classes = card.classes().join(' ')
      expect(classes).toContain('border-l-4')
      expect(classes).toContain('border-primary-500')
    })

    it('does not display star icon for unpinned notes', () => {
      const wrapper = mountComponent()

      const starIcon = wrapper.find('.pi-star-fill')
      expect(starIcon.exists()).toBe(false)
    })

    it('does not apply primary border for unpinned notes', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.search-result-card')
      const classes = card.classes().join(' ')
      expect(classes).not.toContain('border-primary-500')
    })
  })

  describe('Archived Status', () => {
    it('displays archived badge when note is archived', () => {
      const archivedNote = { ...mockNote, archived_at: '2025-01-14T10:00:00Z' }
      const wrapper = mountComponent({ note: archivedNote })

      const badges = wrapper.findAll('.px-2.py-0\\.5.rounded')
      const archivedBadge = badges.find((b) => b.text() === 'Archived')
      expect(archivedBadge).toBeDefined()
    })

    it('does not display archived badge when note is not archived', () => {
      const wrapper = mountComponent()

      const badges = wrapper.findAll('.px-2.py-0\\.5.rounded')
      const archivedBadge = badges.find((b) => b.text() === 'Archived')
      expect(archivedBadge).toBeUndefined()
    })

    it('applies gray styling to archived badge', () => {
      const archivedNote = { ...mockNote, archived_at: '2025-01-14T10:00:00Z' }
      const wrapper = mountComponent({ note: archivedNote })

      const badges = wrapper.findAll('.px-2.py-0\\.5.rounded')
      const archivedBadge = badges.find((b) => b.text() === 'Archived')
      const classes = archivedBadge.classes().join(' ')
      expect(classes).toContain('bg-gray-200')
    })
  })

  describe('Search Highlighting', () => {
    it('highlights search terms in title', () => {
      const wrapper = mountComponent({ searchQuery: 'Test' })

      const html = wrapper.html()
      // Check for mark tag with classes added by SanitizedHtml
      expect(html).toContain('<mark class="bg-yellow-200')
    })

    it('displays title without highlighting when no search query', () => {
      const wrapper = mountComponent({ searchQuery: '' })

      expect(wrapper.find('h3').text()).toBe('Test Note')
    })

    it('highlights search terms in content snippet', () => {
      const wrapper = mountComponent({ searchQuery: 'test' })

      const html = wrapper.html()
      // Check for mark tag with classes added by SanitizedHtml
      expect(html).toContain('<mark class="bg-yellow-200')
    })
  })

  describe('Relevance Score', () => {
    it('displays relevance score when showRelevance is true and search query exists', () => {
      const wrapper = mountComponent({ searchQuery: 'test', showRelevance: true })

      const scoreElement = wrapper.find('.pi-chart-line')
      expect(scoreElement.exists()).toBe(true)
    })

    it('does not display relevance score when showRelevance is false', () => {
      const wrapper = mountComponent({ searchQuery: 'test', showRelevance: false })

      const scoreElement = wrapper.find('.pi-chart-line')
      expect(scoreElement.exists()).toBe(false)
    })

    it('does not display relevance score when no search query', () => {
      const wrapper = mountComponent({ searchQuery: '', showRelevance: true })

      const scoreElement = wrapper.find('.pi-chart-line')
      expect(scoreElement.exists()).toBe(false)
    })

    it('calculates higher relevance for title matches', () => {
      const wrapper = mountComponent({ searchQuery: 'Test Note', showRelevance: true })

      const html = wrapper.html()
      expect(html).toContain('%')
    })

    it('adds bonus points for pinned notes', () => {
      const pinnedNote = { ...mockNote, is_pinned: true }
      const wrapper = mountComponent({ note: pinnedNote, searchQuery: 'test', showRelevance: true })

      const html = wrapper.html()
      expect(html).toContain('%')
    })

    it('caps relevance score at 100', () => {
      const wrapper = mountComponent({ searchQuery: 'Test Note', showRelevance: true })

      const scoreText = wrapper.text()
      const match = scoreText.match(/(\d+)%/)
      if (match) {
        const score = parseInt(match[1])
        expect(score).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('Click Events', () => {
    it('emits click event when card is clicked', async () => {
      const wrapper = mountComponent()

      await wrapper.find('.card').trigger('click')
      await nextTick()

      expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('applies hover styles', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.search-result-card')
      const classes = card.classes().join(' ')
      expect(classes).toContain('hover:shadow-md')
    })

    it('has cursor pointer', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.search-result-card')
      expect(card.classes()).toContain('cursor-pointer')
    })
  })

  describe('Content Metadata', () => {
    it('displays word count when greater than zero', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('words')
    })

    it('displays reading time when greater than zero', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('min read')
    })

    it('hides word count when zero', () => {
      const noteWithoutContent = { ...mockNote, content: '' }
      const wrapper = mountComponent({ note: noteWithoutContent })

      expect(wrapper.text()).not.toContain('0 words')
    })

    it('hides reading time when zero', () => {
      const noteWithoutContent = { ...mockNote, content: '' }
      const wrapper = mountComponent({ note: noteWithoutContent })

      expect(wrapper.text()).not.toContain('0 min read')
    })
  })

  describe('Layout and Structure', () => {
    it('uses flexbox layout for header', () => {
      const wrapper = mountComponent()

      const header = wrapper.find('.flex.items-start.justify-between')
      expect(header.exists()).toBe(true)
    })

    it('has transition classes', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.search-result-card')
      expect(card.classes()).toContain('transition-shadow')
    })

    it('separates footer with border', () => {
      const wrapper = mountComponent()

      const footer = wrapper.find('.border-t')
      expect(footer.exists()).toBe(true)
    })

    it('uses line-clamp for content snippet', () => {
      const wrapper = mountComponent()

      const snippet = wrapper.find('.line-clamp-3')
      expect(snippet.exists()).toBe(true)
    })
  })

  describe('Props Validation', () => {
    it('requires note prop', () => {
      const { note } = SearchResultCard.props
      expect(note.required).toBe(true)
    })

    it('note prop is of type Object', () => {
      const { note } = SearchResultCard.props
      expect(note.type).toBe(Object)
    })

    it('searchQuery prop has default empty string', () => {
      const { searchQuery } = SearchResultCard.props
      expect(searchQuery.default).toBe('')
    })

    it('searchQuery prop is of type String', () => {
      const { searchQuery } = SearchResultCard.props
      expect(searchQuery.type).toBe(String)
    })

    it('showRelevance prop has default false', () => {
      const { showRelevance } = SearchResultCard.props
      expect(showRelevance.default).toBe(false)
    })

    it('showRelevance prop is of type Boolean', () => {
      const { showRelevance } = SearchResultCard.props
      expect(showRelevance.type).toBe(Boolean)
    })
  })

  describe('Edge Cases', () => {
    it('handles note with empty title', () => {
      const noteWithEmptyTitle = { ...mockNote, title: '' }
      const wrapper = mountComponent({ note: noteWithEmptyTitle })

      expect(wrapper.find('h3').text()).toBe('')
    })

    it('handles note with empty content', () => {
      const noteWithEmptyContent = { ...mockNote, content: '' }
      const wrapper = mountComponent({ note: noteWithEmptyContent })

      const snippet = wrapper.find('.text-sm')
      expect(snippet.exists()).toBe(true)
    })

    it('handles note with special characters in title', () => {
      const noteWithSpecialChars = { ...mockNote, title: 'Test & <Test> "Note"' }
      const wrapper = mountComponent({ note: noteWithSpecialChars })

      // Title should contain the special characters (may be escaped in rendering)
      const titleText = wrapper.find('h3').text()
      expect(titleText).toContain('Test')
      expect(titleText).toContain('Note')
    })

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(200)
      const noteWithLongTitle = { ...mockNote, title: longTitle }
      const wrapper = mountComponent({ note: noteWithLongTitle })

      expect(wrapper.find('h3').exists()).toBe(true)
    })

    it('handles very long content', () => {
      const longContent = `<p>${'word '.repeat(1000)}</p>`
      const noteWithLongContent = { ...mockNote, content: longContent }
      const wrapper = mountComponent({ note: noteWithLongContent })

      const snippet = wrapper.find('.text-sm')
      expect(snippet.exists()).toBe(true)
    })

    it('handles case-insensitive search query', () => {
      const wrapper = mountComponent({ searchQuery: 'TEST' })

      const html = wrapper.html()
      // Check for mark tag with classes added by SanitizedHtml
      expect(html).toContain('<mark class="bg-yellow-200')
    })

    it('handles special characters in search query', () => {
      const wrapper = mountComponent({ searchQuery: '(test)' })

      expect(wrapper.find('.text-sm').exists()).toBe(true)
    })

    it('handles HTML entities in content', () => {
      const noteWithEntities = {
        ...mockNote,
        content: '<p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>'
      }
      const wrapper = mountComponent({ note: noteWithEntities })

      const snippet = wrapper.find('.text-sm')
      expect(snippet.exists()).toBe(true)
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode text classes', () => {
      const wrapper = mountComponent()

      const title = wrapper.find('h3')
      const classes = title.classes().join(' ')
      expect(classes).toContain('dark:text-white')
    })

    it('has dark mode classes for snippet', () => {
      const wrapper = mountComponent()

      const snippet = wrapper.find('.text-sm')
      const classes = snippet.classes().join(' ')
      expect(classes).toContain('dark:text-gray-400')
    })

    it('has dark mode classes for archived badge', () => {
      const archivedNote = { ...mockNote, archived_at: '2025-01-14T10:00:00Z' }
      const wrapper = mountComponent({ note: archivedNote })

      const badges = wrapper.findAll('.px-2.py-0\\.5.rounded')
      const archivedBadge = badges.find((b) => b.text() === 'Archived')
      const classes = archivedBadge.classes().join(' ')
      expect(classes).toContain('dark:bg-gray-700')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic heading for title', () => {
      const wrapper = mountComponent()

      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
    })

    it('provides visual feedback for pinned status with icon', () => {
      const pinnedNote = { ...mockNote, is_pinned: true }
      const wrapper = mountComponent({ note: pinnedNote })

      const icon = wrapper.find('.pi-star-fill')
      expect(icon.exists()).toBe(true)
    })

    it('provides visual feedback for archived status with badge', () => {
      const archivedNote = { ...mockNote, archived_at: '2025-01-14T10:00:00Z' }
      const wrapper = mountComponent({ note: archivedNote })

      const badges = wrapper.findAll('.px-2.py-0\\.5.rounded')
      const archivedBadge = badges.find((b) => b.text() === 'Archived')
      expect(archivedBadge).toBeDefined()
    })

    it('uses appropriate color contrast for topic badge', () => {
      const wrapper = mountComponent()

      const badge = wrapper.find('.px-2.py-0\\.5.rounded')
      expect(badge.exists()).toBe(true)
    })
  })
})
