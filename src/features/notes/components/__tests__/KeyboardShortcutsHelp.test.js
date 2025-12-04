import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import KeyboardShortcutsHelp from '../KeyboardShortcutsHelp.vue'

// Mock the composable
vi.mock('../composables/useNoteKeyboardShortcuts', () => ({
  getShortcutText: (key, withModifier) => {
    if (withModifier) {
      return `Ctrl+${key.toUpperCase()}`
    }
    return key
  }
}))

describe('KeyboardShortcutsHelp.vue', () => {
  const mountComponent = (props = {}) =>
    mount(KeyboardShortcutsHelp, {
      props: {
        visible: false,
        ...props
      },
      global: {
        stubs: {
          Dialog: {
            name: 'Dialog',
            template: `
              <div class="dialog-stub" v-if="visible">
                <div class="header">{{ header }}</div>
                <slot />
                <div class="footer"><slot name="footer" /></div>
              </div>
            `,
            props: ['visible', 'modal', 'closable', 'header', 'style'],
            emits: ['update:visible']
          },
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)">{{ label }}</button>',
            props: ['label', 'icon', 'class'],
            emits: ['click']
          },
          ShortcutItem: {
            name: 'ShortcutItem',
            template: '<div class="shortcut-item">{{ label }} - {{ shortcut }}</div>',
            props: ['shortcut', 'label']
          }
        }
      }
    })

  describe('Component Rendering', () => {
    it('renders correctly when visible', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.find('.dialog-stub').exists()).toBe(true)
    })

    it('does not render when not visible', () => {
      const wrapper = mountComponent({ visible: false })
      expect(wrapper.find('.dialog-stub').exists()).toBe(false)
    })

    it('displays "Keyboard Shortcuts" header', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.find('.header').text()).toBe('Keyboard Shortcuts')
    })

    it('displays introduction text', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Use these keyboard shortcuts')
      expect(wrapper.text()).toContain('navigate and work more efficiently')
    })
  })

  describe('Navigation Section', () => {
    it('displays Navigation heading', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Navigation')
    })

    it('displays Create New Note shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Create New Note')
      expect(wrapper.text()).toContain('Ctrl+N')
    })

    it('displays Focus Search shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Focus Search')
      expect(wrapper.text()).toContain('Ctrl+K')
    })

    it('displays Close / Go Back shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Close / Go Back')
      expect(wrapper.text()).toContain('ESCAPE')
    })
  })

  describe('Editing Section', () => {
    it('displays Editing heading', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Editing')
    })

    it('displays Save Note shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Save Note')
      expect(wrapper.text()).toContain('Ctrl+S')
    })

    it('displays Bold Text shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Bold Text')
      expect(wrapper.text()).toContain('Ctrl+B')
    })

    it('displays Italic Text shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Italic Text')
      expect(wrapper.text()).toContain('Ctrl+I')
    })

    it('displays Underline Text shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Underline Text')
      expect(wrapper.text()).toContain('Ctrl+U')
    })
  })

  describe('Actions Section', () => {
    it('displays Actions heading', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Actions')
    })

    it('displays Pin / Unpin Note shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Pin / Unpin Note')
      expect(wrapper.text()).toContain('Ctrl+P')
    })

    it('displays Delete Note shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Delete Note')
      expect(wrapper.text()).toContain('Ctrl+DELETE')
    })
  })

  describe('Search Navigation Section', () => {
    it('displays Search Navigation heading', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Search Navigation')
    })

    it('displays Navigate Search Results shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Navigate Search Results')
      expect(wrapper.text()).toContain('↓ / ↑')
    })

    it('displays Open Selected Result shortcut', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Open Selected Result')
      expect(wrapper.text()).toContain('Enter')
    })
  })

  describe('ShortcutItem Components', () => {
    it('renders multiple ShortcutItem components', () => {
      const wrapper = mountComponent({ visible: true })
      const shortcutItems = wrapper.findAllComponents({ name: 'ShortcutItem' })
      expect(shortcutItems.length).toBeGreaterThan(0)
    })

    it('passes correct props to ShortcutItem components', () => {
      const wrapper = mountComponent({ visible: true })
      const shortcutItems = wrapper.findAllComponents({ name: 'ShortcutItem' })

      // Check first shortcut item (Create New Note)
      const firstItem = shortcutItems[0]
      expect(firstItem.props('label')).toBe('Create New Note')
      expect(firstItem.props('shortcut')).toBe('Ctrl+N')
    })
  })

  describe('Dialog Footer', () => {
    it('displays Close button', () => {
      const wrapper = mountComponent({ visible: true })
      const closeButton = wrapper.findComponent({ name: 'Button' })
      expect(closeButton.exists()).toBe(true)
      expect(closeButton.props('label')).toBe('Close')
    })

    it('has correct icon on Close button', () => {
      const wrapper = mountComponent({ visible: true })
      const closeButton = wrapper.findComponent({ name: 'Button' })
      expect(closeButton.props('icon')).toBe('pi pi-times')
    })

    it('emits update:visible false when Close button is clicked', async () => {
      const wrapper = mountComponent({ visible: true })
      const closeButton = wrapper.findComponent({ name: 'Button' })

      await closeButton.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')[0]).toEqual([false])
    })
  })

  describe('Props', () => {
    it('accepts visible prop', () => {
      const { visible } = KeyboardShortcutsHelp.props
      expect(visible).toBeDefined()
    })

    it('visible prop is of type Boolean', () => {
      const { visible } = KeyboardShortcutsHelp.props
      expect(visible).toBe(Boolean)
    })
  })

  describe('Layout and Styling', () => {
    it('uses space-y-4 for main content spacing', () => {
      const wrapper = mountComponent({ visible: true })
      const mainContent = wrapper.find('.space-y-4')
      expect(mainContent.exists()).toBe(true)
    })

    it('uses space-y-2 for shortcut items within sections', () => {
      const wrapper = mountComponent({ visible: true })
      const shortcutContainers = wrapper.findAll('.space-y-2')
      expect(shortcutContainers.length).toBeGreaterThan(0)
    })

    it('applies uppercase and tracking to section headings', () => {
      const wrapper = mountComponent({ visible: true })
      const headings = wrapper.findAll('h3')
      headings.forEach((heading) => {
        const classes = heading.classes().join(' ')
        expect(classes).toContain('uppercase')
        expect(classes).toContain('tracking-wider')
      })
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes for introduction text', () => {
      const wrapper = mountComponent({ visible: true })
      const introText = wrapper.find('.text-sm.text-gray-600')
      const classes = introText.classes().join(' ')
      expect(classes).toContain('dark:text-gray-400')
    })

    it('has dark mode classes for section headings', () => {
      const wrapper = mountComponent({ visible: true })
      const headings = wrapper.findAll('h3')
      headings.forEach((heading) => {
        const classes = heading.classes().join(' ')
        expect(classes).toContain('dark:text-white')
      })
    })
  })

  describe('Accessibility', () => {
    it('uses semantic headings for sections', () => {
      const wrapper = mountComponent({ visible: true })
      const headings = wrapper.findAll('h3')
      expect(headings.length).toBe(4) // 4 sections
    })

    it('provides descriptive labels for all shortcuts', () => {
      const wrapper = mountComponent({ visible: true })
      const shortcutItems = wrapper.findAllComponents({ name: 'ShortcutItem' })

      shortcutItems.forEach((item) => {
        expect(item.props('label')).toBeTruthy()
        expect(item.props('shortcut')).toBeTruthy()
      })
    })

    it('includes explanatory introduction text', () => {
      const wrapper = mountComponent({ visible: true })
      expect(wrapper.text()).toContain('Use these keyboard shortcuts')
    })
  })

  describe('Edge Cases', () => {
    it('handles visibility toggle', async () => {
      const wrapper = mountComponent({ visible: false })
      expect(wrapper.find('.dialog-stub').exists()).toBe(false)

      await wrapper.setProps({ visible: true })
      expect(wrapper.find('.dialog-stub').exists()).toBe(true)

      await wrapper.setProps({ visible: false })
      expect(wrapper.find('.dialog-stub').exists()).toBe(false)
    })

    it('maintains content when toggling visibility', async () => {
      const wrapper = mountComponent({ visible: true })

      await wrapper.setProps({ visible: false })
      await wrapper.setProps({ visible: true })

      expect(wrapper.text()).toContain('Keyboard Shortcuts')
      expect(wrapper.text()).toContain('Create New Note')
    })
  })
})
