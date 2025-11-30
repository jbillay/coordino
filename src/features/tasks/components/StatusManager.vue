<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ColorPicker from 'primevue/colorpicker'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useTaskStore } from '../store'
import { useToast } from 'primevue/usetoast'
import { generateRandomColor } from '../utils'

/**
 * StatusManager Component
 * Manage custom task statuses
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
const statusToDelete = ref(null)

const newStatus = ref({
  name: '',
  color: generateRandomColor().replace('#', '')
})

/**
 * Default statuses (system-provided)
 */
const defaultStatuses = computed(() => taskStore.statuses.filter((s) => s.is_default || !s.user_id))

/**
 * Custom user-created statuses
 */
const customStatuses = computed(() => taskStore.statuses.filter((s) => !s.is_default && s.user_id))

/**
 * Add new status
 */
const handleAddStatus = async () => {
  if (!newStatus.value.name || !newStatus.value.color) {
    return
  }

  adding.value = true

  const result = await taskStore.createStatus({
    name: newStatus.value.name.trim(),
    color: `#${newStatus.value.color}`,
    display_order: taskStore.statuses.length + 1
  })

  adding.value = false

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Status Created',
      detail: `"${newStatus.value.name}" has been added`,
      life: 3000
    })

    // Reset form
    newStatus.value = {
      name: '',
      color: generateRandomColor().replace('#', '')
    }
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to create status',
      life: 5000
    })
  }
}

/**
 * Delete status - show confirmation dialog
 */
const handleDeleteStatus = (status) => {
  statusToDelete.value = status
  showDeleteConfirm.value = true
}

/**
 * Confirm delete status - actually perform deletion
 */
const confirmDelete = async () => {
  if (!statusToDelete.value) {
    return
  }

  const status = statusToDelete.value
  deleting.value = status.id

  const result = await taskStore.deleteStatus(status.id)

  deleting.value = null
  showDeleteConfirm.value = false

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Status Deleted',
      detail: `"${status.name}" has been removed`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'Failed to delete status',
      life: 5000
    })
  }

  statusToDelete.value = null
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
      <h3 class="text-xl font-semibold">Manage Task Statuses</h3>
    </template>

    <div class="space-y-4">
      <!-- Add new status form -->
      <Card>
        <template #title>
          <h4 class="text-lg font-medium">Add New Status</h4>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <InputText
                v-model="newStatus.name"
                placeholder="Status name"
                class="w-full"
                @keyup.enter="handleAddStatus"
              />
            </div>
            <div>
              <ColorPicker v-model="newStatus.color" format="hex" class="w-full" />
            </div>
            <div>
              <Button
                label="Add Status"
                icon="pi pi-plus"
                class="w-full"
                :loading="adding"
                :disabled="!newStatus.name || !newStatus.color"
                @click="handleAddStatus"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Status list -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Statuses</h4>

        <!-- Default statuses -->
        <div class="space-y-2 mb-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Default Statuses (Read-only)</p>
          <div
            v-for="status in defaultStatuses"
            :key="status.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center gap-3">
              <span class="w-4 h-4 rounded-full" :style="{ backgroundColor: status.color }"></span>
              <span class="font-medium">{{ status.name }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">(Default)</span>
            </div>
          </div>
        </div>

        <!-- Custom statuses -->
        <div v-if="customStatuses.length > 0" class="space-y-2">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Custom Statuses</p>
          <div
            v-for="status in customStatuses"
            :key="status.id"
            class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
          >
            <div class="flex items-center gap-3 flex-1">
              <span class="w-4 h-4 rounded-full" :style="{ backgroundColor: status.color }"></span>
              <span class="font-medium">{{ status.name }}</span>
            </div>

            <div class="flex items-center gap-2">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-sm p-button-danger"
                :loading="deleting === status.id"
                aria-label="Delete status"
                @click="handleDeleteStatus(status)"
              />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="pi pi-info-circle text-2xl mb-2"></i>
          <p class="text-sm">No custom statuses yet. Add your first one above!</p>
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
    header="Delete Status"
    :message="`Are you sure you want to delete the status &quot;${statusToDelete?.name}&quot;? Tasks using this status will need to be updated.`"
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
