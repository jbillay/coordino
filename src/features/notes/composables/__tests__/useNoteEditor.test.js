import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { useNoteEditor } from '../useNoteEditor'
import { ref } from 'vue'

// Stable mock for the editor chain
const run = vi.fn()
const toggleBold = vi.fn(() => ({ run }))
const toggleItalic = vi.fn(() => ({ run }))
const toggleUnderline = vi.fn(() => ({ run }))
const toggleBulletList = vi.fn(() => ({ run }))
const toggleOrderedList = vi.fn(() => ({ run }))
const toggleBlockquote = vi.fn(() => ({ run }))
const toggleCodeBlock = vi.fn(() => ({ run }))
const setHeading = vi.fn(() => ({ run }))
const setLink = vi.fn(() => ({ run }))
const extendMarkRange = vi.fn(() => ({ setLink }))
const insertHorizontalRule = vi.fn(() => ({ run }))
const unsetAllMarks = vi.fn(() => ({ run }))
const clearNodes = vi.fn(() => ({ unsetAllMarks }))
const setParagraph = vi.fn(() => ({ run }))
const toggleHeading = vi.fn(() => ({ run }))

const setHorizontalRule = vi.fn(() => ({ run }))

const focus = vi.fn(() => ({
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleBulletList,
  toggleOrderedList,
  toggleBlockquote,
  toggleCodeBlock,
  setHeading,
  extendMarkRange,
  insertHorizontalRule,
  clearNodes,
  setParagraph,
  toggleHeading,
  setHorizontalRule,
  run
}))
const chain = vi.fn(() => ({ focus }))

const mockEditor = {
  chain,
  destroy: vi.fn()
}

vi.mock('@tiptap/vue-3', () => ({
  useEditor: vi.fn(() => ref(mockEditor))
}))

describe('useNoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an editor instance', () => {
    const wrapper = mount({
      setup() {
        return useNoteEditor({ content: '<p>Hello</p>' })
      },
      template: '<div></div>'
    })
    expect(wrapper.vm.editor).toBeDefined()
  })

  const formatTests = [
    { name: 'toggleBold', mock: toggleBold },
    { name: 'toggleItalic', mock: toggleItalic },
    { name: 'toggleUnderline', mock: toggleUnderline },
    { name: 'toggleBulletList', mock: toggleBulletList },
    { name: 'toggleOrderedList', mock: toggleOrderedList },
    { name: 'toggleBlockquote', mock: toggleBlockquote },
    { name: 'toggleCodeBlock', mock: toggleCodeBlock },
    { name: 'insertHorizontalRule', mock: insertHorizontalRule }
  ]

  for (const t of formatTests) {
    it(`calls ${t.name} on editor`, async () => {
      const wrapper = mount({
        setup() {
          return useNoteEditor()
        },
        template: '<div></div>'
      })
      wrapper.vm[t.name]()
      expect(chain).toHaveBeenCalled()
      expect(focus).toHaveBeenCalled()
      expect(t.mock).toHaveBeenCalled()
      expect(run).toHaveBeenCalled()
    })
  }

  it('calls setHeading on editor', async () => {
    const wrapper = mount({
      setup() {
        return useNoteEditor()
      },
      template: '<div></div>'
    })
    wrapper.vm.setHeading(1)
    expect(chain).toHaveBeenCalled()
    expect(focus).toHaveBeenCalled()
    expect(toggleHeading).toHaveBeenCalledWith({ level: 1 })
    expect(run).toHaveBeenCalled()
  })

  it('calls setLink on editor', async () => {
    const wrapper = mount({
      setup() {
        return useNoteEditor()
      },
      template: '<div></div>'
    })
    wrapper.vm.setLink('https://example.com')
    expect(chain).toHaveBeenCalled()
    expect(focus).toHaveBeenCalled()
    expect(extendMarkRange).toHaveBeenCalledWith('link')
    expect(setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
    expect(run).toHaveBeenCalled()
  })

  it('calls clearFormatting on editor', async () => {
    const wrapper = mount({
      setup() {
        return useNoteEditor()
      },
      template: '<div></div>'
    })
    wrapper.vm.clearFormatting()
    expect(chain).toHaveBeenCalled()
    expect(focus).toHaveBeenCalled()
    expect(clearNodes).toHaveBeenCalled()
    expect(unsetAllMarks).toHaveBeenCalled()
    expect(run).toHaveBeenCalled()
  })
})
