import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../ConfirmDialog.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

describe('ConfirmDialog', () => {
  const defaultProps = {
    visible: true,
    message: 'Are you sure?'
  }

  const stubs = {
    Dialog: {
      template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
      emits: ['update:visible']
    },
    Button: {
      template: '<button @click="$emit(\'click\')">{{ label }}</button>',
      props: ['label', 'icon', 'class', 'loading', 'aria-label', 'autofocus']
    }
  }

  it('renders header, message, and buttons', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        ...defaultProps,
        header: 'Test Header',
        confirmLabel: 'Yes',
        cancelLabel: 'No'
      },
      global: {
        stubs
      }
    })

    expect(wrapper.text()).toContain('Test Header')
    expect(wrapper.text()).toContain('Are you sure?')
    expect(wrapper.text()).toContain('Yes')
    expect(wrapper.text()).toContain('No')
  })

  it('applies correct classes and icons for severity', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        ...defaultProps,
        severity: 'danger'
      },
      global: {
        stubs
      }
    })

    expect(wrapper.find('i.pi-exclamation-triangle.text-red-500').exists()).toBe(true)
  })

  it('emits confirm event on confirm button click', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...defaultProps, confirmLabel: 'Confirm' },
      global: {
        stubs
      }
    })
    
    await wrapper.findAll('button').filter(b => b.text() === 'Confirm')[0].trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel and update:visible events on cancel button click', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { ...defaultProps, cancelLabel: 'Cancel' },
      global: {
        stubs
      }
    })
    
    await wrapper.findAll('button').filter(b => b.text() === 'Cancel')[0].trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('update:visible')[0]).toEqual([false])
  })

  it('emits cancel and update:visible events when dialog is closed', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: defaultProps,
      global: {
        stubs
      }
    })

    await wrapper.findComponent(stubs.Dialog).vm.$emit('update:visible', false)
    
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('update:visible')[0]).toEqual([false])
  })
})
