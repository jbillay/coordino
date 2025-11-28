<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :draggable="false"
    :style="{ width: '600px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <h3 class="text-xl font-semibold">{{ isEdit ? 'Edit Task' : 'Create New Task' }}</h3>
    </template>

    <div class="space-y-4">
      <!-- Title -->
      <div>
        <label for="task-title" class="block text-sm font-medium mb-2">
          Title
          <span class="text-red-500">*</span>
        </label>
        <InputText
          id="task-title"
          v-model="formData.title"
          class="w-full"
          placeholder="Enter task title"
          :class="{ 'p-invalid': errors.title }"
          aria-describedby="task-title-help"
          :aria-invalid="!!errors.title"
        />
        <small v-if="errors.title" id="task-title-help" class="p-error" role="alert">
          {{ errors.title }}
        </small>
      </div>

      <!-- Description -->
      <div>
        <label for="task-description" class="block text-sm font-medium mb-2">Description</label>
        <Textarea
          id="task-description"
          v-model="formData.description"
          rows="3"
          class="w-full"
          placeholder="Add task details (optional)"
        />
      </div>

      <!-- Status and Priority row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Status -->
        <div>
          <label for="task-status" class="block text-sm font-medium mb-2">
            Status
            <span class="text-red-500">*</span>
          </label>
          <Select
            id="task-status"
            v-model="formData.status_id"
            :options="taskStore.statuses"
            option-label="name"
            option-value="id"
            placeholder="Select status"
            class="w-full"
            :class="{ 'p-invalid': errors.status_id }"
            aria-describedby="task-status-help"
            :aria-invalid="!!errors.status_id"
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: slotProps.option.color }"
                ></span>
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </Select>
          <small v-if="errors.status_id" id="task-status-help" class="p-error" role="alert">
            {{ errors.status_id }}
          </small>
        </div>

        <!-- Priority -->
        <div>
          <label for="task-priority" class="block text-sm font-medium mb-2">Priority</label>
          <Select
            id="task-priority"
            v-model="formData.priority"
            :options="priorityOptions"
            placeholder="Select priority"
            class="w-full"
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 rounded text-xs font-medium" :class="getPriorityClasses(slotProps.option)">
                  {{ slotProps.option.charAt(0).toUpperCase() + slotProps.option.slice(1) }}
                </span>
              </div>
            </template>
          </Select>
        </div>
      </div>

      <!-- Category and Due Date row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Category -->
        <div>
          <label for="task-category" class="block text-sm font-medium mb-2">Category</label>
          <Select
            id="task-category"
            v-model="formData.category_id"
            :options="taskStore.categories"
            option-label="name"
            option-value="id"
            placeholder="Select category (optional)"
            class="w-full"
            show-clear
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: slotProps.option.color }"
                ></span>
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </Select>
        </div>

        <!-- Due Date -->
        <div>
          <label for="task-due-date" class="block text-sm font-medium mb-2">Due Date</label>
          <DatePicker
            id="task-due-date"
            v-model="formData.due_date"
            date-format="mm/dd/yy"
            placeholder="Select date (optional)"
            class="w-full"
            show-icon
            show-button-bar
          />
        </div>
      </div>

      <!-- Owner -->
      <div>
        <label for="task-owner" class="block text-sm font-medium mb-2">Owner</label>
        <InputText
          id="task-owner"
          v-model="formData.owner"
          class="w-full"
          placeholder="Assign to person or team (optional)"
        />
        <small class="text-gray-500 dark:text-gray-400">
          Who is responsible for completing this task
        </small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-text"
          @click="$emit('update:visible', false)"
        />
        <Button
          :label="isEdit ? 'Update Task' : 'Create Task'"
          icon="pi pi-check"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import { useTaskStore } from '../store'
import { PRIORITY_LEVELS, getPriorityClasses } from '../utils'
import { useToast } from 'primevue/usetoast'

/**
 * TaskDialog Component
 * Create or edit task with full form validation
 *
 * @component
 */

const props = defineProps({
  /**
   * Dialog visibility state
   */
  visible: {
    type: Boolean,
    default: false
  },

  /**
   * Task to edit (null for create mode)
   */
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const taskStore = useTaskStore()
const toast = useToast()

const loading = ref(false)
const errors = ref({})

const priorityOptions = PRIORITY_LEVELS

const formData = ref({
  title: '',
  description: '',
  status_id: null,
  category_id: null,
  priority: 'medium',
  owner: '',
  due_date: null
})

/**
 * Check if in edit mode
 */
const isEdit = computed(() => !!props.task)

/**
 * Reset form to default values
 */
const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    status_id: taskStore.defaultStatus?.id || null,
    category_id: null,
    priority: 'medium',
    owner: '',
    due_date: null
  }
  errors.value = {}
}

/**
 * Watch for task changes to populate form
 */
watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      formData.value = {
        title: newTask.title || '',
        description: newTask.description || '',
        status_id: newTask.status_id || null,
        category_id: newTask.category_id || null,
        priority: newTask.priority || 'medium',
        owner: newTask.owner || '',
        due_date: newTask.due_date ? new Date(newTask.due_date) : null
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

/**
 * Watch for dialog visibility to reset form on open
 */
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && !props.task) {
      resetForm()
    }
    if (newVisible) {
      errors.value = {}
    }
  }
)

/**
 * Validate form data
 */
const validateForm = () => {
  errors.value = {}

  if (!formData.value.title || !formData.value.title.trim()) {
    errors.value.title = 'Title is required'
  }

  if (!formData.value.status_id) {
    errors.value.status_id = 'Status is required'
  }

  return Object.keys(errors.value).length === 0
}

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  // Prepare task data
  const taskData = {
    title: formData.value.title.trim(),
    description: formData.value.description?.trim() || null,
    status_id: formData.value.status_id,
    category_id: formData.value.category_id || null,
    priority: formData.value.priority,
    owner: formData.value.owner?.trim() || null,
    due_date: formData.value.due_date ? format(formData.value.due_date, 'yyyy-MM-dd') : null
  }

  let result
  if (isEdit.value) {
    result = await taskStore.updateTask(props.task.id, taskData)
  } else {
    result = await taskStore.createTask(taskData)
  }

  loading.value = false

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: isEdit.value ? 'Task Updated' : 'Task Created',
      detail: `"${formData.value.title}" has been ${isEdit.value ? 'updated' : 'created'} successfully`,
      life: 3000
    })

    emit('saved', result.data)
    emit('update:visible', false)
    resetForm()
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to save task',
      life: 5000
    })
  }
}
</script>

<style scoped>
/* Ensure select fills container on small screens */
:deep(.p-select) {
  width: 100%;
}

:deep(.p-datepicker) {
  width: 100%;
}
</style>
