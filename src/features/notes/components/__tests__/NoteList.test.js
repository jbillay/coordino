import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteList from '../NoteList.vue'
import { nextTick } from 'vue'

// Mock NoteCard to avoid rendering its complex content
vi.mock('./NoteCard.vue', () => ({
  default: {
    template: '<div class="mock-note-card"></div>',
    props: ['note']
  }
}))

describe('NoteList.vue', () => {
  const notes = [
    {
      id: 1,
      title: 'Note 1',
      content: 'Content 1',
      is_pinned: true,
      updated_at: '2023-01-01T12:00:00Z',
      created_at: '2023-01-01T10:00:00Z'
    },
    {
      id: 3,
      title: 'Note 3',
      content: 'Content 3',
      is_pinned: false,
      updated_at: '2023-01-03T12:00:00Z',
      created_at: '2023-01-03T10:00:00Z'
    },
    {
      id: 2,
      title: 'A Note 2',
      content: 'Content 2',
      is_pinned: false,
      updated_at: '2023-01-02T12:00:00Z',
      created_at: '2023-01-02T10:00:00Z'
    }
  ]

  const mountComponent = (props = {}) =>
    mount(NoteList, {
      props: {
        notes,
        ...props
      },
      global: {
        stubs: {
          Button: {
            template:
              '<button :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\', $event)">{{ label }}</button>',
            props: ['label', 'icon', 'size', 'data-testid'],
            emits: ['click']
          },
          Select: {
            template:
              '<select :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
            props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'class'],
            emits: ['update:modelValue']
          }
        },
        directives: {
          tooltip: vi.fn()
        }
      }
    })

  it('renders a list of notes', () => {
    const wrapper = mountComponent()
    const noteCards = wrapper.findAllComponents({ name: 'NoteCard' })
    expect(noteCards.length).toBe(notes.length)
  })

  it('separates pinned and regular notes', () => {
    const wrapper = mountComponent()
    const pinnedSection = wrapper.find('[data-testid="pinned-notes"]')
    const regularSection = wrapper.find('[data-testid="regular-notes"]')

    expect(pinnedSection.findAllComponents({ name: 'NoteCard' }).length).toBe(1)
    expect(regularSection.findAllComponents({ name: 'NoteCard' }).length).toBe(2)
  })

  it('emits "open-note" when a note is clicked', async () => {
    const wrapper = mountComponent()
    const noteCard = wrapper.findComponent({ name: 'NoteCard' })
    await noteCard.trigger('click')
    expect(wrapper.emitted('open-note')[0][0]).toEqual(notes[0])
  })

  it('sorts notes by last updated by default', () => {
    const wrapper = mountComponent()
    const regularSection = wrapper.find('[data-testid="regular-notes"]')
    const regularNoteCards = regularSection.findAllComponents({ name: 'NoteCard' })
    expect(regularNoteCards[0].props('note').id).toBe(3)
    expect(regularNoteCards[1].props('note').id).toBe(2)
  })

  it('sorts notes by title when sort option is changed', async () => {
    const wrapper = mountComponent({ sortBy: 'title-asc' })
    await nextTick()

    const regularSection = wrapper.find('[data-testid="regular-notes"]')
    const regularNoteCards = regularSection.findAllComponents({ name: 'NoteCard' })

    expect(regularNoteCards[0].props('note').id).toBe(2)
    expect(regularNoteCards[1].props('note').id).toBe(3)
  })

  it('displays an empty state message when there are no notes', () => {
    const wrapper = mountComponent({ notes: [] })
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No notes yet')
  })

  it('displays a loading indicator when loading', () => {
    const wrapper = mountComponent({ loading: true, notes: [] })
    expect(wrapper.find('[data-testid="loading-indicator"]').exists()).toBe(true)
  })
})
