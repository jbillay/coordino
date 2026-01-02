<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ColorPicker from 'primevue/colorpicker'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useTaskStore } from '../store'
import { useToast } from 'primevue/usetoast'
import { generateRandomColor } from '../utils'
import { validateHexColor } from '@/utils/validation'

/**
 * CategoryManager Component
 * Manage task categories
 *
 * @component
 */

defineProps({
  /**
   * Dialog visibility
   */
  visible: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:visible'])

const taskStore = useTaskStore()
const toast = useToast()

const adding = ref(false)
const deleting = ref(null)
const showDeleteConfirm = ref(false)
const categoryToDelete = ref(null)
const errors = ref({})

const newCategory = ref({
  name: '',
  color: generateRandomColor().replace('#', '')
})

/**
 * Add new category
 */
const handleAddCategory = async () => {
  // Clear previous errors
  errors.value = {}

  // Basic validation
  if (!newCategory.value.name) {
    errors.value.name = 'Category name is required'
    return
  }

  if (!newCategory.value.color) {
    errors.value.color = 'Color is required'
    return
  }

  // Validate color format (US8: Comprehensive Error Handling - FR-048)
  const colorToValidate = `#${newCategory.value.color}`
  const colorValidation = validateHexColor(colorToValidate)

  if (!colorValidation.valid) {
    errors.value.color = colorValidation.error
    return
  }

  adding.value = true

  const result = await taskStore.createCategory({
    name: newCategory.value.name.trim(),
    color: colorToValidate,
    display_order: taskStore.categories.length + 1
  })

  adding.value = false

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Category Created',
      detail: `"${newCategory.value.name}" has been added`,
      life: 3000
    })

    // Reset form
    newCategory.value = {
      name: '',
      color: generateRandomColor().replace('#', '')
    }
    errors.value = {}
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to create category',
      life: 5000
    })
  }
}

/**
 * Clear validation error for a field
 */
const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

/**
 * Delete category - show confirmation dialog
 */
const handleDeleteCategory = (category) => {
  categoryToDelete.value = category
  showDeleteConfirm.value = true
}

/**
 * Confirm delete category - actually perform deletion
 */
const confirmDelete = async () => {
  if (!categoryToDelete.value) {
    return
  }

  const category = categoryToDelete.value
  deleting.value = category.id

  const result = await taskStore.deleteCategory(category.id)

  deleting.value = null
  showDeleteConfirm.value = false

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Category Deleted',
      detail: `"${category.name}" has been removed`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to delete category',
      life: 5000
    })
  }

  categoryToDelete.value = null
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '700px' }"
    :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <h3 class="text-xl font-semibold">Manage Categories</h3>
    </template>

    <div class="space-y-4">
      <!-- Add new category form -->
      <Card>
        <template #title>
          <h4 class="text-lg font-medium">Add New Category</h4>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <InputText
                v-model="newCategory.name"
                placeholder="Category name"
                class="w-full"
                :class="{ 'p-invalid': errors.name }"
                @input="clearError('name')"
                @keyup.enter="handleAddCategory"
              />
              <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
            </div>
            <div>
              <ColorPicker
                v-model="newCategory.color"
                format="hex"
                class="w-full"
                :class="{ 'p-invalid': errors.color }"
                @update:model-value="clearError('color')"
              />
              <small v-if="errors.color" class="p-error">{{ errors.color }}</small>
            </div>
            <div>
              <Button
                label="Add Category"
                icon="pi pi-plus"
                class="w-full"
                :loading="adding"
                :disabled="!newCategory.name || !newCategory.color"
                @click="handleAddCategory"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Category list -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Categories</h4>

        <div v-if="taskStore.categories.length > 0" class="space-y-2">
          <div
            v-for="category in taskStore.categories"
            :key="category.id"
            class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
          >
            <div class="flex items-center gap-3 flex-1">
              <span
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: category.color }"
              ></span>
              <span class="font-medium">{{ category.name }}</span>
            </div>

            <div class="flex items-center gap-2">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-sm p-button-danger"
                :loading="deleting === category.id"
                aria-label="Delete category"
                @click="handleDeleteCategory(category)"
              />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="pi pi-folder-open text-2xl mb-2"></i>
          <p class="text-sm">No categories yet. Add your first one above!</p>
          <p class="text-xs mt-1">
            Categories help you organize tasks by project, context, or any way you prefer
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button
          label="Close"
          icon="pi pi-times"
          class="p-button-text"
          @click="$emit('update:visible', false)"
        />
      </div>
    </template>
  </Dialog>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog
    v-model:visible="showDeleteConfirm"
    header="Delete Category"
    :message="`Are you sure you want to delete the category &quot;${categoryToDelete?.name}&quot;? Tasks in this category will not be deleted.`"
    severity="danger"
    confirm-label="Delete"
    confirm-icon="pi pi-trash"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
:deep(.p-colorpicker-preview) {
  width: 100%;
  height: 40px;
}
</style>
