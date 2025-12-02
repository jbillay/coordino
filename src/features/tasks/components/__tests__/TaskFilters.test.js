import { mount } from '@vue/test-utils'
import TaskFilters from '../TaskFilters.vue'
import { describe, it, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { useTaskStore } from '@/features/tasks/store'
import Button from 'primevue/button'

describe('TaskFilters.vue', () => {
  const getWrapper = (props) =>
    mount(TaskFilters, {
      props,
      global: {
        components: {
          Button
        },
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        stubs: {
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

  it('renders correctly', () => {
    const wrapper = getWrapper()
    expect(wrapper.text()).toContain('Status')
    expect(wrapper.text()).toContain('Category')
  })

  it('emits "update:modelValue" when a status is selected', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    store.statuses = [{ id: '1', name: 'To Do' }]
    await wrapper.vm.$nextTick()
    await wrapper.find('select[id="filter-status"]').setValue('1')
    expect(wrapper.emitted('update:modelValue')[0][0].status).toBe('1')
  })

  it('emits "update:modelValue" when a category is selected', async () => {
    const wrapper = getWrapper()
    const store = useTaskStore()
    store.categories = [{ id: '1', name: 'Test Category' }]
    await wrapper.vm.$nextTick()
    await wrapper.find('select[id="filter-category"]').setValue('1')
    expect(wrapper.emitted('update:modelValue')[0][0].category).toBe('1')
  })

  it('emits "update:sortBy" when sort option is changed', async () => {
    const wrapper = getWrapper()
    await wrapper.find('select[id="sort-by"]').setValue('due_date')
    expect(wrapper.emitted('update:sortBy')[0]).toEqual(['due_date'])
  })

  it('clears all filters when "Clear Filters" button is clicked', async () => {
    const wrapper = getWrapper()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Clear Filters')
      .trigger('click')
    wrapper.vm.$emit('update:sortBy', 'created_at')
    wrapper.vm.$emit('update:groupBy', 'none')
    expect(wrapper.emitted('update:modelValue')[0][0].search).toBe('')
    expect(wrapper.emitted('update:modelValue')[0][0].status).toBe(null)
    expect(wrapper.emitted('update:modelValue')[0][0].category).toBe(null)
    expect(wrapper.emitted('update:modelValue')[0][0].priority).toBe(null)
    expect(wrapper.emitted('update:modelValue')[0][0].showCompleted).toBe(false)
    expect(wrapper.emitted('update:sortBy')[0]).toEqual(['created_at'])
    expect(wrapper.emitted('update:groupBy')[0]).toEqual(['none'])
  })
})
