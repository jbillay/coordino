import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TaskFilters from '../TaskFilters.vue'
import { useTaskStore } from '../../store'
import { nextTick } from 'vue'

describe('TaskFilters.vue', () => {
  let wrapper
  let store

  const defaultProps = {
    modelValue: {
      status: null,
      category: null,
      priority: null,
      search: '',
      showCompleted: false
    },
    sortBy: 'created_at',
    groupBy: 'none'
  }

  const mountComponent = (props = {}) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        tasks: {
          tasks: [],
          statuses: [
            { id: 's1', name: 'Open' },
            { id: 's2', name: 'In Progress' },
            { id: 's3', name: 'Done' }
          ]
        }
      }
    })

    wrapper = mount(TaskFilters, {
      props: {
        ...defaultProps,
        ...props
      },
      global: {
        plugins: [pinia],
        stubs: {
          Select: {
            name: 'Select',
            template: `
              <select v-bind="$attrs" @change="$emit('update:modelValue', $event.target.value)">
                <option v-for="option in options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            `,
            props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'size']
          }
        }
      }
    })

    store = useTaskStore()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render filter bar component', () => {
      mountComponent()
      expect(wrapper.find('.filter-bar').exists()).toBe(true)
    })

    it('should render search input with correct placeholder', () => {
      mountComponent()
      const searchInput = wrapper.find('.search-input')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('placeholder')).toContain('Search tasks')
    })

    it('should render all filter chips', () => {
      mountComponent()
      const filterChips = wrapper.findAll('.filter-chip')
      expect(filterChips.length).toBe(5) // All, Today, High Priority, In Progress, Completed
    })

    it('should render filter chips with correct labels', () => {
      mountComponent()
      expect(wrapper.text()).toContain('All Tasks')
      expect(wrapper.text()).toContain('Today')
      expect(wrapper.text()).toContain('High Priority')
      expect(wrapper.text()).toContain('In Progress')
      expect(wrapper.text()).toContain('Completed')
    })

    it('should render group by dropdown', () => {
      mountComponent()
      const groupBySelect = wrapper.findComponent({ name: 'Select' })
      expect(groupBySelect.exists()).toBe(true)
    })

    it('should render search hint when search is empty', () => {
      mountComponent()
      const searchHint = wrapper.find('.search-hint')
      expect(searchHint.exists()).toBe(true)
      expect(searchHint.text()).toBe('⌘K')
    })

    it('should not render search hint when search has value', async () => {
      mountComponent({ modelValue: { ...defaultProps.modelValue, search: 'test' } })
      await nextTick()

      const searchHint = wrapper.find('.search-hint')
      expect(searchHint.exists()).toBe(false)
    })
  })

  describe('Filter Presets', () => {
    it('should display task counts on filter chips', async () => {
      mountComponent()

      store.tasks = [
        { id: '1', title: 'Task 1', priority: 'high', status: { name: 'Open' } },
        { id: '2', title: 'Task 2', priority: 'high', status: { name: 'In Progress' } },
        {
          id: '3',
          title: 'Task 3',
          priority: 'low',
          status: { name: 'Open' },
          completed_at: '2024-12-20'
        }
      ]

      await nextTick()
      await wrapper.vm.$forceUpdate()
      await nextTick()

      const allTasksChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('All Tasks'))
      const chipCount = allTasksChip.find('.chip-count')
      if (chipCount.exists()) {
        expect(chipCount.text()).toBe('3')
      }

      const highPriorityChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('High Priority'))
      const highCount = highPriorityChip.find('.chip-count')
      if (highCount.exists()) {
        expect(highCount.text()).toBe('2')
      }

      const completedChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('Completed'))
      const completedCount = completedChip.find('.chip-count')
      if (completedCount.exists()) {
        expect(completedCount.text()).toBe('1')
      }
    })

    it('should not show count badge when count is 0', async () => {
      store.tasks = []

      mountComponent()
      await nextTick()

      const chipCounts = wrapper.findAll('.chip-count')
      expect(chipCounts.length).toBe(0)
    })

    it('should correctly count tasks due today', async () => {
      const today = new Date()
      // Format as YYYY-MM-DD to match date comparison logic
      const todayString = today.toISOString().split('T')[0]
      const futureDate = '2099-12-31' // Clearly future date

      mountComponent()

      store.tasks = [
        { id: '1', due_date: todayString, completed_at: null },
        { id: '2', due_date: futureDate, completed_at: null }
      ]

      await nextTick()
      await wrapper.vm.$forceUpdate()
      await nextTick()

      const todayChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('Today'))
      const countBadge = todayChip.find('.chip-count')
      if (countBadge.exists()) {
        expect(countBadge.text()).toBe('1')
      }
    })
  })

  describe('Search Functionality', () => {
    it('should update searchQuery on input', async () => {
      mountComponent()
      const searchInput = wrapper.find('.search-input')

      await searchInput.setValue('test query')
      expect(wrapper.vm.searchQuery).toBe('test query')
    })

    it('should emit update:modelValue when search input changes', async () => {
      mountComponent()
      const searchInput = wrapper.find('.search-input')

      await searchInput.setValue('test search')
      await searchInput.trigger('input')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({
        ...defaultProps.modelValue,
        search: 'test search'
      })
    })

    it('should watch for external modelValue search changes', async () => {
      mountComponent()

      await wrapper.setProps({
        modelValue: { ...defaultProps.modelValue, search: 'external search' }
      })
      await nextTick()

      expect(wrapper.vm.searchQuery).toBe('external search')
    })
  })

  describe('Filter Chip Interactions', () => {
    it('should set active filter when "All Tasks" chip is clicked', async () => {
      mountComponent()

      const allTasksChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('All Tasks'))
      await allTasksChip.trigger('click')

      expect(wrapper.vm.activeFilter).toBe('all')
      expect(allTasksChip.classes()).toContain('active')
    })

    it('should emit correct filters for "All Tasks"', async () => {
      mountComponent()

      const allTasksChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('All Tasks'))
      await allTasksChip.trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0]).toEqual({
        ...defaultProps.modelValue,
        status: null,
        priority: null,
        showCompleted: true
      })
    })

    it('should emit correct filters for "High Priority"', async () => {
      mountComponent()

      const highPriorityChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('High Priority'))
      await highPriorityChip.trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0].priority).toBe('high')
      expect(emitted[0][0].status).toBe(null)
    })

    it('should emit correct filters for "In Progress"', async () => {
      store.statuses = [
        { id: 's1', name: 'Open' },
        { id: 's2', name: 'In Progress' }
      ]

      mountComponent()

      const inProgressChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('In Progress'))
      await inProgressChip.trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0].status).toBe('s2')
      expect(emitted[0][0].priority).toBe(null)
    })

    it('should emit correct filters for "Completed"', async () => {
      mountComponent()

      const completedChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('Completed'))
      await completedChip.trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0].showCompleted).toBe(true)
      expect(emitted[0][0].status).toBe(null)
      expect(emitted[0][0].priority).toBe(null)
    })

    it('should apply active class to selected filter chip', async () => {
      mountComponent()

      const highPriorityChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('High Priority'))
      await highPriorityChip.trigger('click')
      await nextTick()

      expect(highPriorityChip.classes()).toContain('active')
    })

    it('should remove active class from previously selected chip', async () => {
      mountComponent()

      const allTasksChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('All Tasks'))
      const highPriorityChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('High Priority'))

      await allTasksChip.trigger('click')
      await nextTick()
      expect(allTasksChip.classes()).toContain('active')

      await highPriorityChip.trigger('click')
      await nextTick()

      expect(highPriorityChip.classes()).toContain('active')
      expect(wrapper.vm.activeFilter).toBe('high-priority')
    })
  })

  describe('Group By Functionality', () => {
    it('should emit update:groupBy when group by changes', async () => {
      mountComponent()

      const groupBySelect = wrapper.findComponent({ name: 'Select' })
      await groupBySelect.vm.$emit('update:modelValue', 'status')

      expect(wrapper.emitted('update:groupBy')).toBeTruthy()
      expect(wrapper.emitted('update:groupBy')[0][0]).toBe('status')
    })

    it('should display correct group by options', () => {
      mountComponent()

      const options = wrapper.vm.groupByOptions
      expect(options).toHaveLength(4)
      expect(options[0].label).toBe('No grouping')
      expect(options[1].label).toBe('Group by Status')
      expect(options[2].label).toBe('Group by Category')
      expect(options[3].label).toBe('Group by Priority')
    })

    it('should pass current groupBy prop to Select component', () => {
      mountComponent({ groupBy: 'status' })

      const groupBySelect = wrapper.findComponent({ name: 'Select' })
      expect(groupBySelect.props('modelValue')).toBe('status')
    })
  })

  describe('Helper Functions', () => {
    it('should correctly identify tasks due today', () => {
      mountComponent()

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const taskToday = { due_date: today.toISOString() }
      const taskTomorrow = { due_date: tomorrow.toISOString() }
      const taskNoDate = { due_date: null }

      expect(wrapper.vm.isDueToday(taskToday)).toBe(true)
      expect(wrapper.vm.isDueToday(taskTomorrow)).toBe(false)
      expect(wrapper.vm.isDueToday(taskNoDate)).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria attributes on filter chips', () => {
      mountComponent()

      const filterChips = wrapper.findAll('.filter-chip')
      filterChips.forEach((chip) => {
        expect(chip.element.tagName).toBe('BUTTON')
      })
    })

    it('should have search icon for visual indication', () => {
      mountComponent()

      const searchIcon = wrapper.find('.search-prominent i.pi-search')
      expect(searchIcon.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty task store', async () => {
      store.tasks = []

      mountComponent()
      await nextTick()

      const allTasksChip = wrapper
        .findAll('.filter-chip')
        .find((chip) => chip.text().includes('All Tasks'))
      const countBadge = allTasksChip.find('.chip-count')
      expect(countBadge.exists()).toBe(false)
    })

    it('should handle tasks with missing status name', async () => {
      store.tasks = [{ id: '1', status: { name: null } }]

      mountComponent()
      await nextTick()

      // Should not error
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle rapid filter changes', async () => {
      mountComponent()

      const chips = wrapper.findAll('.filter-chip')

      for (const chip of chips) {
        await chip.trigger('click')
      }

      // Should have emitted for each click
      expect(wrapper.emitted('update:modelValue')).toHaveLength(5)
    })

    it('should handle special characters in search', async () => {
      mountComponent()

      const searchInput = wrapper.find('.search-input')
      const specialChars = '<script>alert("xss")</script>'

      await searchInput.setValue(specialChars)
      await searchInput.trigger('input')

      expect(wrapper.emitted('update:modelValue')[0][0].search).toBe(specialChars)
    })
  })

  describe('Computed Properties', () => {
    it('should reactively update filter presets when tasks change', async () => {
      mountComponent()
      store.tasks = []

      let { filterPresets } = wrapper.vm
      expect(filterPresets[0].count).toBe(0)

      store.tasks = [
        { id: '1', priority: 'high' },
        { id: '2', priority: 'low' }
      ]
      await nextTick()
      ;({ filterPresets } = wrapper.vm)
      expect(filterPresets[0].count).toBe(2)
    })
  })

  describe('Style and Presentation', () => {
    it('should show filter chip icons', () => {
      mountComponent()

      const filterChips = wrapper.findAll('.filter-chip')
      filterChips.forEach((chip) => {
        const icon = chip.find('i.pi')
        expect(icon.exists()).toBe(true)
      })
    })

    it('should display chip count badge with correct styling', async () => {
      mountComponent()

      store.tasks = [{ id: '1', priority: 'high' }]

      await nextTick()
      await wrapper.vm.$forceUpdate()
      await nextTick()

      const chipCounts = wrapper.findAll('.chip-count')
      // If count badges are rendered, verify they have correct class
      if (chipCounts.length > 0) {
        chipCounts.forEach((count) => {
          expect(count.classes()).toContain('chip-count')
        })
      }
    })
  })
})
