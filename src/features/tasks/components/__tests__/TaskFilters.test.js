import { mount } from '@vue/test-utils'
import TaskFilters from '../TaskFilters.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/features/tasks/store'

describe('TaskFilters.vue', () => {
  const getWrapper = (props) =>
    mount(TaskFilters, {
      props,
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        stubs: {
          Button: {
            props: ['label', 'icon', 'loading'],
            template: '<button :disabled="loading">{{ label }}</button>'
          },
          Select: {
            props: ['modelValue', 'options'],
            template: `
              <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
                <option v-for="option in options" :key="option.id || option" :value="option.id || option.value">
                  {{ option.name || option.label || option }}
                </option>
              </select>
            `
          },
          Checkbox: {
            props: ['modelValue', 'binary'],
            template:
              '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
          }
        }
      }
    })

  it('renders correctly with filter chips', () => {
    const wrapper = getWrapper()
    expect(wrapper.text()).toContain('All Tasks')
    expect(wrapper.text()).toContain('Today')
    expect(wrapper.text()).toContain('High Priority')
    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).toContain('Completed')
  })

  it('renders search input with placeholder', () => {
    const wrapper = getWrapper()
    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toContain('Search tasks')
  })

  it('emits "update:modelValue" when search input changes', async () => {
    const wrapper = getWrapper()
    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('test search')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0].search).toBe('test search')
  })

  it('emits "update:modelValue" when "All Tasks" filter chip is clicked', async () => {
    const wrapper = getWrapper()
    const allTasksChip = wrapper
      .findAll('.filter-chip')
      .find((chip) => chip.text().includes('All Tasks'))
    await allTasksChip.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')[0][0]
    expect(emittedValue.status).toBe(null)
    expect(emittedValue.priority).toBe(null)
    expect(emittedValue.showCompleted).toBe(true)
  })

  it('emits "update:modelValue" when "High Priority" filter chip is clicked', async () => {
    const wrapper = getWrapper()
    const highPriorityChip = wrapper
      .findAll('.filter-chip')
      .find((chip) => chip.text().includes('High Priority'))
    await highPriorityChip.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')[0][0]
    expect(emittedValue.priority).toBe('high')
  })

  it('displays task counts on filter chips', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    // Add some tasks to the store
    store.tasks = [
      { id: 1, priority: 'high', status: { name: 'To Do' } },
      { id: 2, priority: 'high', status: { name: 'In Progress' } },
      { id: 3, priority: 'low', status: { name: 'To Do' } }
    ]
    await wrapper.vm.$nextTick()

    // All Tasks chip should show count of 3
    const allTasksChip = wrapper
      .findAll('.filter-chip')
      .find((chip) => chip.text().includes('All Tasks'))
    expect(allTasksChip.text()).toContain('3')

    // High Priority chip should show count of 2
    const highPriorityChip = wrapper
      .findAll('.filter-chip')
      .find((chip) => chip.text().includes('High Priority'))
    expect(highPriorityChip.text()).toContain('2')
  })
})
