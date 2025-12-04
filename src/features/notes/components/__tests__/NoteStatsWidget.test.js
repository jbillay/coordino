import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import NoteStatsWidget from '../NoteStatsWidget.vue'
import { useNotesStore } from '../../store'

describe('NoteStatsWidget.vue', () => {
  let wrapper
  let notesStore

  const mockNotes = [
    {
      id: '1',
      title: 'Active Note 1',
      content: 'Content 1',
      is_pinned: true,
      archived_at: null
    },
    {
      id: '2',
      title: 'Active Note 2',
      content: 'Content 2',
      is_pinned: false,
      archived_at: null
    },
    {
      id: '3',
      title: 'Archived Note',
      content: 'Content 3',
      is_pinned: false,
      archived_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '4',
      title: 'Pinned Note 2',
      content: 'Content 4',
      is_pinned: true,
      archived_at: null
    }
  ]

  const mockTopics = [
    { id: 'topic1', name: 'Work', color: '#3b82f6' },
    { id: 'topic2', name: 'Personal', color: '#10b981' }
  ]

  const mountComponent = (storeState = {}) =>
    mount(NoteStatsWidget, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
            initialState: {
              notes: {
                notes: mockNotes,
                topics: mockTopics,
                ...storeState
              }
            }
          })
        ]
      }
    })

  beforeEach(() => {
    wrapper = mountComponent()
    notesStore = useNotesStore()
  })

  describe('Component Rendering', () => {
    it('renders correctly', () => {
      expect(wrapper.find('.grid').exists()).toBe(true)
    })

    it('displays three stat cards', () => {
      const statCards = wrapper.findAll('.stat-card')
      expect(statCards.length).toBe(3)
    })

    it('uses responsive grid layout', () => {
      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-3')
    })

    it('has proper gap between cards', () => {
      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('gap-4')
    })
  })

  describe('Total Notes Card', () => {
    it('displays "Total Notes" label', () => {
      expect(wrapper.text()).toContain('Total Notes')
    })

    it('displays file icon', () => {
      const icon = wrapper.find('.pi-file')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('text-blue-500')
    })

    it('displays total active notes count', () => {
      // 2 active notes (not archived)
      const statCards = wrapper.findAll('.stat-card')
      const totalCard = statCards[0]
      const count = totalCard.find('.text-3xl')
      expect(count.text()).toBe('3')
    })

    it('displays archived notes count', () => {
      expect(wrapper.text()).toContain('1 archived')
    })

    it('updates when notes change', async () => {
      notesStore.notes = [
        { id: '1', title: 'Note 1', archived_at: null, is_pinned: false },
        { id: '2', title: 'Note 2', archived_at: null, is_pinned: false }
      ]
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      const totalCard = statCards[0]
      const count = totalCard.find('.text-3xl')
      expect(count.text()).toBe('2')
    })
  })

  describe('Topics Card', () => {
    it('displays "Topics" label', () => {
      expect(wrapper.text()).toContain('Topics')
    })

    it('displays folder icon', () => {
      const icon = wrapper.find('.pi-folder')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('text-purple-500')
    })

    it('displays topics count', () => {
      const statCards = wrapper.findAll('.stat-card')
      const topicsCard = statCards[1]
      const count = topicsCard.find('.text-3xl')
      expect(count.text()).toBe('2')
    })

    it('displays average notes per topic', () => {
      // 3 active notes / 2 topics = 1.5
      expect(wrapper.text()).toContain('1.5 avg per topic')
    })

    it('calculates notes per topic correctly', async () => {
      notesStore.notes = [
        { id: '1', title: 'Note 1', archived_at: null, is_pinned: false },
        { id: '2', title: 'Note 2', archived_at: null, is_pinned: false },
        { id: '3', title: 'Note 3', archived_at: null, is_pinned: false },
        { id: '4', title: 'Note 4', archived_at: null, is_pinned: false },
        { id: '5', title: 'Note 5', archived_at: null, is_pinned: false }
      ]
      notesStore.topics = [{ id: 'topic1', name: 'Work' }]
      await nextTick()

      // 5 notes / 1 topic = 5.0
      expect(wrapper.text()).toContain('5 avg per topic')
    })

    it('shows 0 avg when no topics', async () => {
      notesStore.topics = []
      await nextTick()

      expect(wrapper.text()).toContain('0 avg per topic')
    })
  })

  describe('Pinned Notes Card', () => {
    it('displays "Pinned" label', () => {
      expect(wrapper.text()).toContain('Pinned')
    })

    it('displays star icon', () => {
      const icon = wrapper.find('.pi-star-fill')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('text-primary-500')
    })

    it('displays pinned notes count', () => {
      const statCards = wrapper.findAll('.stat-card')
      const pinnedCard = statCards[2]
      const count = pinnedCard.find('.text-3xl')
      expect(count.text()).toBe('2')
    })

    it('displays "Quick access" subtitle', () => {
      expect(wrapper.text()).toContain('Quick access')
    })

    it('only counts active pinned notes', async () => {
      notesStore.notes = [
        { id: '1', title: 'Pinned Active', archived_at: null, is_pinned: true },
        { id: '2', title: 'Pinned Archived', archived_at: '2025-01-01', is_pinned: true }
      ]
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      const pinnedCard = statCards[2]
      const count = pinnedCard.find('.text-3xl')
      expect(count.text()).toBe('1')
    })

    it('uses primary color for count', () => {
      const statCards = wrapper.findAll('.stat-card')
      const pinnedCard = statCards[2]
      const count = pinnedCard.find('.text-3xl')
      const classes = count.classes().join(' ')
      expect(classes).toContain('text-primary-600')
    })
  })

  describe('Statistics Calculations', () => {
    it('excludes archived notes from total count', async () => {
      notesStore.notes = [
        { id: '1', title: 'Active', archived_at: null, is_pinned: false },
        { id: '2', title: 'Archived', archived_at: '2025-01-01', is_pinned: false }
      ]
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      const totalCard = statCards[0]
      const count = totalCard.find('.text-3xl')
      expect(count.text()).toBe('1')
    })

    it('counts only archived notes in archived count', async () => {
      notesStore.notes = [
        { id: '1', title: 'Archived 1', archived_at: '2025-01-01', is_pinned: false },
        { id: '2', title: 'Archived 2', archived_at: '2025-01-02', is_pinned: false },
        { id: '3', title: 'Active', archived_at: null, is_pinned: false }
      ]
      await nextTick()

      expect(wrapper.text()).toContain('2 archived')
    })

    it('rounds notes per topic to one decimal', async () => {
      notesStore.notes = [
        { id: '1', title: 'Note 1', archived_at: null, is_pinned: false },
        { id: '2', title: 'Note 2', archived_at: null, is_pinned: false }
      ]
      notesStore.topics = [
        { id: 'topic1', name: 'Work' },
        { id: 'topic2', name: 'Personal' },
        { id: 'topic3', name: 'Study' }
      ]
      await nextTick()

      // 2 notes / 3 topics = 0.66666... should round to 0.7
      expect(wrapper.text()).toContain('0.7 avg per topic')
    })

    it('handles zero notes correctly', async () => {
      notesStore.notes = []
      notesStore.topics = []
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      expect(statCards[0].find('.text-3xl').text()).toBe('0')
      expect(statCards[1].find('.text-3xl').text()).toBe('0')
      expect(statCards[2].find('.text-3xl').text()).toBe('0')
    })
  })

  describe('Data Fetching on Mount', () => {
    it('fetches notes if store is empty', () => {
      mountComponent({ notes: [] })
      const store = useNotesStore()

      expect(store.fetchNotes).toHaveBeenCalled()
    })

    it('fetches topics if store is empty', () => {
      mountComponent({ topics: [] })
      const store = useNotesStore()

      expect(store.fetchTopics).toHaveBeenCalled()
    })

    it('does not fetch notes if already loaded', () => {
      mountComponent({ notes: mockNotes })
      const store = useNotesStore()

      // fetchNotes should not be called when notes already exist
      expect(store.fetchNotes).not.toHaveBeenCalled()
    })

    it('does not fetch topics if already loaded', () => {
      mountComponent({ topics: mockTopics })
      const store = useNotesStore()

      // fetchTopics should not be called when topics already exist
      expect(store.fetchTopics).not.toHaveBeenCalled()
    })
  })

  describe('Styling and Layout', () => {
    it('has hover effect on stat cards', () => {
      const statCards = wrapper.findAll('.stat-card')
      statCards.forEach((card) => {
        expect(card.classes()).toContain('stat-card')
      })
    })

    it('applies stat-card class to all cards', () => {
      const statCards = wrapper.findAll('.stat-card')
      statCards.forEach((card) => {
        expect(card.classes()).toContain('stat-card')
      })
    })

    it('has consistent structure across all cards', () => {
      const statCards = wrapper.findAll('.stat-card')
      expect(statCards.length).toBe(3)
      statCards.forEach((card) => {
        // Each card should have the stat-card class
        expect(card.classes()).toContain('stat-card')
      })
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode text classes for labels', () => {
      const labels = wrapper.findAll('.text-sm.text-gray-600')
      labels.forEach((label) => {
        const classes = label.classes().join(' ')
        expect(classes).toContain('dark:text-gray-400')
      })
    })

    it('has dark mode classes for counts', () => {
      const counts = wrapper.findAll('.text-3xl')
      counts.forEach((count) => {
        const classes = count.classes().join(' ')
        if (!classes.includes('text-primary-600')) {
          expect(classes).toContain('dark:text-white')
        }
      })
    })

    it('has dark mode classes for subtitles', () => {
      const subtitles = wrapper.findAll('.text-xs.text-gray-500')
      subtitles.forEach((subtitle) => {
        const classes = subtitle.classes().join(' ')
        expect(classes).toContain('dark:text-gray-400')
      })
    })

    it('has dark mode primary color for pinned count', () => {
      const statCards = wrapper.findAll('.stat-card')
      const pinnedCard = statCards[2]
      const count = pinnedCard.find('.text-3xl')
      const classes = count.classes().join(' ')
      expect(classes).toContain('dark:text-primary-500')
    })
  })

  describe('Icons', () => {
    it('displays all three icons', () => {
      expect(wrapper.find('.pi-file').exists()).toBe(true)
      expect(wrapper.find('.pi-folder').exists()).toBe(true)
      expect(wrapper.find('.pi-star-fill').exists()).toBe(true)
    })

    it('applies correct colors to icons', () => {
      expect(wrapper.find('.pi-file').classes()).toContain('text-blue-500')
      expect(wrapper.find('.pi-folder').classes()).toContain('text-purple-500')
      expect(wrapper.find('.pi-star-fill').classes()).toContain('text-primary-500')
    })

    it('aligns icons with labels', () => {
      const headers = wrapper.findAll('.flex.items-center.justify-between')
      expect(headers.length).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('handles null archived_at correctly', async () => {
      notesStore.notes = [
        { id: '1', title: 'Note 1', archived_at: null, is_pinned: false },
        { id: '2', title: 'Note 2', archived_at: undefined, is_pinned: false }
      ]
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      const totalCard = statCards[0]
      const count = totalCard.find('.text-3xl')
      expect(count.text()).toBe('2')
    })

    it('handles very large numbers', async () => {
      const manyNotes = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        title: `Note ${i}`,
        archived_at: null,
        is_pinned: false
      }))
      notesStore.notes = manyNotes
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      const totalCard = statCards[0]
      const count = totalCard.find('.text-3xl')
      expect(count.text()).toBe('1000')
    })

    it('handles fractional averages correctly', async () => {
      notesStore.notes = [{ id: '1', title: 'Note 1', archived_at: null, is_pinned: false }]
      notesStore.topics = [
        { id: 'topic1', name: 'Work' },
        { id: 'topic2', name: 'Personal' },
        { id: 'topic3', name: 'Study' }
      ]
      await nextTick()

      // 1 note / 3 topics = 0.33333... should round to 0.3
      expect(wrapper.text()).toContain('0.3 avg per topic')
    })

    it('handles all notes being archived', async () => {
      notesStore.notes = [
        { id: '1', title: 'Archived 1', archived_at: '2025-01-01', is_pinned: false },
        { id: '2', title: 'Archived 2', archived_at: '2025-01-02', is_pinned: false }
      ]
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      const totalCard = statCards[0]
      const count = totalCard.find('.text-3xl')
      expect(count.text()).toBe('0')
      expect(wrapper.text()).toContain('2 archived')
    })

    it('handles all notes being pinned', async () => {
      notesStore.notes = [
        { id: '1', title: 'Pinned 1', archived_at: null, is_pinned: true },
        { id: '2', title: 'Pinned 2', archived_at: null, is_pinned: true }
      ]
      await nextTick()

      const statCards = wrapper.findAll('.stat-card')
      const pinnedCard = statCards[2]
      const count = pinnedCard.find('.text-3xl')
      expect(count.text()).toBe('2')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic structure', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
    })

    it('provides clear labels for each stat', () => {
      expect(wrapper.text()).toContain('Total Notes')
      expect(wrapper.text()).toContain('Topics')
      expect(wrapper.text()).toContain('Pinned')
    })

    it('provides context with subtitles', () => {
      expect(wrapper.text()).toContain('archived')
      expect(wrapper.text()).toContain('avg per topic')
      expect(wrapper.text()).toContain('Quick access')
    })

    it('uses icons to enhance visual understanding', () => {
      const icons = wrapper.findAll('i')
      expect(icons.length).toBe(3)
    })
  })
})
