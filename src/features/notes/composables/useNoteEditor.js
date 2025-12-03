import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { onBeforeUnmount } from 'vue'

/**
 * Composable for managing Tiptap editor instance
 * @param {Object} options - Editor configuration options
 * @param {string} options.content - Initial HTML content
 * @param {string} options.placeholder - Placeholder text
 * @param {Function} options.onUpdate - Callback when content changes
 * @param {boolean} options.editable - Whether editor is editable
 * @returns {Object} Editor instance and helper methods
 */
export function useNoteEditor(options = {}) {
  const {
    content = '',
    placeholder = 'Start writing your note...',
    onUpdate = null,
    editable = true
  } = options

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      Underline
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3'
      }
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML())
      }
    }
  })

  // Helper methods for formatting
  const toggleBold = () => {
    editor.value?.chain().focus().toggleBold().run()
  }

  const toggleItalic = () => {
    editor.value?.chain().focus().toggleItalic().run()
  }

  const toggleUnderline = () => {
    editor.value?.chain().focus().toggleUnderline().run()
  }

  const toggleBulletList = () => {
    editor.value?.chain().focus().toggleBulletList().run()
  }

  const toggleOrderedList = () => {
    editor.value?.chain().focus().toggleOrderedList().run()
  }

  const toggleBlockquote = () => {
    editor.value?.chain().focus().toggleBlockquote().run()
  }

  const toggleCodeBlock = () => {
    editor.value?.chain().focus().toggleCodeBlock().run()
  }

  const setHeading = (level) => {
    if (level === 0) {
      editor.value?.chain().focus().setParagraph().run()
    } else {
      editor.value?.chain().focus().toggleHeading({ level }).run()
    }
  }

  const setLink = (url) => {
    if (!url) {
      editor.value?.chain().focus().unsetLink().run()
      return
    }

    // Add https:// if no protocol specified
    const href = url.match(/^https?:\/\//) ? url : `https://${url}`

    editor.value?.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }

  const insertHorizontalRule = () => {
    editor.value?.chain().focus().setHorizontalRule().run()
  }

  const clearFormatting = () => {
    editor.value?.chain().focus().clearNodes().unsetAllMarks().run()
  }

  const getContent = () => editor.value?.getHTML() || ''

  const setContent = (newContent) => {
    editor.value?.commands.setContent(newContent)
  }

  const focus = () => {
    editor.value?.commands.focus()
  }

  const blur = () => {
    editor.value?.commands.blur()
  }

  const isEmpty = () => editor.value?.isEmpty ?? true

  const getWordCount = () => {
    const text = editor.value?.getText() || ''
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    return words.length
  }

  const getCharacterCount = () => editor.value?.getText().length || 0

  // Check if specific format is active
  const isActive = (name, attrs = {}) => editor.value?.isActive(name, attrs) ?? false

  // Cleanup on unmount
  onBeforeUnmount(() => {
    editor.value?.destroy()
  })

  return {
    editor,
    // Formatting methods
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleBulletList,
    toggleOrderedList,
    toggleBlockquote,
    toggleCodeBlock,
    setHeading,
    setLink,
    insertHorizontalRule,
    clearFormatting,
    // Content methods
    getContent,
    setContent,
    focus,
    blur,
    isEmpty,
    // Stats methods
    getWordCount,
    getCharacterCount,
    // State check
    isActive
  }
}
