<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import ParticipantCard from './ParticipantCard.vue'

const props = defineProps({
  participants: {
    type: Array,
    default: () => []
  },
  participantStatuses: {
    type: Array,
    default: () => []
  },
  removable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['add', 'remove'])

const participantsWithStatus = computed(() =>
  props.participants.map((participant) => {
    const status = props.participantStatuses.find((s) => s.participant_id === participant.id)
    return {
      ...participant,
      status: status || null,
      localTime: status?.local_time || ''
    }
  })
)

const handleRemove = (participantId) => {
  emit('remove', participantId)
}
</script>

<template>
  <div class="participant-list">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Participants ({{ participants.length }})</h3>
      <Button label="Add Participant" icon="pi pi-plus" size="small" @click="emit('add')" />
    </div>

    <div v-if="participants.length > 0" class="space-y-3">
      <ParticipantCard
        v-for="participant in participantsWithStatus"
        :key="participant.id"
        :participant="participant"
        :status="participant.status"
        :local-time="participant.localTime"
        :removable="removable"
        @remove="handleRemove"
      />
    </div>

    <div v-else class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
      <i class="pi pi-users text-4xl text-gray-400 mb-3"></i>
      <p class="text-gray-500 mb-3">No participants added yet</p>
      <Button label="Add First Participant" icon="pi pi-plus" outlined @click="emit('add')" />
    </div>
  </div>
</template>
