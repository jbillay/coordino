<script setup>
import { ref, computed, watch } from 'vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'

const props = defineProps({
  editor: {
    type: Object,
    required: true
  }
})

const showLinkDialog = ref(false)
const linkUrl = ref('')

const headingOptions = [
  { label: 'Normal', value: 0 },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 }
]

const currentHeadingLevel = computed(() => {
  if (!props.editor) {
    return 0
  }
  if (props.editor.isActive('heading', { level: 1 })) {
    return 1
  }
  if (props.editor.isActive('heading', { level: 2 })) {
    return 2
  }
  if (props.editor.isActive('heading', { level: 3 })) {
    return 3
  }
  return 0
})

const setHeading = (level) => {
  if (level === 0) {
    props.editor.chain().focus().setParagraph().run()
  } else {
    props.editor.chain().focus().toggleHeading({ level }).run()
  }
}

const insertLink = () => {
  if (!linkUrl.value) {
    removeLink()
    return
  }

  // Add https:// if no protocol
  const url = linkUrl.value.match(/^https?:\/\//) ? linkUrl.value : `https://${linkUrl.value}`

  props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()

  showLinkDialog.value = false
  linkUrl.value = ''
}

const removeLink = () => {
  props.editor.chain().focus().unsetLink().run()
  showLinkDialog.value = false
  linkUrl.value = ''
}

// Populate link URL when opening dialog on existing link
watch(showLinkDialog, (isVisible) => {
  if (isVisible && props.editor.isActive('link')) {
    linkUrl.value = props.editor.getAttributes('link').href || ''
  } else if (!isVisible) {
    linkUrl.value = ''
  }
})
</script>

<template>
  <div
    v-if="editor"
    class="editor-toolbar flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
  >
    <!-- Text Formatting Group -->
    <div class="toolbar-group flex items-center gap-1">
      <Button
        v-tooltip.bottom="'Bold (Ctrl+B)'"
        icon="pi pi-bold"
        aria-label="Toggle bold"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('bold')
        }"
        @click="editor.chain().focus().toggleBold().run()"
      />
      <Button
        v-tooltip.bottom="'Italic (Ctrl+I)'"
        icon="pi pi-italic"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('italic')
        }"
        @click="editor.chain().focus().toggleItalic().run()"
      />
      <Button
        v-tooltip.bottom="'Underline (Ctrl+U)'"
        icon="pi pi-underline"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('underline')
        }"
        @click="editor.chain().focus().toggleUnderline().run()"
      />
    </div>

    <div class="toolbar-divider w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

    <!-- Heading Group -->
    <div class="toolbar-group flex items-center gap-1">
      <Select
        :model-value="currentHeadingLevel"
        :options="headingOptions"
        option-label="label"
        option-value="value"
        placeholder="Normal"
        class="w-32"
        @change="setHeading($event.value)"
      />
    </div>

    <div class="toolbar-divider w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

    <!-- List Group -->
    <div class="toolbar-group flex items-center gap-1">
      <Button
        v-tooltip.bottom="'Bullet List'"
        icon="pi pi-list"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('bulletList')
        }"
        @click="editor.chain().focus().toggleBulletList().run()"
      />
      <Button
        v-tooltip.bottom="'Numbered List'"
        icon="pi pi-sort-numeric-down"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('orderedList')
        }"
        @click="editor.chain().focus().toggleOrderedList().run()"
      />
    </div>

    <div class="toolbar-divider w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

    <!-- Special Formatting Group -->
    <div class="toolbar-group flex items-center gap-1">
      <Button
        v-tooltip.bottom="'Insert Link'"
        icon="pi pi-link"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('link')
        }"
        @click="showLinkDialog = true"
      />
      <Button
        v-tooltip.bottom="'Code Block'"
        icon="pi pi-code"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('codeBlock')
        }"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      />
      <Button
        v-tooltip.bottom="'Quote'"
        icon="pi pi-comment"
        class="p-button-text p-button-sm"
        :class="{
          'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400':
            editor.isActive('blockquote')
        }"
        @click="editor.chain().focus().toggleBlockquote().run()"
      />
    </div>

    <div class="toolbar-divider w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

    <!-- Other Actions -->
    <div class="toolbar-group flex items-center gap-1">
      <Button
        v-tooltip.bottom="'Horizontal Line'"
        icon="pi pi-minus"
        class="p-button-text p-button-sm"
        @click="editor.chain().focus().setHorizontalRule().run()"
      />
      <Button
        v-tooltip.bottom="'Clear Formatting'"
        icon="pi pi-times"
        class="p-button-text p-button-sm"
        @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
      />
    </div>

    <!-- Link Dialog -->
    <Dialog
      v-model:visible="showLinkDialog"
      header="Insert Link"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="space-y-4">
        <div>
          <label for="link-url" class="block text-sm font-medium mb-2">URL</label>
          <InputText
            id="link-url"
            v-model="linkUrl"
            class="w-full"
            placeholder="https://example.com"
            @keyup.enter="insertLink"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-text"
          @click="showLinkDialog = false"
        />
        <Button
          v-if="editor.isActive('link')"
          label="Remove Link"
          icon="pi pi-trash"
          class="p-button-text p-button-danger"
          @click="removeLink"
        />
        <Button label="Insert" icon="pi pi-check" @click="insertLink" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.toolbar-group {
  padding: 0 0.25rem;
}

.toolbar-divider {
  margin: 0 0.25rem;
}

/* Mobile: Ensure minimum touch target size (44x44px) */
@media (max-width: 768px) {
  .toolbar-group :deep(button) {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
