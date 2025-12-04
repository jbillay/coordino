import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useNoteKeyboardShortcuts } from '../useNoteKeyboardShortcuts'

describe('useNoteKeyboardShortcuts', () => {
  let onNewNote, onSearch, onSave, onClose, onTogglePin, onDelete
  let wrapper

  beforeEach(() => {
    onNewNote = vi.fn()
    onSearch = vi.fn()
    onSave = vi.fn()
    onClose = vi.fn()
    onTogglePin = vi.fn()
    onDelete = vi.fn()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const mountWithShortcut = (props) => {
    wrapper = mount({
      setup() {
        useNoteKeyboardShortcuts(props)
      },
      template: '<div></div>'
    })
  }

  it('should call onNewNote on Ctrl+N', () => {
    mountWithShortcut({ onNewNote })
    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
    Object.defineProperty(event, 'target', { value: document.body, writable: false })
    window.dispatchEvent(event)
    expect(onNewNote).toHaveBeenCalled()
  })

  it('should call onSearch on Ctrl+K', () => {
    mountWithShortcut({ onSearch })
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
    Object.defineProperty(event, 'target', { value: document.body, writable: false })
    window.dispatchEvent(event)
    expect(onSearch).toHaveBeenCalled()
  })

  it('should call onSave on Ctrl+S', () => {
    mountWithShortcut({ onSave })
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    Object.defineProperty(event, 'target', { value: document.body, writable: false })
    window.dispatchEvent(event)
    expect(onSave).toHaveBeenCalled()
  })

  it('should call onClose on Escape', () => {
    mountWithShortcut({ onClose })
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    Object.defineProperty(event, 'target', { value: document.body, writable: false })
    window.dispatchEvent(event)
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onTogglePin on Ctrl+P', () => {
    mountWithShortcut({ onTogglePin })
    const event = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true })
    Object.defineProperty(event, 'target', { value: document.body, writable: false })
    window.dispatchEvent(event)
    expect(onTogglePin).toHaveBeenCalled()
  })

  it('should call onDelete on Ctrl+Delete', () => {
    mountWithShortcut({ onDelete })
    const event = new KeyboardEvent('keydown', { key: 'Delete', ctrlKey: true })
    Object.defineProperty(event, 'target', { value: document.body, writable: false })
    window.dispatchEvent(event)
    expect(onDelete).toHaveBeenCalled()
  })
})
