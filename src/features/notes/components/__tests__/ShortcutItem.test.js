import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShortcutItem from '../ShortcutItem.vue'

describe('ShortcutItem.vue', () => {
  const defaultProps = {
    shortcut: 'Ctrl+S',
    label: 'Save note'
  }

  const mountComponent = (props = {}) =>
    mount(ShortcutItem, {
      props: {
        ...defaultProps,
        ...props
      }
    })

  describe('Component Rendering', () => {
    it('renders correctly with required props', () => {
      const wrapper = mountComponent()

      expect(wrapper.find('.shortcut-item').exists()).toBe(true)
    })

    it('displays the label text', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Save note')
    })

    it('displays the shortcut key', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Ctrl+S')
      expect(wrapper.find('kbd').exists()).toBe(true)
    })

    it('uses kbd element for shortcut display', () => {
      const wrapper = mountComponent()

      const kbd = wrapper.find('kbd')
      expect(kbd.exists()).toBe(true)
      expect(kbd.text()).toBe('Ctrl+S')
    })

    it('uses span element for label display', () => {
      const wrapper = mountComponent()

      const span = wrapper.find('span')
      expect(span.exists()).toBe(true)
      expect(span.text()).toBe('Save note')
    })

    it('applies correct CSS classes', () => {
      const wrapper = mountComponent()

      const item = wrapper.find('.shortcut-item')
      expect(item.classes()).toContain('flex')
      expect(item.classes()).toContain('items-center')
      expect(item.classes()).toContain('justify-between')
    })

    it('applies shortcut-key class to kbd element', () => {
      const wrapper = mountComponent()

      const kbd = wrapper.find('kbd')
      expect(kbd.classes()).toContain('shortcut-key')
    })
  })

  describe('Different Shortcuts', () => {
    it('displays single key shortcut', () => {
      const wrapper = mountComponent({
        shortcut: 'Esc',
        label: 'Close dialog'
      })

      expect(wrapper.find('kbd').text()).toBe('Esc')
    })

    it('displays modifier key shortcut', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+K',
        label: 'Open command palette'
      })

      expect(wrapper.find('kbd').text()).toBe('Ctrl+K')
    })

    it('displays multiple modifier shortcut', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+Shift+P',
        label: 'Toggle pin'
      })

      expect(wrapper.find('kbd').text()).toBe('Ctrl+Shift+P')
    })

    it('displays Mac-style shortcut', () => {
      const wrapper = mountComponent({
        shortcut: '⌘S',
        label: 'Save note'
      })

      expect(wrapper.find('kbd').text()).toBe('⌘S')
    })

    it('displays Alt key shortcut', () => {
      const wrapper = mountComponent({
        shortcut: 'Alt+N',
        label: 'New note'
      })

      expect(wrapper.find('kbd').text()).toBe('Alt+N')
    })
  })

  describe('Different Labels', () => {
    it('displays short label', () => {
      const wrapper = mountComponent({
        shortcut: 'N',
        label: 'New'
      })

      expect(wrapper.find('span').text()).toBe('New')
    })

    it('displays long label', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+Shift+N',
        label: 'Create new note in current topic'
      })

      expect(wrapper.find('span').text()).toBe('Create new note in current topic')
    })

    it('displays label with special characters', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+/',
        label: 'Search & Filter'
      })

      expect(wrapper.find('span').text()).toBe('Search & Filter')
    })

    it('displays label with numbers', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+1',
        label: 'Switch to topic 1'
      })

      expect(wrapper.find('span').text()).toBe('Switch to topic 1')
    })
  })

  describe('Props Validation', () => {
    it('requires shortcut prop', () => {
      const { shortcut } = ShortcutItem.props
      expect(shortcut.required).toBe(true)
    })

    it('requires label prop', () => {
      const { label } = ShortcutItem.props
      expect(label.required).toBe(true)
    })

    it('shortcut prop is of type String', () => {
      const { shortcut } = ShortcutItem.props
      expect(shortcut.type).toBe(String)
    })

    it('label prop is of type String', () => {
      const { label } = ShortcutItem.props
      expect(label.type).toBe(String)
    })
  })

  describe('Layout and Structure', () => {
    it('uses flexbox layout', () => {
      const wrapper = mountComponent()

      const item = wrapper.find('.shortcut-item')
      expect(item.classes()).toContain('flex')
    })

    it('aligns items center vertically', () => {
      const wrapper = mountComponent()

      const item = wrapper.find('.shortcut-item')
      expect(item.classes()).toContain('items-center')
    })

    it('justifies content space-between', () => {
      const wrapper = mountComponent()

      const item = wrapper.find('.shortcut-item')
      expect(item.classes()).toContain('justify-between')
    })

    it('has hover styles', () => {
      const wrapper = mountComponent()

      const item = wrapper.find('.shortcut-item')
      const classes = item.classes().join(' ')
      expect(classes).toContain('hover:bg-gray-50')
    })

    it('has dark mode hover styles', () => {
      const wrapper = mountComponent()

      const item = wrapper.find('.shortcut-item')
      const classes = item.classes().join(' ')
      expect(classes).toContain('dark:hover:bg-gray-800')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty shortcut string', () => {
      const wrapper = mountComponent({
        shortcut: '',
        label: 'No shortcut'
      })

      expect(wrapper.find('kbd').text()).toBe('')
    })

    it('handles empty label string', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+K',
        label: ''
      })

      expect(wrapper.find('span').text()).toBe('')
    })

    it('handles very long shortcut', () => {
      const longShortcut = 'Ctrl+Shift+Alt+Meta+Super+Hyper+K'
      const wrapper = mountComponent({
        shortcut: longShortcut,
        label: 'Complex shortcut'
      })

      expect(wrapper.find('kbd').text()).toBe(longShortcut)
    })

    it('handles very long label', () => {
      const longLabel = 'This is a very long label that describes a complex action in detail'
      const wrapper = mountComponent({
        shortcut: 'Ctrl+K',
        label: longLabel
      })

      expect(wrapper.find('span').text()).toBe(longLabel)
    })

    it('handles special characters in shortcut', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+/',
        label: 'Toggle comment'
      })

      expect(wrapper.find('kbd').text()).toBe('Ctrl+/')
    })

    it('handles Unicode characters in shortcut', () => {
      const wrapper = mountComponent({
        shortcut: '⌘⇧P',
        label: 'Command palette'
      })

      expect(wrapper.find('kbd').text()).toBe('⌘⇧P')
    })

    it('handles Unicode characters in label', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+K',
        label: 'Search 🔍'
      })

      expect(wrapper.find('span').text()).toBe('Search 🔍')
    })

    it('handles HTML-like content in label (should be escaped)', () => {
      const wrapper = mountComponent({
        shortcut: 'Ctrl+B',
        label: '<b>Bold</b> text'
      })

      const span = wrapper.find('span')
      // Text should be displayed as plain text, not rendered as HTML
      expect(span.text()).toBe('<b>Bold</b> text')
      expect(span.html()).not.toContain('<b>Bold</b>')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic kbd element for keyboard shortcuts', () => {
      const wrapper = mountComponent()

      const kbd = wrapper.find('kbd')
      expect(kbd.exists()).toBe(true)
    })

    it('displays label as plain text for screen readers', () => {
      const wrapper = mountComponent()

      const span = wrapper.find('span')
      expect(span.exists()).toBe(true)
      expect(span.element.tagName.toLowerCase()).toBe('span')
    })

    it('uses appropriate font styles for shortcut keys', () => {
      const wrapper = mountComponent()

      const kbd = wrapper.find('kbd')
      expect(kbd.classes()).toContain('shortcut-key')
    })
  })
})
