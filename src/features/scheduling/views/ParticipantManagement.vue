<script setup>
import { ref, onMounted } from 'vue'
import { useSchedulingStore } from '../store'
import ParticipantForm from '../components/ParticipantForm.vue'
import ParticipantList from '../components/ParticipantList.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

const store = useSchedulingStore()
const toast = useToast()

// State
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEditing = ref(false)
const selectedParticipant = ref(null)
const participantToDelete = ref(null)

// Open create dialog
function openCreateDialog() {
  isEditing.value = false
  selectedParticipant.value = null
  dialogVisible.value = true
}

// Open edit dialog
function openEditDialog(participant) {
  isEditing.value = true
  selectedParticipant.value = { ...participant }
  dialogVisible.value = true
}

// Close dialog
function closeDialog() {
  dialogVisible.value = false
  selectedParticipant.value = null
  isEditing.value = false
}

// Handle form submission (create or update)
async function handleSubmit(formData) {
  try {
    if (isEditing.value && selectedParticipant.value) {
      await store.updateParticipant(selectedParticipant.value.id, formData)
      toast.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Participant updated successfully',
        life: 3000
      })
    } else {
      await store.createParticipant(formData)
      toast.add({
        severity: 'success',
        summary: 'Created',
        detail: 'Participant added successfully',
        life: 3000
      })
    }
    closeDialog()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save participant',
      life: 5000
    })
  }
}

// Delete confirmation
function confirmDelete(participant) {
  participantToDelete.value = participant
  deleteDialogVisible.value = true
}

// Delete participant
async function deleteParticipant() {
  if (participantToDelete.value) {
    try {
      await store.deleteParticipant(participantToDelete.value.id)
      toast.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Participant deleted successfully',
        life: 3000
      })
      deleteDialogVisible.value = false
      participantToDelete.value = null
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to delete participant',
        life: 5000
      })
    }
  }
}

// Load participants on mount
onMounted(async () => {
  try {
    await store.fetchParticipants()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to load participants: ${error.message}`,
      life: 5000
    })
  }
})
</script>

<template>
  <div class="participant-management-view">
    <div class="view-header">
      <h1 class="page-title">Participants</h1>
      <Button
        label="Add Participant"
        icon="pi pi-plus"
        class="create-button"
        @click="openCreateDialog"
      />
    </div>

    <Card>
      <template #content>
        <ParticipantList
          :participants="store.participants"
          :loading="store.loading"
          :show-actions="true"
          @edit="openEditDialog"
          @delete="confirmDelete"
        />
      </template>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? 'Edit Participant' : 'Add Participant'"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <ParticipantForm
        :initial-data="selectedParticipant"
        :loading="store.loading"
        :submit-label="isEditing ? 'Update Participant' : 'Add Participant'"
        @submit="handleSubmit"
        @cancel="closeDialog"
      />
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Confirm Delete"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
        <p>Are you sure you want to delete this participant?</p>
        <p class="font-medium mt-2">{{ participantToDelete?.name }}</p>
        <p v-if="participantToDelete?.timezone" class="text-sm text-gray-500 mt-1">
          {{ participantToDelete.timezone }}
        </p>
        <p class="text-sm text-red-600 mt-3">This will remove the participant from all meetings.</p>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="deleteDialogVisible = false" />
        <Button label="Delete" severity="danger" @click="deleteParticipant" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.participant-management-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--p-text-color);
}

.confirmation-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
}

/* Accessibility: Focus indicators */
:deep(button:focus-visible) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
</style>
