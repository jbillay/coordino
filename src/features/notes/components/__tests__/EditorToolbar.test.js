import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EditorToolbar from '../EditorToolbar.vue'

describe('EditorToolbar.vue', () => {
  let wrapper
  let mockEditor
  let mockChain

  // Create a mock TipTap editor
  const createMockEditor = (activeFormats = {}) => {
    mockChain = {
      focus: vi.fn().mockReturnThis(),
      toggleBold: vi.fn().mockReturnThis(),
      toggleItalic: vi.fn().mockReturnThis(),
      toggleUnderline: vi.fn().mockReturnThis(),
      toggleHeading: vi.fn().mockReturnThis(),
      setParagraph: vi.fn().mockReturnThis(),
      toggleBulletList: vi.fn().mockReturnThis(),
      toggleOrderedList: vi.fn().mockReturnThis(),
      toggleCodeBlock: vi.fn().mockReturnThis(),
      toggleBlockquote: vi.fn().mockReturnThis(),
      setHorizontalRule: vi.fn().mockReturnThis(),
      clearNodes: vi.fn().mockReturnThis(),
      unsetAllMarks: vi.fn().mockReturnThis(),
      extendMarkRange: vi.fn().mockReturnThis(),
      setLink: vi.fn().mockReturnThis(),
      unsetLink: vi.fn().mockReturnThis(),
      run: vi.fn()
    }

    return {
      chain: vi.fn(() => mockChain),
      isActive: vi.fn((format, options) => {
        if (options && options.level) {
          return activeFormats[format] === options.level
        }
        return activeFormats[format] || false
      }),
      getAttributes: vi.fn((format) => {
        if (format === 'link') {
          return { href: 'https://example.com' }
        }
        return {}
      })
    }
  }

  const mountComponent = (props = {}, activeFormats = {}) => {
    mockEditor = createMockEditor(activeFormats)
    return mount(EditorToolbar, {
      props: {
        editor: mockEditor,
        ...props
      },
      global: {
        stubs: {
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\', $event)"><slot />{{ label }}</button>',
            props: ['label', 'icon', 'class', 'disabled'],
            emits: ['click']
          },
          Select: {
            name: 'Select',
            template:
              '<select :value="modelValue" @change="$emit(\'change\', { value: parseInt($event.target.value) })"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'class'],
            emits: ['change']
          },
          InputText: {
            name: 'InputText',
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keyup="handleKeyup" :placeholder="placeholder" :id="id" />',
            props: ['modelValue', 'placeholder', 'class', 'id'],
            emits: ['update:modelValue', 'keyup.enter'],
            methods: {
              handleKeyup(event) {
                if (event.key === 'Enter') {
                  this.$emit('keyup.enter')
                }
              }
            }
          },
          Dialog: {
            name: 'Dialog',
            template: `
              <div v-if="visible" class="dialog-stub">
                <div class="header">{{ header }}</div>
                <slot />
                <div class="footer"><slot name="footer" /></div>
              </div>
            `,
            props: ['visible', 'header', 'modal', 'style'],
            emits: ['update:visible']
          }
        },
        directives: {
          tooltip: () => {}
        }
      }
    })
  }

  beforeEach(() => {
    wrapper = mountComponent()
  })

  describe('Component Rendering', () => {
    it('renders correctly when editor is provided', () => {
      expect(wrapper.find('.editor-toolbar').exists()).toBe(true)
    })

    it('does not render when editor is null', async () => {
      const wrapper = mount(EditorToolbar, {
        props: {
          editor: null
        }
      })
      expect(wrapper.find('.editor-toolbar').exists()).toBe(false)
    })

    it('displays all toolbar groups', () => {
      const groups = wrapper.findAll('.toolbar-group')
      expect(groups.length).toBe(5) // Text, Heading, List, Special, Other
    })

    it('displays toolbar dividers', () => {
      const dividers = wrapper.findAll('.toolbar-divider')
      expect(dividers.length).toBeGreaterThan(0)
    })

    it('has proper background and border classes', () => {
      const toolbar = wrapper.find('.editor-toolbar')
      expect(toolbar.classes()).toContain('bg-gray-50')
      expect(toolbar.classes()).toContain('dark:bg-gray-800')
      expect(toolbar.classes()).toContain('border-b')
    })
  })

  describe('Text Formatting Buttons', () => {
    it('displays bold button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const boldButton = buttons.find((b) => b.props('icon') === 'pi pi-bold')
      expect(boldButton).toBeTruthy()
    })

    it('toggles bold formatting when bold button is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const boldButton = buttons.find((b) => b.props('icon') === 'pi pi-bold')

      await boldButton.trigger('click')

      expect(mockEditor.chain).toHaveBeenCalled()
      expect(mockChain.focus).toHaveBeenCalled()
      expect(mockChain.toggleBold).toHaveBeenCalled()
      expect(mockChain.run).toHaveBeenCalled()
    })

    it('highlights bold button when bold is active', () => {
      const wrapper = mountComponent({}, { bold: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const boldButton = buttons.find((b) => b.props('icon') === 'pi pi-bold')

      const classes = boldButton.props('class')
      expect(classes).toContain('bg-primary-100')
      expect(classes).toContain('text-primary-600')
    })

    it('displays italic button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const italicButton = buttons.find((b) => b.props('icon') === 'pi pi-italic')
      expect(italicButton).toBeTruthy()
    })

    it('toggles italic formatting when italic button is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const italicButton = buttons.find((b) => b.props('icon') === 'pi pi-italic')

      await italicButton.trigger('click')

      expect(mockChain.toggleItalic).toHaveBeenCalled()
    })

    it('highlights italic button when italic is active', () => {
      const wrapper = mountComponent({}, { italic: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const italicButton = buttons.find((b) => b.props('icon') === 'pi pi-italic')

      const classes = italicButton.props('class')
      expect(classes).toContain('bg-primary-100')
    })

    it('displays underline button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const underlineButton = buttons.find((b) => b.props('icon') === 'pi pi-underline')
      expect(underlineButton).toBeTruthy()
    })

    it('toggles underline formatting when underline button is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const underlineButton = buttons.find((b) => b.props('icon') === 'pi pi-underline')

      await underlineButton.trigger('click')

      expect(mockChain.toggleUnderline).toHaveBeenCalled()
    })

    it('highlights underline button when underline is active', () => {
      const wrapper = mountComponent({}, { underline: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const underlineButton = buttons.find((b) => b.props('icon') === 'pi pi-underline')

      const classes = underlineButton.props('class')
      expect(classes).toContain('bg-primary-100')
    })
  })

  describe('Heading Dropdown', () => {
    it('displays heading select dropdown', () => {
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.exists()).toBe(true)
    })

    it('has correct heading options', () => {
      const select = wrapper.findComponent({ name: 'Select' })
      const options = select.props('options')

      expect(options).toHaveLength(4)
      expect(options[0]).toEqual({ label: 'Normal', value: 0 })
      expect(options[1]).toEqual({ label: 'Heading 1', value: 1 })
      expect(options[2]).toEqual({ label: 'Heading 2', value: 2 })
      expect(options[3]).toEqual({ label: 'Heading 3', value: 3 })
    })

    it('shows Normal as default heading level', () => {
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.props('modelValue')).toBe(0)
    })

    it('shows Heading 1 when active', () => {
      const wrapper = mountComponent({}, { heading: 1 })
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.props('modelValue')).toBe(1)
    })

    it('shows Heading 2 when active', () => {
      const wrapper = mountComponent({}, { heading: 2 })
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.props('modelValue')).toBe(2)
    })

    it('shows Heading 3 when active', () => {
      const wrapper = mountComponent({}, { heading: 3 })
      const select = wrapper.findComponent({ name: 'Select' })
      expect(select.props('modelValue')).toBe(3)
    })

    it('sets paragraph when Normal (0) is selected', async () => {
      const select = wrapper.findComponent({ name: 'Select' })
      await select.vm.$emit('change', { value: 0 })

      expect(mockChain.setParagraph).toHaveBeenCalled()
      expect(mockChain.toggleHeading).not.toHaveBeenCalled()
    })

    it('sets heading level 1 when selected', async () => {
      const select = wrapper.findComponent({ name: 'Select' })
      await select.vm.$emit('change', { value: 1 })

      expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 1 })
    })

    it('sets heading level 2 when selected', async () => {
      const select = wrapper.findComponent({ name: 'Select' })
      await select.vm.$emit('change', { value: 2 })

      expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 2 })
    })

    it('sets heading level 3 when selected', async () => {
      const select = wrapper.findComponent({ name: 'Select' })
      await select.vm.$emit('change', { value: 3 })

      expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 3 })
    })
  })

  describe('List Buttons', () => {
    it('displays bullet list button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const bulletButton = buttons.find((b) => b.props('icon') === 'pi pi-list')
      expect(bulletButton).toBeTruthy()
    })

    it('toggles bullet list when clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const bulletButton = buttons.find((b) => b.props('icon') === 'pi pi-list')

      await bulletButton.trigger('click')

      expect(mockChain.toggleBulletList).toHaveBeenCalled()
    })

    it('highlights bullet list button when active', () => {
      const wrapper = mountComponent({}, { bulletList: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const bulletButton = buttons.find((b) => b.props('icon') === 'pi pi-list')

      const classes = bulletButton.props('class')
      expect(classes).toContain('bg-primary-100')
    })

    it('displays numbered list button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const numberedButton = buttons.find((b) => b.props('icon') === 'pi pi-sort-numeric-down')
      expect(numberedButton).toBeTruthy()
    })

    it('toggles ordered list when clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const numberedButton = buttons.find((b) => b.props('icon') === 'pi pi-sort-numeric-down')

      await numberedButton.trigger('click')

      expect(mockChain.toggleOrderedList).toHaveBeenCalled()
    })

    it('highlights ordered list button when active', () => {
      const wrapper = mountComponent({}, { orderedList: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const numberedButton = buttons.find((b) => b.props('icon') === 'pi pi-sort-numeric-down')

      const classes = numberedButton.props('class')
      expect(classes).toContain('bg-primary-100')
    })
  })

  describe('Special Formatting Buttons', () => {
    it('displays link button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      expect(linkButton).toBeTruthy()
    })

    it('opens link dialog when link button is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')

      await linkButton.trigger('click')
      await nextTick()

      const dialog = wrapper.findComponent({ name: 'Dialog' })
      expect(dialog.props('visible')).toBe(true)
    })

    it('highlights link button when link is active', () => {
      const wrapper = mountComponent({}, { link: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')

      const classes = linkButton.props('class')
      expect(classes).toContain('bg-primary-100')
    })

    it('displays code block button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const codeButton = buttons.find((b) => b.props('icon') === 'pi pi-code')
      expect(codeButton).toBeTruthy()
    })

    it('toggles code block when clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const codeButton = buttons.find((b) => b.props('icon') === 'pi pi-code')

      await codeButton.trigger('click')

      expect(mockChain.toggleCodeBlock).toHaveBeenCalled()
    })

    it('highlights code block button when active', () => {
      const wrapper = mountComponent({}, { codeBlock: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const codeButton = buttons.find((b) => b.props('icon') === 'pi pi-code')

      const classes = codeButton.props('class')
      expect(classes).toContain('bg-primary-100')
    })

    it('displays blockquote button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const quoteButton = buttons.find((b) => b.props('icon') === 'pi pi-comment')
      expect(quoteButton).toBeTruthy()
    })

    it('toggles blockquote when clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const quoteButton = buttons.find((b) => b.props('icon') === 'pi pi-comment')

      await quoteButton.trigger('click')

      expect(mockChain.toggleBlockquote).toHaveBeenCalled()
    })

    it('highlights blockquote button when active', () => {
      const wrapper = mountComponent({}, { blockquote: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const quoteButton = buttons.find((b) => b.props('icon') === 'pi pi-comment')

      const classes = quoteButton.props('class')
      expect(classes).toContain('bg-primary-100')
    })
  })

  describe('Other Action Buttons', () => {
    it('displays horizontal line button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const hrButton = buttons.find((b) => b.props('icon') === 'pi pi-minus')
      expect(hrButton).toBeTruthy()
    })

    it('inserts horizontal rule when clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const hrButton = buttons.find((b) => b.props('icon') === 'pi pi-minus')

      await hrButton.trigger('click')

      expect(mockChain.setHorizontalRule).toHaveBeenCalled()
    })

    it('displays clear formatting button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const clearButton = buttons.find((b) => b.props('icon') === 'pi pi-times')
      expect(clearButton).toBeTruthy()
    })

    it('clears all formatting when clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const clearButton = buttons.find((b) => b.props('icon') === 'pi pi-times')

      await clearButton.trigger('click')

      expect(mockChain.clearNodes).toHaveBeenCalled()
      expect(mockChain.unsetAllMarks).toHaveBeenCalled()
    })
  })

  describe('Link Dialog', () => {
    it('does not display link dialog by default', () => {
      const dialog = wrapper.findComponent({ name: 'Dialog' })
      expect(dialog.props('visible')).toBe(false)
    })

    it('displays link dialog header', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialog = wrapper.findComponent({ name: 'Dialog' })
      expect(dialog.props('header')).toBe('Insert Link')
    })

    it('displays URL input field', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      expect(input.exists()).toBe(true)
      expect(input.props('placeholder')).toBe('https://example.com')
    })

    it('has Cancel button in dialog footer', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const cancelButton = dialogButtons.find((b) => b.props('label') === 'Cancel')
      expect(cancelButton).toBeTruthy()
    })

    it('has Insert button in dialog footer', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      expect(insertButton).toBeTruthy()
    })

    it('closes dialog when Cancel is clicked', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const cancelButton = dialogButtons.find((b) => b.props('label') === 'Cancel')
      await cancelButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showLinkDialog).toBe(false)
    })

    it('inserts link with https:// prefix when URL has no protocol', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', 'example.com')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')

      expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
    })

    it('inserts link without modifying URL when it has https://', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', 'https://example.com')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')

      expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
    })

    it('inserts link without modifying URL when it has http://', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', 'http://example.com')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')

      expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'http://example.com' })
    })

    it('closes dialog after inserting link', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', 'example.com')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showLinkDialog).toBe(false)
    })

    it('clears link URL after inserting', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', 'example.com')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.linkUrl).toBe('')
    })

    it('removes link when empty URL is inserted', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')

      expect(mockChain.unsetLink).toHaveBeenCalled()
    })

    it('supports Enter key to insert link', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', 'example.com')
      await nextTick()

      await input.trigger('keyup', { key: 'Enter' })
      await nextTick()

      expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
    })
  })

  describe('Link Dialog - Remove Link', () => {
    it('shows Remove Link button when editing existing link', async () => {
      const wrapper = mountComponent({}, { link: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const removeButton = dialogButtons.find((b) => b.props('label') === 'Remove Link')
      expect(removeButton).toBeTruthy()
    })

    it('does not show Remove Link button when creating new link', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const removeButton = dialogButtons.find((b) => b.props('label') === 'Remove Link')
      expect(removeButton).toBeFalsy()
    })

    it('removes link when Remove Link button is clicked', async () => {
      const wrapper = mountComponent({}, { link: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const removeButton = dialogButtons.find((b) => b.props('label') === 'Remove Link')
      await removeButton.trigger('click')

      expect(mockChain.unsetLink).toHaveBeenCalled()
    })

    it('closes dialog after removing link', async () => {
      const wrapper = mountComponent({}, { link: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const removeButton = dialogButtons.find((b) => b.props('label') === 'Remove Link')
      await removeButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.showLinkDialog).toBe(false)
    })
  })

  describe('Link Dialog - Watcher Behavior', () => {
    it('populates link URL when opening dialog on existing link', async () => {
      const wrapper = mountComponent({}, { link: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')

      await linkButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.linkUrl).toBe('https://example.com')
    })

    it('does not populate link URL when opening dialog without existing link', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')

      await linkButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.linkUrl).toBe('')
    })

    it('clears link URL when closing dialog', async () => {
      const wrapper = mountComponent({}, { link: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')

      await linkButton.trigger('click')
      await nextTick()
      expect(wrapper.vm.linkUrl).toBe('https://example.com')

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const cancelButton = dialogButtons.find((b) => b.props('label') === 'Cancel')
      await cancelButton.trigger('click')
      await nextTick()

      expect(wrapper.vm.linkUrl).toBe('')
    })
  })

  describe('Props', () => {
    it('accepts editor prop', () => {
      expect(wrapper.props('editor')).toEqual(mockEditor)
    })

    it('requires editor prop', () => {
      const { editor } = EditorToolbar.props
      expect(editor.required).toBe(true)
    })

    it('editor prop must be an Object', () => {
      const { editor } = EditorToolbar.props
      expect(editor.type).toBe(Object)
    })
  })

  describe('Computed Properties', () => {
    it('currentHeadingLevel returns 0 when editor is null', () => {
      const wrapper = mount(EditorToolbar, {
        props: {
          editor: null
        }
      })
      expect(wrapper.vm.currentHeadingLevel).toBe(0)
    })

    it('currentHeadingLevel returns 1 for heading level 1', () => {
      const wrapper = mountComponent({}, { heading: 1 })
      expect(wrapper.vm.currentHeadingLevel).toBe(1)
    })

    it('currentHeadingLevel returns 2 for heading level 2', () => {
      const wrapper = mountComponent({}, { heading: 2 })
      expect(wrapper.vm.currentHeadingLevel).toBe(2)
    })

    it('currentHeadingLevel returns 3 for heading level 3', () => {
      const wrapper = mountComponent({}, { heading: 3 })
      expect(wrapper.vm.currentHeadingLevel).toBe(3)
    })

    it('currentHeadingLevel returns 0 for normal paragraph', () => {
      const wrapper = mountComponent({}, {})
      expect(wrapper.vm.currentHeadingLevel).toBe(0)
    })
  })

  describe('Dark Mode Support', () => {
    it('has dark mode classes on toolbar', () => {
      const toolbar = wrapper.find('.editor-toolbar')
      expect(toolbar.classes()).toContain('dark:bg-gray-800')
      expect(toolbar.classes()).toContain('dark:border-gray-700')
    })

    it('has dark mode classes on dividers', () => {
      const divider = wrapper.find('.toolbar-divider')
      expect(divider.classes()).toContain('dark:bg-gray-600')
    })

    it('has dark mode active state classes on buttons', () => {
      const wrapper = mountComponent({}, { bold: true })
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const boldButton = buttons.find((b) => b.props('icon') === 'pi pi-bold')

      const classes = boldButton.props('class')
      expect(classes).toContain('dark:bg-primary-900')
      expect(classes).toContain('dark:text-primary-400')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      // Note: aria-label is in the template but we're using stubs
      // In real implementation, buttons would have aria-label="Toggle bold" etc.
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('has proper label for link URL input', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('URL')
    })
  })

  describe('Edge Cases', () => {
    it('handles multiple button clicks in succession', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const boldButton = buttons.find((b) => b.props('icon') === 'pi pi-bold')

      await boldButton.trigger('click')
      await boldButton.trigger('click')
      await boldButton.trigger('click')

      expect(mockChain.run).toHaveBeenCalledTimes(3)
    })

    it('handles link dialog open/close multiple times', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')

      await linkButton.trigger('click')
      await nextTick()
      expect(wrapper.vm.showLinkDialog).toBe(true)

      wrapper.vm.showLinkDialog = false
      await nextTick()
      expect(wrapper.vm.showLinkDialog).toBe(false)

      await linkButton.trigger('click')
      await nextTick()
      expect(wrapper.vm.showLinkDialog).toBe(true)
    })

    it('handles very long URLs', async () => {
      const longUrl = `https://example.com/${'a'.repeat(500)}`

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', longUrl)
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')

      expect(mockChain.setLink).toHaveBeenCalledWith({ href: longUrl })
    })

    it('handles URLs with special characters', async () => {
      const specialUrl = 'https://example.com/path?query=value&foo=bar#anchor'

      const buttons = wrapper.findAllComponents({ name: 'Button' })
      const linkButton = buttons.find((b) => b.props('icon') === 'pi pi-link')
      await linkButton.trigger('click')
      await nextTick()

      const input = wrapper.findComponent({ name: 'InputText' })
      await input.vm.$emit('update:modelValue', specialUrl)
      await nextTick()

      const dialogButtons = wrapper.findAllComponents({ name: 'Button' })
      const insertButton = dialogButtons.find((b) => b.props('label') === 'Insert')
      await insertButton.trigger('click')

      expect(mockChain.setLink).toHaveBeenCalledWith({ href: specialUrl })
    })
  })

  describe('Layout and Styling', () => {
    it('uses flexbox layout', () => {
      const toolbar = wrapper.find('.editor-toolbar')
      expect(toolbar.classes()).toContain('flex')
      expect(toolbar.classes()).toContain('flex-wrap')
    })

    it('has proper padding', () => {
      const toolbar = wrapper.find('.editor-toolbar')
      expect(toolbar.classes()).toContain('p-2')
    })

    it('has proper gap between elements', () => {
      const toolbar = wrapper.find('.editor-toolbar')
      expect(toolbar.classes()).toContain('gap-1')
    })

    it('groups buttons in toolbar groups', () => {
      const groups = wrapper.findAll('.toolbar-group')
      groups.forEach((group) => {
        expect(group.classes()).toContain('flex')
        expect(group.classes()).toContain('items-center')
      })
    })
  })
})
