import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteCard from '../NoteCard.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

describe('NoteCard', () => {
  const createWrapper = (props = {}) =>
    mount(NoteCard, {
      props: {
        note: {
          id: '1',
          title: 'Test Note',
          content: '<p>This is test content</p>',
          is_pinned: false,
          archived_at: null,
          updated_at: new Date().toISOString(),
          topic: {
            id: 't1',
            name: 'Test Topic',
            color: '#3b82f6'
          },
          ...props.note
        },
        ...props
      },
      global: {
        components: {
          Card,
          Button
        },
        directives: {
          tooltip: () => {} // Mock tooltip directive
        }
      }
    })

  describe('Rendering', () => {
    it('should render note title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Test Note')
    })

    it('should render content preview', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('This is test content')
    })

    it('should render topic badge', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Test Topic')
    })

    it('should show pin icon when note is pinned', () => {
      const wrapper = createWrapper({
        note: {
          id: '1',
          title: 'Test',
          content: 'Content',
          is_pinned: true,
          archived_at: null,
          updated_at: new Date().toISOString()
        }
      })

      expect(wrapper.find('.pi-star-fill').exists()).toBe(true)
    })

    it('should show archived badge when note is archived', () => {
      const wrapper = createWrapper({
        note: {
          id: '1',
          title: 'Test',
          content: 'Content',
          is_pinned: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          topic: {
            // Explicitly provide a topic
            id: 't1',
            name: 'Test Topic',
            color: '#3b82f6'
          }
        }
      })
      expect(wrapper.find('span.px-2.py-1.rounded.text-xs.font-medium').text()).toBe('Archived')
    })
  })

  describe('User Interactions', () => {
    it('should emit click event when card is clicked', async () => {
      const wrapper = createWrapper()
      await wrapper.find('.note-card').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('should emit pin event when pin button is clicked', async () => {
      const wrapper = createWrapper()
      const pinButton = wrapper
        .findAll('button')
        .find((btn) => btn.classes().includes('p-button-rounded'))

      await pinButton.trigger('click')

      expect(wrapper.emitted('pin')).toBeTruthy()
    })

    it('should stop propagation when action buttons are clicked', async () => {
      const wrapper = createWrapper()
      const clickSpy = vi.fn()
      wrapper.vm.$el.addEventListener('click', clickSpy)

      // Click pin button
      const pinButton = wrapper.findAll('button')[0]
      await pinButton.trigger('click')

      // Card click should not fire due to stop propagation
      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should emit archive event when archive button is clicked', async () => {
      const wrapper = createWrapper()
      const archiveButton = wrapper.findAll('button')[1]

      await archiveButton.trigger('click')

      expect(wrapper.emitted('archive')).toBeTruthy()
    })

    it('should emit delete event when delete button is clicked', async () => {
      const wrapper = createWrapper()
      const deleteButton = wrapper.findAll('button')[2]

      await deleteButton.trigger('click')

      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })

  describe('Visual States', () => {
    it('should have opacity class when archived', () => {
      const wrapper = createWrapper({
        note: {
          id: '1',
          title: 'Test',
          content: 'Content',
          is_pinned: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      expect(wrapper.find('.note-card').classes()).toContain('opacity-60')
    })

    it('should have primary border when pinned', () => {
      const wrapper = createWrapper({
        note: {
          id: '1',
          title: 'Test',
          content: 'Content',
          is_pinned: true,
          archived_at: null,
          updated_at: new Date().toISOString()
        }
      })

      expect(wrapper.find('.note-card').classes()).toContain('border-primary-500')
    })
  })

  describe('Metadata Display', () => {
    it('should display word count', () => {
      const wrapper = createWrapper({
        note: {
          id: '1',
          title: 'Test',
          content: '<p>One two three four five</p>',
          is_pinned: false,
          archived_at: null,
          updated_at: new Date().toISOString()
        }
      })

      expect(wrapper.text()).toContain('5 words')
    })

    it('should display reading time', () => {
      const wrapper = createWrapper({
        note: {
          id: '1',
          title: 'Test',
          content: `<p>${'word '.repeat(250)}</p>`,
          is_pinned: false,
          archived_at: null,
          updated_at: new Date().toISOString()
        }
      })

      expect(wrapper.text()).toMatch(/\d+ min read/)
    })
  })
})
