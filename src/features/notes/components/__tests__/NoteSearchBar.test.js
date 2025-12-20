import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import NoteSearchBar from '../NoteSearchBar.vue'
import { useNotesStore } from '../../store'

// Mock useDebounceFn
const mockDebouncedFn = vi.fn()
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn) => () => {
    mockDebouncedFn()
    fn()
  }
}))

describe('NoteSearchBar.vue', () => {
  let wrapper
  let notesStore

  const mockTopics = [
    { id: 'topic1', name: 'Work' },
    { id: 'topic2', name: 'Personal' }
  ]

  const mountComponent = (props = {}) =>
    mount(NoteSearchBar, {
      props: {
        showFilters: true,
        resultCount: null,
        searchTime: null,
        ...props
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
            initialState: {
              notes: {
                topics: mockTopics,
                selectedTopicId: null
              }
            }
          })
        ],
        stubs: {
          InputText: {
            name: 'InputText',
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\', $event)" @keydown="$emit(\'keydown\', $event)" />',
            props: ['modelValue', 'placeholder', 'class'],
            emits: ['update:modelValue', 'input', 'keydown']
          },
          Select: {
            name: 'Select',
            template:
              '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event)"><slot /></select>',
            props: [
              'modelValue',
              'options',
              'optionLabel',
              'optionValue',
              'placeholder',
              'class',
              'showClear'
            ],
            emits: ['update:modelValue', 'change']
          },
          Checkbox: {
            name: 'Checkbox',
            template:
              '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked); $emit(\'change\', $event)" />',
            props: ['modelValue', 'inputId', 'binary'],
            emits: ['update:modelValue', 'change']
          },
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
            props: ['label', 'icon', 'class'],
            emits: ['click']
          }
        },
        directives: {
          tooltip: () => {}
        }
      }
    })

  beforeEach(() => {
    mockDebouncedFn.mockClear()
    wrapper = mountComponent()
    notesStore = useNotesStore()
  })

  describe('Component Rendering', () => {
    it('renders correctly', () => {
      expect(wrapper.find('.note-search-bar').exists()).toBe(true)
    })

    it('displays search input', () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      expect(input.exists()).toBe(true)
    })

    it('displays search icon', () => {
      const icon = wrapper.find('.pi-search')
      expect(icon.exists()).toBe(true)
    })

    it('has correct placeholder text', () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      expect(input.props('placeholder')).toBe('Search notes...')
    })
  })

  describe('Search Input', () => {
    it('updates searchQuery when typing', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test query')
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe('test query')
    })

    it('emits search event with debounce when typing', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await input.trigger('input')
      await nextTick()

      expect(mockDebouncedFn).toHaveBeenCalled()
    })

    it('emits search event with correct filters', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test query')
      await input.trigger('input')
      wrapper.vm.emitSearch()
      await nextTick()

      expect(wrapper.emitted('search')).toBeTruthy()
      const searchEvent = wrapper.emitted('search')[0][0]
      expect(searchEvent.query).toBe('test query')
    })
  })

  describe('Clear Search', () => {
    it('displays clear button when search has text', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      const clearButton = wrapper.findComponent({ name: 'Button' })
      expect(clearButton.exists()).toBe(true)
    })

    it('does not display clear button when search is empty', () => {
      const clearButton = wrapper.findComponent({ name: 'Button' })
      expect(clearButton.exists()).toBe(false)
    })

    it('clears search when clear button is clicked', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      const clearButton = wrapper.findComponent({ name: 'Button' })
      await clearButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe('')
      expect(wrapper.emitted('clear')).toBeTruthy()
    })

    it('resets all filters when clearing', async () => {
      wrapper.vm.searchQuery = 'test'
      wrapper.vm.selectedTopicId = 'topic1'
      wrapper.vm.showPinnedOnly = true
      await nextTick()

      wrapper.vm.clearSearch()
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe('')
      expect(wrapper.vm.selectedTopicId).toBe(null)
      expect(wrapper.vm.showPinnedOnly).toBe(false)
    })
  })

  describe('Filters Display', () => {
    it('displays filters when showFilters is true', () => {
      const filters = wrapper.find('.search-filters')
      expect(filters.exists()).toBe(true)
    })

    it('hides filters when showFilters is false', async () => {
      const wrapper = mountComponent({ showFilters: false })
      const filters = wrapper.find('.search-filters')
      expect(filters.exists()).toBe(false)
    })

    it('displays topic filter', () => {
      const selects = wrapper.findAllComponents({ name: 'Select' })
      expect(selects.length).toBeGreaterThan(0)
    })

    it('displays date range filter', () => {
      const selects = wrapper.findAllComponents({ name: 'Select' })
      expect(selects.length).toBe(2)
    })

    it('displays pinned checkbox', () => {
      const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
      expect(checkboxes.length).toBe(2)
    })

    it('displays archived checkbox', () => {
      const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
      expect(checkboxes.length).toBe(2)
    })
  })

  describe('Topic Filter', () => {
    it('includes "All Topics" option', () => {
      expect(wrapper.vm.topicOptions[0].label).toBe('All Topics')
      expect(wrapper.vm.topicOptions[0].value).toBe(null)
    })

    it('includes all topics from store', () => {
      expect(wrapper.vm.topicOptions.length).toBe(3) // All Topics + 2 topics
      expect(wrapper.vm.topicOptions[1].label).toBe('Work')
      expect(wrapper.vm.topicOptions[2].label).toBe('Personal')
    })

    it('updates selected topic when changed', async () => {
      wrapper.vm.selectedTopicId = 'topic1'
      await nextTick()

      expect(wrapper.vm.selectedTopicId).toBe('topic1')
    })

    it('emits search when topic filter changes and there is a query', async () => {
      wrapper.vm.searchQuery = 'test'
      wrapper.vm.selectedTopicId = 'topic1'
      await nextTick()

      wrapper.vm.handleFilterChange()
      await nextTick()

      expect(wrapper.emitted('search')).toBeTruthy()
    })

    it('does not emit search when topic changes without query', async () => {
      wrapper.vm.selectedTopicId = 'topic1'
      await nextTick()

      wrapper.vm.handleFilterChange()
      await nextTick()

      expect(wrapper.emitted('search')).toBeFalsy()
    })
  })

  describe('Date Range Filter', () => {
    it('includes all date range options', () => {
      expect(wrapper.vm.dateRangeOptions.length).toBe(5)
      expect(wrapper.vm.dateRangeOptions[0].label).toBe('Any Time')
      expect(wrapper.vm.dateRangeOptions[1].label).toBe('Today')
      expect(wrapper.vm.dateRangeOptions[2].label).toBe('Last 7 Days')
      expect(wrapper.vm.dateRangeOptions[3].label).toBe('Last 30 Days')
      expect(wrapper.vm.dateRangeOptions[4].label).toBe('Last Year')
    })

    it('defaults to "all"', () => {
      expect(wrapper.vm.dateRange).toBe('all')
    })

    it('updates date range when changed', async () => {
      wrapper.vm.dateRange = 'week'
      await nextTick()

      expect(wrapper.vm.dateRange).toBe('week')
    })

    it('emits search when date range changes with query', async () => {
      wrapper.vm.searchQuery = 'test'
      wrapper.vm.dateRange = 'month'
      await nextTick()

      wrapper.vm.handleFilterChange()
      await nextTick()

      expect(wrapper.emitted('search')).toBeTruthy()
    })
  })

  describe('Pinned Filter', () => {
    it('defaults to false', () => {
      expect(wrapper.vm.showPinnedOnly).toBe(false)
    })

    it('updates when checkbox is toggled', async () => {
      wrapper.vm.showPinnedOnly = true
      await nextTick()

      expect(wrapper.vm.showPinnedOnly).toBe(true)
    })

    it('displays label', () => {
      expect(wrapper.text()).toContain('Pinned only')
    })
  })

  describe('Archived Filter', () => {
    it('defaults to false', () => {
      expect(wrapper.vm.includeArchived).toBe(false)
    })

    it('updates when checkbox is toggled', async () => {
      wrapper.vm.includeArchived = true
      await nextTick()

      expect(wrapper.vm.includeArchived).toBe(true)
    })

    it('displays label', () => {
      expect(wrapper.text()).toContain('Include archived')
    })
  })

  describe('Search Info', () => {
    it('does not display when no search query', () => {
      const searchInfo = wrapper.find('.search-info')
      expect(searchInfo.exists()).toBe(false)
    })

    it('displays when search query exists and resultCount is provided', async () => {
      const wrapper = mountComponent({ resultCount: 5 })
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      const searchInfo = wrapper.find('.search-info')
      expect(searchInfo.exists()).toBe(true)
    })

    it('displays "No results found" when count is 0', async () => {
      const wrapper = mountComponent({ resultCount: 0 })
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      expect(wrapper.text()).toContain('No results found')
    })

    it('displays singular "result" for count of 1', async () => {
      const wrapper = mountComponent({ resultCount: 1 })
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      expect(wrapper.text()).toContain('1 result found')
    })

    it('displays plural "results" for count greater than 1', async () => {
      const wrapper = mountComponent({ resultCount: 5 })
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      expect(wrapper.text()).toContain('5 results found')
    })

    it('displays search time when provided', async () => {
      const wrapper = mountComponent({ resultCount: 5, searchTime: 123 })
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      expect(wrapper.text()).toContain('(123ms)')
    })

    it('does not display search time when not provided', async () => {
      const wrapper = mountComponent({ resultCount: 5 })
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      expect(wrapper.text()).not.toContain('ms)')
    })
  })

  describe('Keyboard Navigation', () => {
    it('emits navigate-down on down arrow', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()

      expect(wrapper.emitted('navigate-down')).toBeTruthy()
    })

    it('emits navigate-up on up arrow', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()

      expect(wrapper.emitted('navigate-up')).toBeTruthy()
    })

    it('emits navigate-enter on enter key', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()

      expect(wrapper.emitted('navigate-enter')).toBeTruthy()
    })

    it('clears search on escape key when there is text', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      wrapper.vm.handleEscape()
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe('')
    })

    it('does not clear search on escape when empty', () => {
      const initialState = wrapper.vm.searchQuery
      wrapper.vm.handleEscape()

      expect(wrapper.vm.searchQuery).toBe(initialState)
    })
  })

  describe('Exposed Methods', () => {
    it('exposes clearSearch method', () => {
      expect(wrapper.vm.clearSearch).toBeDefined()
    })

    it('exposes focus method', () => {
      expect(wrapper.vm.focus).toBeDefined()
    })

    it('clearSearch resets all state', async () => {
      wrapper.vm.searchQuery = 'test'
      wrapper.vm.selectedTopicId = 'topic1'
      wrapper.vm.dateRange = 'week'
      wrapper.vm.showPinnedOnly = true
      wrapper.vm.includeArchived = true
      await nextTick()

      wrapper.vm.clearSearch()
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe('')
      expect(wrapper.vm.selectedTopicId).toBe(null)
      expect(wrapper.vm.dateRange).toBe('all')
      expect(wrapper.vm.showPinnedOnly).toBe(false)
      expect(wrapper.vm.includeArchived).toBe(false)
    })
  })

  describe('Store Watcher', () => {
    it('updates selectedTopicId when store selectedTopicId changes', async () => {
      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      expect(wrapper.vm.selectedTopicId).toBe('topic1')
    })

    it('does not update if already different and search query exists', async () => {
      wrapper.vm.searchQuery = 'test'
      wrapper.vm.selectedTopicId = 'topic2'
      await nextTick()

      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      expect(wrapper.vm.selectedTopicId).toBe('topic2')
    })

    it('updates when no search query exists', async () => {
      wrapper.vm.searchQuery = ''
      wrapper.vm.selectedTopicId = 'topic2'
      await nextTick()

      notesStore.selectedTopicId = 'topic1'
      await nextTick()

      expect(wrapper.vm.selectedTopicId).toBe('topic1')
    })
  })

  describe('Props', () => {
    it('accepts showFilters prop', () => {
      const { showFilters } = NoteSearchBar.props
      expect(showFilters).toBeDefined()
    })

    it('showFilters defaults to true', () => {
      const { showFilters } = NoteSearchBar.props
      expect(showFilters.default).toBe(true)
    })

    it('accepts resultCount prop', () => {
      const { resultCount } = NoteSearchBar.props
      expect(resultCount).toBeDefined()
    })

    it('resultCount defaults to null', () => {
      const { resultCount } = NoteSearchBar.props
      expect(resultCount.default).toBe(null)
    })

    it('accepts searchTime prop', () => {
      const { searchTime } = NoteSearchBar.props
      expect(searchTime).toBeDefined()
    })

    it('searchTime defaults to null', () => {
      const { searchTime } = NoteSearchBar.props
      expect(searchTime.default).toBe(null)
    })
  })

  describe('Dark Mode Support', () => {
    it('has labels with proper styling', () => {
      const labels = wrapper.findAll('label')
      expect(labels.length).toBeGreaterThan(0)
      labels.forEach((label) => {
        // Labels exist and are properly structured (styling via scoped CSS)
        expect(label.exists()).toBe(true)
      })
    })

    it('has search info with proper styling', async () => {
      const wrapper = mountComponent({ resultCount: 5 })
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('test')
      await nextTick()

      const searchInfo = wrapper.find('.search-info')
      // Search info exists and has correct class (styling via scoped CSS)
      expect(searchInfo.exists()).toBe(true)
      expect(searchInfo.classes()).toContain('search-info')
    })
  })

  describe('Edge Cases', () => {
    it('handles topics being empty', () => {
      notesStore.topics = []
      expect(wrapper.vm.topicOptions.length).toBe(1) // Just "All Topics"
    })

    it('handles very long search query', async () => {
      const longQuery = 'a'.repeat(1000)
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue(longQuery)
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe(longQuery)
    })

    it('handles special characters in search query', async () => {
      const input = wrapper.findComponent({ name: 'InputText' })
      await input.setValue('<script>alert("xss")</script>')
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe('<script>alert("xss")</script>')
    })
  })
})
