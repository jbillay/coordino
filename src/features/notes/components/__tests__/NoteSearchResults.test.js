import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NoteSearchResults from '../NoteSearchResults.vue'

describe('NoteSearchResults.vue', () => {
  const mockResults = [
    {
      id: '1',
      title: 'Test Note 1',
      content: '<p>Content 1</p>',
      topic: {
        id: 'topic1',
        name: 'Work',
        color: '#3b82f6'
      }
    },
    {
      id: '2',
      title: 'Test Note 2',
      content: '<p>Content 2</p>',
      topic: {
        id: 'topic1',
        name: 'Work',
        color: '#3b82f6'
      }
    },
    {
      id: '3',
      title: 'Test Note 3',
      content: '<p>Content 3</p>',
      topic: {
        id: 'topic2',
        name: 'Personal',
        color: '#10b981'
      }
    },
    {
      id: '4',
      title: 'Test Note 4',
      content: '<p>Content 4</p>',
      topic: null
    }
  ]

  const mountComponent = (props = {}) =>
    mount(NoteSearchResults, {
      props: {
        results: [],
        loading: false,
        searchQuery: '',
        groupByTopic: true,
        ...props
      },
      global: {
        stubs: {
          SearchResultCard: {
            name: 'SearchResultCard',
            template: '<div class="search-result-card" @click="$emit(\'click\')"></div>',
            props: ['note', 'searchQuery'],
            emits: ['click']
          }
        }
      }
    })

  describe('Loading State', () => {
    it('displays loading spinner when loading is true', () => {
      const wrapper = mountComponent({ loading: true })

      expect(wrapper.find('.pi-spinner').exists()).toBe(true)
      expect(wrapper.html()).toContain('pi-spin')
    })

    it('does not display results when loading', () => {
      const wrapper = mountComponent({ loading: true, results: mockResults })

      expect(wrapper.find('.results-list').exists()).toBe(false)
    })

    it('does not display empty state when loading', () => {
      const wrapper = mountComponent({ loading: true, searchQuery: 'test' })

      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })
  })

  describe('Initial State', () => {
    it('displays initial state when no search query', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.initial-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Search your notes')
    })

    it('displays search icon in initial state', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.pi-search').exists()).toBe(true)
    })

    it('displays helpful instructions in initial state', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Enter keywords to find notes')
      expect(wrapper.text()).toContain('by title, content, or topic')
    })
  })

  describe('Empty State', () => {
    it('displays empty state when search has no results', () => {
      const wrapper = mountComponent({ searchQuery: 'nonexistent', results: [] })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No results found')
    })

    it('displays search icon in empty state', () => {
      const wrapper = mountComponent({ searchQuery: 'test', results: [] })

      expect(wrapper.find('.pi-search').exists()).toBe(true)
    })

    it('displays helpful suggestions in empty state', () => {
      const wrapper = mountComponent({ searchQuery: 'test', results: [] })

      expect(wrapper.text()).toContain('Try adjusting your search terms')
      expect(wrapper.text()).toContain('search by title, content, or topic')
    })

    it('does not display empty state without search query', () => {
      const wrapper = mountComponent({ searchQuery: '', results: [] })

      expect(wrapper.find('.empty-state').exists()).toBe(false)
      expect(wrapper.find('.initial-state').exists()).toBe(true)
    })
  })

  describe('Results Display', () => {
    it('displays results list when there are results', () => {
      const wrapper = mountComponent({ results: mockResults })

      expect(wrapper.find('.results-list').exists()).toBe(true)
    })

    it('renders SearchResultCard for each note', () => {
      const wrapper = mountComponent({ results: mockResults })

      const cards = wrapper.findAll('.search-result-card')
      expect(cards.length).toBe(4)
    })

    it('passes search query to SearchResultCard', () => {
      const wrapper = mountComponent({
        results: [mockResults[0]],
        searchQuery: 'test'
      })

      const card = wrapper.findComponent({ name: 'SearchResultCard' })
      expect(card.props('searchQuery')).toBe('test')
    })

    it('passes note data to SearchResultCard', () => {
      const wrapper = mountComponent({ results: [mockResults[0]] })

      const card = wrapper.findComponent({ name: 'SearchResultCard' })
      expect(card.props('note')).toEqual(mockResults[0])
    })
  })

  describe('Grouping by Topic', () => {
    it('groups results by topic when groupByTopic is true', () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      const groups = wrapper.findAll('.result-group')
      expect(groups.length).toBeGreaterThan(0)
    })

    it('displays topic headers for each group', () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      expect(wrapper.text()).toContain('Work')
      expect(wrapper.text()).toContain('Personal')
    })

    it('displays note count for each topic', () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      // Work topic has 2 notes
      expect(wrapper.html()).toContain('(2)')
      // Personal topic has 1 note
      expect(wrapper.html()).toContain('(1)')
    })

    it('displays topic color indicator', () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      const colorIndicators = wrapper.findAll('.topic-header .rounded-full')
      expect(colorIndicators.length).toBeGreaterThan(0)

      const firstIndicator = colorIndicators[0]
      const style = firstIndicator.attributes('style')
      expect(style).toContain('background-color')
    })

    it('does not display topic header for notes without topic', () => {
      const wrapper = mountComponent({
        results: [mockResults[3]], // Note without topic
        groupByTopic: true
      })

      const headers = wrapper.findAll('.topic-header')
      expect(headers.length).toBe(0)
    })

    it('sorts groups with more notes first', async () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      const groups = wrapper.vm.groupedResults
      // Work has 2 notes, Personal has 1 note, no-topic has 1 note
      expect(groups[0].notes.length).toBeGreaterThanOrEqual(groups[1].notes.length)
    })

    it('places no-topic group last', async () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      const groups = wrapper.vm.groupedResults
      const lastGroup = groups[groups.length - 1]
      expect(lastGroup.topicId).toBe(null)
    })
  })

  describe('Flat List Display', () => {
    it('displays flat list when groupByTopic is false', () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: false })

      expect(wrapper.findAll('.result-group').length).toBe(0)
      expect(wrapper.findAll('.search-result-card').length).toBe(4)
    })

    it('does not display topic headers in flat list', () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: false })

      expect(wrapper.findAll('.topic-header').length).toBe(0)
    })

    it('renders all notes in flat list', () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: false })

      const cards = wrapper.findAll('.search-result-card')
      expect(cards.length).toBe(mockResults.length)
    })
  })

  describe('Note Selection', () => {
    it('emits select event when note card is clicked', async () => {
      const wrapper = mountComponent({ results: [mockResults[0]] })

      const card = wrapper.find('.search-result-card')
      await card.trigger('click')
      await nextTick()

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')[0]).toEqual([mockResults[0]])
    })

    it('passes correct note data when clicked', async () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: false })

      const cards = wrapper.findAll('.search-result-card')
      await cards[1].trigger('click')
      await nextTick()

      expect(wrapper.emitted('select')[0]).toEqual([mockResults[1]])
    })

    it('emits select event in grouped view', async () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      const card = wrapper.find('.search-result-card')
      await card.trigger('click')
      await nextTick()

      expect(wrapper.emitted('select')).toBeTruthy()
    })
  })

  describe('Dynamic Updates', () => {
    it('updates display when results prop changes', async () => {
      const wrapper = mountComponent({ results: [] })

      expect(wrapper.findAll('.search-result-card').length).toBe(0)

      await wrapper.setProps({ results: [mockResults[0]] })
      await nextTick()

      expect(wrapper.findAll('.search-result-card').length).toBe(1)
    })

    it('switches between grouped and flat view', async () => {
      const wrapper = mountComponent({ results: mockResults, groupByTopic: true })

      expect(wrapper.findAll('.topic-header').length).toBeGreaterThan(0)

      await wrapper.setProps({ groupByTopic: false })
      await nextTick()

      expect(wrapper.findAll('.topic-header').length).toBe(0)
    })

    it('updates empty state based on searchQuery', async () => {
      const wrapper = mountComponent({ results: [] })

      expect(wrapper.find('.initial-state').exists()).toBe(true)

      await wrapper.setProps({ searchQuery: 'test' })
      await nextTick()

      expect(wrapper.find('.initial-state').exists()).toBe(false)
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty results array', () => {
      const wrapper = mountComponent({ results: [] })

      expect(wrapper.find('.initial-state').exists()).toBe(true)
    })

    it('handles results with missing topic data', () => {
      const notesWithoutTopics = [
        { id: '1', title: 'Note 1', content: '<p>Content</p>', topic: null },
        { id: '2', title: 'Note 2', content: '<p>Content</p>', topic: null }
      ]

      const wrapper = mountComponent({ results: notesWithoutTopics, groupByTopic: true })

      expect(wrapper.findAll('.search-result-card').length).toBe(2)
    })

    it('handles single result', () => {
      const wrapper = mountComponent({ results: [mockResults[0]] })

      expect(wrapper.find('.search-result-card').exists()).toBe(true)
      expect(wrapper.findAll('.search-result-card').length).toBe(1)
    })

    it('handles results from same topic', () => {
      const sameTopicNotes = [mockResults[0], mockResults[1]]
      const wrapper = mountComponent({ results: sameTopicNotes, groupByTopic: true })

      const groups = wrapper.findAll('.result-group')
      expect(groups.length).toBe(1)
      expect(wrapper.text()).toContain('(2)')
    })

    it('handles very long search query', () => {
      const longQuery = 'a'.repeat(1000)
      const wrapper = mountComponent({ searchQuery: longQuery, results: [] })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('handles special characters in search query', () => {
      const specialQuery = '<script>alert("xss")</script>'
      const wrapper = mountComponent({ searchQuery: specialQuery, results: [] })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })
})
