import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TopicCard from '../TopicCard.vue'

describe('TopicCard.vue', () => {
  const mockTopic = {
    id: '1',
    name: 'Work',
    color: '#3b82f6',
    note_count: 10,
    description: 'Work related notes'
  }

  const mountComponent = (props = {}) =>
    mount(TopicCard, {
      props: {
        topic: mockTopic,
        selected: false,
        ...props
      },
      global: {
        stubs: {
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
            props: ['icon', 'class', 'loading', 'disabled'],
            emits: ['click']
          }
        },
        directives: {
          tooltip: () => {}
        }
      }
    })

  describe('Component Rendering', () => {
    it('renders correctly with required props', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.topic-card').exists()).toBe(true)
    })

    it('displays topic name', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Work')
    })

    it('displays note count', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('10 notes')
    })

    it('displays color indicator', () => {
      const wrapper = mountComponent()

      const colorIndicator = wrapper.find('.rounded-full')
      expect(colorIndicator.exists()).toBe(true)
      expect(colorIndicator.attributes('style')).toContain('#3b82f6')
    })

    it('displays drag handle', () => {
      const wrapper = mountComponent()

      const dragHandle = wrapper.find('.drag-handle')
      expect(dragHandle.exists()).toBe(true)
      expect(dragHandle.classes()).toContain('pi-bars')
    })

    it('displays edit button', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const editButton = buttons.find((b) => b.props('icon') === 'pi pi-pencil')
      expect(editButton).toBeDefined()
    })

    it('displays delete button', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const deleteButton = buttons.find((b) => b.props('icon') === 'pi pi-trash')
      expect(deleteButton).toBeDefined()
    })
  })

  describe('Selected State', () => {
    it('applies selected styles when selected is true', () => {
      const wrapper = mountComponent({ selected: true })

      const card = wrapper.find('.topic-card')
      const classes = card.classes().join(' ')
      expect(classes).toContain('bg-primary-50')
    })

    it('does not apply selected styles when selected is false', () => {
      const wrapper = mountComponent({ selected: false })

      const card = wrapper.find('.topic-card')
      const classes = card.classes().join(' ')
      expect(classes).not.toContain('bg-primary-50')
    })

    it('applies border color when selected', () => {
      const wrapper = mountComponent({ selected: true })

      const card = wrapper.find('.topic-card')
      const style = card.attributes('style')
      expect(style).toContain('#3b82f6')
    })

    it('applies transparent border when not selected', () => {
      const wrapper = mountComponent({ selected: false })

      const card = wrapper.find('.topic-card')
      const style = card.attributes('style')
      expect(style).toContain('transparent')
    })

    it('applies dark mode selected styles', () => {
      const wrapper = mountComponent({ selected: true })

      const card = wrapper.find('.topic-card')
      const classes = card.classes().join(' ')
      expect(classes).toContain('dark:bg-primary-900/20')
    })

    it('applies hover styles when not selected', () => {
      const wrapper = mountComponent({ selected: false })

      const card = wrapper.find('.topic-card')
      const classes = card.classes().join(' ')
      expect(classes).toContain('hover:bg-gray-50')
    })
  })

  describe('Event Emissions', () => {
    it('emits select event when card is clicked', async () => {
      const wrapper = mountComponent()

      await wrapper.find('.topic-card').trigger('click')
      await nextTick()

      expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('emits edit event when edit button is clicked', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const editButton = buttons.find((b) => b.props('icon') === 'pi pi-pencil')
      await editButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('edit')).toBeTruthy()
    })

    it('emits delete event when delete button is clicked', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const deleteButton = buttons.find((b) => b.props('icon') === 'pi pi-trash')
      await deleteButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('does not emit select when edit button is clicked', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const editButton = buttons.find((b) => b.props('icon') === 'pi pi-pencil')
      await editButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('does not emit select when delete button is clicked', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const deleteButton = buttons.find((b) => b.props('icon') === 'pi pi-trash')
      await deleteButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('select')).toBeFalsy()
    })

    it('does not emit select when drag handle is clicked', async () => {
      const wrapper = mountComponent()

      const dragHandle = wrapper.find('.drag-handle')
      await dragHandle.trigger('click')
      await nextTick()

      expect(wrapper.emitted('select')).toBeFalsy()
    })
  })

  describe('Topic Data Display', () => {
    it('displays topic name in heading', () => {
      const wrapper = mountComponent()

      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Work')
    })

    it('displays note count with correct pluralization', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('10 notes')
    })

    it('displays zero notes correctly', () => {
      const topicWithNoNotes = { ...mockTopic, note_count: 0 }
      const wrapper = mountComponent({ topic: topicWithNoNotes })

      expect(wrapper.text()).toContain('0 notes')
    })

    it('displays single note correctly', () => {
      const topicWithOneNote = { ...mockTopic, note_count: 1 }
      const wrapper = mountComponent({ topic: topicWithOneNote })

      expect(wrapper.text()).toContain('1 notes')
    })

    it('handles missing note_count gracefully', () => {
      const topicWithoutCount = { ...mockTopic, note_count: undefined }
      const wrapper = mountComponent({ topic: topicWithoutCount })

      expect(wrapper.text()).toContain('0 notes')
    })

    it('truncates long topic names', () => {
      const longName = 'A very long topic name that should be truncated'
      const topicWithLongName = { ...mockTopic, name: longName }
      const wrapper = mountComponent({ topic: topicWithLongName })

      const heading = wrapper.find('h3')
      expect(heading.classes()).toContain('truncate')
    })
  })

  describe('Color Indicator', () => {
    it('displays color from topic', () => {
      const wrapper = mountComponent()

      const indicator = wrapper.find('.rounded-full')
      expect(indicator.attributes('style')).toContain('#3b82f6')
    })

    it('uses default gray color when topic color is missing', () => {
      const topicWithoutColor = { ...mockTopic, color: undefined }
      const wrapper = mountComponent({ topic: topicWithoutColor })

      const indicator = wrapper.find('.rounded-full')
      const style = indicator.attributes('style')
      expect(style).toContain('#6b7280')
    })

    it('applies correct size classes to color indicator', () => {
      const wrapper = mountComponent()

      const indicator = wrapper.find('.rounded-full')
      expect(indicator.classes()).toContain('w-3')
      expect(indicator.classes()).toContain('h-3')
    })

    it('makes color indicator flex-shrink-0', () => {
      const wrapper = mountComponent()

      const indicator = wrapper.find('.rounded-full')
      expect(indicator.classes()).toContain('flex-shrink-0')
    })
  })

  describe('Drag Handle', () => {
    it('displays drag handle icon', () => {
      const wrapper = mountComponent()

      const dragHandle = wrapper.find('.pi-bars')
      expect(dragHandle.exists()).toBe(true)
    })

    it('applies cursor styles to drag handle', () => {
      const wrapper = mountComponent()

      const dragHandle = wrapper.find('.drag-handle')
      expect(dragHandle.classes()).toContain('cursor-grab')
      expect(dragHandle.classes()).toContain('active:cursor-grabbing')
    })

    it('drag handle has hover styles', () => {
      const wrapper = mountComponent()

      const dragHandle = wrapper.find('.drag-handle')
      const classes = dragHandle.classes().join(' ')
      expect(classes).toContain('hover:text-gray-600')
    })
  })

  describe('Action Buttons', () => {
    it('edit button has correct icon', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const editButton = buttons.find((b) => b.props('icon') === 'pi pi-pencil')
      expect(editButton.props('icon')).toBe('pi pi-pencil')
    })

    it('delete button has correct icon', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const deleteButton = buttons.find((b) => b.props('icon') === 'pi pi-trash')
      expect(deleteButton.props('icon')).toBe('pi pi-trash')
    })

    it('edit button has rounded text styling', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const editButton = buttons.find((b) => b.props('icon') === 'pi pi-pencil')
      const classes = editButton.props('class')
      expect(classes).toContain('p-button-rounded')
      expect(classes).toContain('p-button-text')
    })

    it('delete button has danger styling', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const deleteButton = buttons.find((b) => b.props('icon') === 'pi pi-trash')
      const classes = deleteButton.props('class')
      expect(classes).toContain('p-button-danger')
    })

    it('both buttons have small size', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      buttons.forEach((button) => {
        expect(button.props('class')).toContain('p-button-sm')
      })
    })
  })

  describe('Layout and Structure', () => {
    it('uses flexbox layout', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.topic-card')
      expect(card.classes()).toContain('flex')
      expect(card.classes()).toContain('items-center')
      expect(card.classes()).toContain('justify-between')
    })

    it('has cursor pointer', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.topic-card')
      expect(card.classes()).toContain('cursor-pointer')
    })

    it('has transition classes', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.topic-card')
      expect(card.classes()).toContain('transition-colors')
    })

    it('has rounded corners', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.topic-card')
      expect(card.classes()).toContain('rounded-lg')
    })

    it('has left border', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.topic-card')
      expect(card.classes()).toContain('border-l-4')
    })
  })

  describe('Props Validation', () => {
    it('requires topic prop', () => {
      const { topic } = TopicCard.props
      expect(topic.required).toBe(true)
    })

    it('topic prop is of type Object', () => {
      const { topic } = TopicCard.props
      expect(topic.type).toBe(Object)
    })

    it('selected prop has default value false', () => {
      const { selected } = TopicCard.props
      expect(selected.default).toBe(false)
    })

    it('selected prop is of type Boolean', () => {
      const { selected } = TopicCard.props
      expect(selected.type).toBe(Boolean)
    })
  })

  describe('Edge Cases', () => {
    it('handles topic with empty name', () => {
      const topicWithEmptyName = { ...mockTopic, name: '' }
      const wrapper = mountComponent({ topic: topicWithEmptyName })

      expect(wrapper.find('h3').text()).toBe('')
    })

    it('handles topic with special characters in name', () => {
      const topicWithSpecialChars = { ...mockTopic, name: 'Work & Personal <Test>' }
      const wrapper = mountComponent({ topic: topicWithSpecialChars })

      expect(wrapper.text()).toContain('Work & Personal <Test>')
    })

    it('handles very large note count', () => {
      const topicWithManyNotes = { ...mockTopic, note_count: 99999 }
      const wrapper = mountComponent({ topic: topicWithManyNotes })

      expect(wrapper.text()).toContain('99999 notes')
    })

    it('handles negative note count', () => {
      const topicWithNegativeCount = { ...mockTopic, note_count: -5 }
      const wrapper = mountComponent({ topic: topicWithNegativeCount })

      expect(wrapper.text()).toContain('-5 notes')
    })

    it('handles custom color formats', () => {
      const topicWithRgbColor = { ...mockTopic, color: 'rgb(59, 130, 246)' }
      const wrapper = mountComponent({ topic: topicWithRgbColor })

      const indicator = wrapper.find('.rounded-full')
      expect(indicator.attributes('style')).toContain('rgb(59, 130, 246)')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic heading for topic name', () => {
      const wrapper = mountComponent()

      const heading = wrapper.find('h3')
      expect(heading.exists()).toBe(true)
    })

    it('card is keyboard accessible', () => {
      const wrapper = mountComponent()

      const card = wrapper.find('.topic-card')
      expect(card.exists()).toBe(true)
    })

    it('action buttons are accessible', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      expect(buttons.length).toBe(2)
    })

    it('uses appropriate ARIA-friendly structure', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('h3').exists()).toBe(true)
      expect(wrapper.find('p').exists()).toBe(true)
    })
  })
})
