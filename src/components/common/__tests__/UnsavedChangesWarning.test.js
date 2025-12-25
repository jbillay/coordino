import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UnsavedChangesWarning from '../UnsavedChangesWarning.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

describe('UnsavedChangesWarning.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(UnsavedChangesWarning, {
      props: {
        show: true
      },
      global: {
        components: {
          Dialog,
          Button
        },
        stubs: {
          teleport: true
        }
      },
      attachTo: document.body
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Structure', () => {
    it('should render without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should render Dialog component', () => {
      expect(wrapper.findComponent(Dialog).exists()).toBe(true)
    })

    it('should render three buttons', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(3)
    })
  })

  describe('Props', () => {
    it('should accept show prop', () => {
      wrapper.unmount()
      wrapper = mount(UnsavedChangesWarning, {
        props: {
          show: true
        },
        global: {
          components: { Dialog, Button },
          stubs: { teleport: true }
        },
        attachTo: document.body
      })
      expect(wrapper.props('show')).toBe(true)
    })

    it('should accept message prop', async () => {
      const customMessage = 'Custom unsaved changes message'
      wrapper.unmount()
      wrapper = mount(UnsavedChangesWarning, {
        props: {
          show: true,
          message: customMessage
        },
        global: {
          components: { Dialog, Button },
          stubs: { teleport: true }
        },
        attachTo: document.body
      })
      await wrapper.vm.$nextTick()
      expect(wrapper.props('message')).toBe(customMessage)
      expect(wrapper.text()).toContain(customMessage)
    })

    it('should use default message when not provided', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('You have unsaved changes to this meeting.')
    })
  })

  describe('Dialog Visibility', () => {
    it('should show dialog when show prop is true', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.visible).toBe(true)
    })

    it('should hide dialog when show prop is false', async () => {
      await wrapper.setProps({ show: false })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.visible).toBe(false)
    })

    it('should update visible when show prop changes', async () => {
      wrapper.unmount()
      wrapper = mount(UnsavedChangesWarning, {
        props: {
          show: false
        },
        global: {
          components: { Dialog, Button },
          stubs: { teleport: true }
        },
        attachTo: document.body
      })
      expect(wrapper.vm.visible).toBe(false)

      await wrapper.setProps({ show: true })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.visible).toBe(true)
    })
  })

  describe('Events', () => {
    it('should emit save event when Save Changes button is clicked', async () => {
      await wrapper.vm.handleSave()

      expect(wrapper.emitted('save')).toBeTruthy()
      expect(wrapper.emitted('save').length).toBe(1)
      expect(wrapper.vm.visible).toBe(false)
    })

    it('should emit discard event when Discard Changes button is clicked', async () => {
      await wrapper.vm.handleDiscard()

      expect(wrapper.emitted('discard')).toBeTruthy()
      expect(wrapper.emitted('discard').length).toBe(1)
      expect(wrapper.vm.visible).toBe(false)
    })

    it('should emit cancel event when Cancel button is clicked', async () => {
      await wrapper.vm.handleCancel()

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel').length).toBeGreaterThanOrEqual(1)
      expect(wrapper.vm.visible).toBe(false)
    })

    it('should emit cancel event when dialog is closed', async () => {
      wrapper.vm.visible = false
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('Button Labels', () => {
    it('should have correct button labels', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('button')
      expect(buttons[0].text()).toContain('Discard Changes')
      expect(buttons[1].text()).toContain('Save Changes')
      expect(buttons[2].text()).toContain('Cancel')
    })

    it('should have correct button severities', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAllComponents(Button)
      expect(buttons[0].props('severity')).toBe('secondary')
      expect(buttons[1].props('severity')).toBe('primary')
      expect(buttons[2].props('severity')).toBe('secondary')
    })
  })

  describe('Dialog Configuration', () => {
    it('should configure dialog as modal', () => {
      const dialog = wrapper.findComponent(Dialog)
      expect(dialog.props('modal')).toBe(true)
    })

    it('should disable dialog close button', () => {
      const dialog = wrapper.findComponent(Dialog)
      expect(dialog.props('closable')).toBe(false)
    })

    it('should disable dialog dragging', () => {
      const dialog = wrapper.findComponent(Dialog)
      expect(dialog.props('draggable')).toBe(false)
    })

    it('should have correct dialog header', () => {
      const dialog = wrapper.findComponent(Dialog)
      expect(dialog.props('header')).toBe('Unsaved Changes')
    })
  })

  describe('Warning Message', () => {
    it('should display warning icon', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.html()).toContain('pi-exclamation-triangle')
    })

    it('should display warning about data loss', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('If you leave without saving, your changes will be lost.')
    })
  })
})
