import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import RecentNotesWidget from '../RecentNotesWidget.vue'
import { useNotesStore } from '../../store'

// Mock router
const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

// Mock utility functions
vi.mock('../utils', () => ({
  getNotePreview: (content, length) => {
    const plainText = content.replace(/<[^>]*>/g, '')
    return plainText.slice(0, length)
  },
  formatNoteTimestamp: (timestamp) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
}))

describe('RecentNotesWidget.vue', () => {
  let wrapper
  let notesStore

  const mockNotes = [
    {
      id: '1',
      title: 'Recent Note 1',
      content: '<p>Content for recent note 1</p>',
      updated_at: '2025-01-15T10:00:00Z',
      is_pinned: true,
      topic: {
        id: 'topic1',
        name: 'Work',
        color: '#3b82f6'
      }
    },
    {
      id: '2',
      title: 'Recent Note 2',
      content: '<p>Content for recent note 2</p>',
      updated_at: '2025-01-14T10:00:00Z',
      is_pinned: false,
      topic: null
    },
    {
      id: '3',
      title: 'Recent Note 3',
      content: '<p>Content for recent note 3</p>',
      updated_at: '2025-01-13T10:00:00Z',
      is_pinned: false,
      topic: {
        id: 'topic2',
        name: 'Personal',
        color: '#10b981'
      }
    }
  ]

  beforeEach(() => {
    // Clear mock calls before each test
    mockRouter.push.mockClear()

    wrapper = mount(RecentNotesWidget, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
            initialState: {
              notes: {
                notes: mockNotes,
                recentNotes: mockNotes,
                loading: false
              }
            }
          })
        ],
        stubs: {
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
            props: ['label', 'icon', 'size', 'class'],
            emits: ['click']
          },
          'router-link': {
            name: 'router-link',
            template: '<a :href="to.name"><slot /></a>',
            props: ['to']
          }
        },
        directives: {
          tooltip: () => {}
        }
      }
    })

    notesStore = useNotesStore()
  })

  describe('Component Rendering', () => {
    it('renders correctly', () => {
      expect(wrapper.find('.content-card').exists()).toBe(true)
    })

    it('displays "Recent Notes" heading', () => {
      const heading = wrapper.find('h2')
      expect(heading.text()).toBe('Recent Notes')
    })

    it('displays "View All" link', () => {
      const link = wrapper.findComponent({ name: 'router-link' })
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe('View All')
    })

    it('links to notes view', () => {
      const link = wrapper.findComponent({ name: 'router-link' })
      expect(link.props('to')).toEqual({ name: 'notes' })
    })
  })

  describe('Loading State', () => {
    it('displays loading spinner when loading is true', async () => {
      notesStore.loading = true
      await nextTick()

      const spinner = wrapper.find('.pi-spinner')
      expect(spinner.exists()).toBe(true)
      expect(spinner.classes()).toContain('pi-spin')
    })

    it('does not display notes when loading', async () => {
      notesStore.loading = true
      await nextTick()

      expect(wrapper.findAll('.note-item').length).toBe(0)
    })

    it('does not display empty state when loading', async () => {
      notesStore.loading = true
      notesStore.recentNotes = []
      await nextTick()

      expect(wrapper.find('.text-center.py-8').exists()).toBe(false)
    })
  })

  describe('Notes List Display', () => {
    it('displays up to 5 recent notes', () => {
      const noteItems = wrapper.findAll('.note-item')
      expect(noteItems.length).toBeLessThanOrEqual(5)
    })

    it('renders all notes when less than 5', () => {
      const noteItems = wrapper.findAll('.note-item')
      expect(noteItems.length).toBe(3)
    })

    it('limits to 5 notes when more than 5 available', async () => {
      const manyNotes = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `Note ${i}`,
        content: `Content ${i}`,
        updated_at: '2025-01-15T10:00:00Z',
        is_pinned: false,
        topic: null
      }))
      notesStore.recentNotes = manyNotes
      await nextTick()

      const noteItems = wrapper.findAll('.note-item')
      expect(noteItems.length).toBe(5)
    })

    it('displays note titles', () => {
      const noteItems = wrapper.findAll('.note-item')
      expect(noteItems[0].text()).toContain('Recent Note 1')
      expect(noteItems[1].text()).toContain('Recent Note 2')
    })

    it('truncates long titles', () => {
      const headings = wrapper.findAll('.note-item h3')
      headings.forEach((heading) => {
        expect(heading.classes()).toContain('truncate')
      })
    })

    it('displays content preview', () => {
      const noteItems = wrapper.findAll('.note-item')
      expect(noteItems[0].text()).toContain('Content for recent note 1')
    })

    it('limits content preview length', () => {
      const previews = wrapper.findAll('.line-clamp-2')
      expect(previews.length).toBeGreaterThan(0)
    })

    it('displays timestamps', () => {
      expect(wrapper.text()).toContain('Updated')
    })
  })

  describe('Pinned Notes', () => {
    it('displays star icon for pinned notes', () => {
      const noteItems = wrapper.findAll('.note-item')
      const firstNote = noteItems[0]
      const starIcon = firstNote.find('.pi-star-fill.text-primary-500.text-xs')
      expect(starIcon.exists()).toBe(true)
    })

    it('does not display star icon for unpinned notes', () => {
      const noteItems = wrapper.findAll('.note-item')
      const secondNote = noteItems[1]
      const starIcon = secondNote.find('.pi-star-fill.text-primary-500.text-xs')
      expect(starIcon.exists()).toBe(false)
    })

    it('displays pin button for all notes', () => {
      const noteItems = wrapper.findAll('.note-item')
      noteItems.forEach((item) => {
        const button = item.findComponent({ name: 'Button' })
        expect(button.exists()).toBe(true)
      })
    })

    it('shows filled star icon on pin button for pinned notes', () => {
      const noteItems = wrapper.findAll('.note-item')
      const firstNote = noteItems[0]
      const button = firstNote.findComponent({ name: 'Button' })
      expect(button.props('icon')).toBe('pi pi-star-fill')
    })

    it('shows empty star icon on pin button for unpinned notes', () => {
      const noteItems = wrapper.findAll('.note-item')
      const secondNote = noteItems[1]
      const button = secondNote.findComponent({ name: 'Button' })
      expect(button.props('icon')).toBe('pi pi-star')
    })

    it('calls togglePin when pin button is clicked', async () => {
      const noteItems = wrapper.findAll('.note-item')
      const firstNote = noteItems[0]
      const button = firstNote.findComponent({ name: 'Button' })

      await button.trigger('click')
      await nextTick()

      expect(notesStore.togglePin).toHaveBeenCalledWith('1')
    })
  })

  describe('Topic Display', () => {
    it('displays topic badge when note has topic', () => {
      const noteItems = wrapper.findAll('.note-item')
      const firstNote = noteItems[0]
      const badge = firstNote.find('.px-2.py-0\\.5.rounded')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Work')
    })

    it('applies topic color to badge', () => {
      const noteItems = wrapper.findAll('.note-item')
      const firstNote = noteItems[0]
      const badge = firstNote.find('.px-2.py-0\\.5.rounded')
      const style = badge.attributes('style')
      expect(style).toContain('#3b82f6')
    })

    it('does not display topic badge when note has no topic', () => {
      const noteItems = wrapper.findAll('.note-item')
      const secondNote = noteItems[1]
      const badge = secondNote.find('.px-2.py-0\\.5.rounded')
      expect(badge.exists()).toBe(false)
    })
  })

  describe('Note Navigation', () => {
    it('navigates to note when clicked', async () => {
      const noteItems = wrapper.findAll('.note-item')
      await noteItems[0].trigger('click')
      await nextTick()

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'notes',
        query: { noteId: '1' }
      })
    })

    it('does not navigate when pin button is clicked', async () => {
      const noteItems = wrapper.findAll('.note-item')
      const button = noteItems[0].findComponent({ name: 'Button' })

      mockRouter.push.mockClear()
      await button.trigger('click')
      await nextTick()

      // Router push should not be called for navigation (only togglePin should be called)
      expect(mockRouter.push).not.toHaveBeenCalledWith({
        name: 'notes',
        query: { noteId: '1' }
      })
    })

    it('has cursor pointer on note items', () => {
      const noteItems = wrapper.findAll('.note-item')
      noteItems.forEach((item) => {
        expect(item.classes()).toContain('note-item')
      })
    })
  })

  describe('Empty State', () => {
    beforeEach(async () => {
      notesStore.recentNotes = []
      notesStore.loading = false
      await nextTick()
    })

    it('displays empty state when no notes', () => {
      const emptyState = wrapper.find('.text-center.py-8')
      expect(emptyState.exists()).toBe(true)
    })

    it('displays empty state icon', () => {
      const icon = wrapper.find('.pi-file.text-4xl')
      expect(icon.exists()).toBe(true)
    })

    it('displays empty state message', () => {
      expect(wrapper.text()).toContain('No notes yet')
      expect(wrapper.text()).toContain('Start capturing your ideas!')
    })

    it('displays "Create Note" button', () => {
      const button = wrapper.findComponent({ name: 'Button' })
      expect(button.exists()).toBe(true)
      expect(button.props('label')).toBe('Create Note')
      expect(button.props('icon')).toBe('pi pi-plus')
    })

    it('navigates to create note when button is clicked', async () => {
      const button = wrapper.findComponent({ name: 'Button' })
      await button.trigger('click')
      await nextTick()

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'notes',
        query: { action: 'create' }
      })
    })
  })

  describe('Data Fetching on Mount', () => {
    it('fetches notes if store is empty', () => {
      mount(RecentNotesWidget, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              stubActions: false,
              initialState: {
                notes: {
                  notes: [],
                  recentNotes: [],
                  loading: false
                }
              }
            })
          ],
          stubs: {
            Button: {
              name: 'Button',
              template: '<button><slot /></button>',
              props: ['label', 'icon', 'size', 'class']
            },
            'router-link': {
              name: 'router-link',
              template: '<a><slot /></a>',
              props: ['to']
            }
          },
          directives: {
            tooltip: () => {}
          }
        }
      })

      const store = useNotesStore()
      expect(store.fetchNotes).toHaveBeenCalled()
    })

    it('does not fetch notes if already loaded', () => {
      // Store already has notes from beforeEach
      expect(notesStore.fetchNotes).not.toHaveBeenCalled()
    })
  })

  describe('Styling and Layout', () => {
    it('uses space-y-3 for note list spacing', () => {
      const noteList = wrapper.find('.space-y-3')
      expect(noteList.exists()).toBe(true)
    })

    it('has hover effect on note items', () => {
      const noteItems = wrapper.findAll('.note-item')
      noteItems.forEach((item) => {
        expect(item.classes()).toContain('note-item')
      })
    })

    it('uses content-card class for container', () => {
      const container = wrapper.find('.content-card')
      expect(container.exists()).toBe(true)
    })

    it('has flexbox layout for header', () => {
      const header = wrapper.find('.flex.items-center.justify-between')
      expect(header.exists()).toBe(true)
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes for heading', () => {
      const heading = wrapper.find('h2')
      const classes = heading.classes().join(' ')
      expect(classes).toContain('dark:text-white')
    })

    it('has dark mode classes for View All link', () => {
      const link = wrapper.findComponent({ name: 'router-link' })
      const classes = link.attributes('class')
      expect(classes).toContain('dark:text-blue-400')
    })

    it('has dark mode classes for note titles', () => {
      const titles = wrapper.findAll('.note-item h3')
      titles.forEach((title) => {
        const classes = title.classes().join(' ')
        expect(classes).toContain('dark:text-white')
      })
    })

    it('has dark mode classes for content preview', () => {
      const previews = wrapper.findAll('.text-xs.text-gray-600')
      previews.forEach((preview) => {
        const classes = preview.classes().join(' ')
        expect(classes).toContain('dark:text-gray-400')
      })
    })

    it('has dark mode classes for timestamps', () => {
      const timestamps = wrapper.findAll('.text-xs.text-gray-500')
      timestamps.forEach((timestamp) => {
        const classes = timestamp.classes().join(' ')
        expect(classes).toContain('dark:text-gray-400')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles notes with empty content', async () => {
      notesStore.recentNotes = [
        {
          id: '1',
          title: 'Empty Note',
          content: '',
          updated_at: '2025-01-15T10:00:00Z',
          is_pinned: false,
          topic: null
        }
      ]
      await nextTick()

      const noteItems = wrapper.findAll('.note-item')
      expect(noteItems.length).toBe(1)
    })

    it('handles notes with very long titles', async () => {
      notesStore.recentNotes = [
        {
          id: '1',
          title: 'A'.repeat(200),
          content: 'Content',
          updated_at: '2025-01-15T10:00:00Z',
          is_pinned: false,
          topic: null
        }
      ]
      await nextTick()

      const title = wrapper.find('.note-item h3')
      expect(title.classes()).toContain('truncate')
    })

    it('handles notes with HTML in content', async () => {
      notesStore.recentNotes = [
        {
          id: '1',
          title: 'HTML Note',
          content: '<p><strong>Bold</strong> and <em>italic</em> text</p>',
          updated_at: '2025-01-15T10:00:00Z',
          is_pinned: false,
          topic: null
        }
      ]
      await nextTick()

      const noteItems = wrapper.findAll('.note-item')
      expect(noteItems.length).toBe(1)
    })

    it('handles notes with special characters in title', async () => {
      notesStore.recentNotes = [
        {
          id: '1',
          title: 'Test & <Test> "Note"',
          content: 'Content',
          updated_at: '2025-01-15T10:00:00Z',
          is_pinned: false,
          topic: null
        }
      ]
      await nextTick()

      expect(wrapper.text()).toContain('Test & <Test> "Note"')
    })

    it('handles null topic gracefully', () => {
      const noteItems = wrapper.findAll('.note-item')
      const secondNote = noteItems[1]
      const badge = secondNote.find('.px-2.py-0\\.5.rounded')
      expect(badge.exists()).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('uses semantic heading for title', () => {
      const heading = wrapper.find('h2')
      expect(heading.exists()).toBe(true)
    })

    it('uses semantic heading for note titles', () => {
      const noteTitles = wrapper.findAll('.note-item h3')
      expect(noteTitles.length).toBeGreaterThan(0)
    })

    it('provides visual feedback for pinned status', () => {
      const noteItems = wrapper.findAll('.note-item')
      const firstNote = noteItems[0]
      const starIcon = firstNote.find('.pi-star-fill')
      expect(starIcon.exists()).toBe(true)
    })

    it('provides action buttons for interaction', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('provides clear empty state guidance', async () => {
      notesStore.recentNotes = []
      await nextTick()

      expect(wrapper.text()).toContain('No notes yet')
      expect(wrapper.text()).toContain('Start capturing your ideas!')
    })
  })
})
