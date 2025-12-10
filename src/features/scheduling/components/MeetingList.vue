<script setup>
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  meetings: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select', 'create', 'delete', 'search'])

const searchQuery = ref('')
const debouncedSearchQuery = ref('')

// Debounce search input (300ms delay)
let debounceTimer = null
watch(searchQuery, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = newValue
    emit('search', newValue)
  }, 300)
})

const displayedMeetings = computed(() => {
  if (!searchQuery.value) {
    return props.meetings
  }

  const query = searchQuery.value.toLowerCase()
  return props.meetings.filter((meeting) => {
    const titleMatch = meeting.title?.toLowerCase().includes(query)
    const participantMatch = meeting.participants?.some((p) => p.name.toLowerCase().includes(query))
    return titleMatch || participantMatch
  })
})

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'MMMM d, yyyy')
  } catch {
    return dateString
  }
}

const formatTime = (dateString) => {
  try {
    return format(new Date(dateString), 'h:mm a')
  } catch {
    return dateString
  }
}

const handleDelete = (meetingId) => {
  emit('delete', meetingId)
}
</script>

<template>
  <Card class="meeting-list h-full">
    <template #title>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Meetings</h2>
        <Button label="New Meeting" icon="pi pi-plus" @click="emit('create')" />
      </div>
    </template>

    <template #content>
      <div class="space-y-4">
        <!-- Search -->
        <div class="flex items-center space-x-2">
          <IconField class="flex-1">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Search meetings or participants..."
              class="w-full"
            />
          </IconField>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <ProgressSpinner style="width: 50px; height: 50px" />
          <p class="text-gray-500 mt-2">Loading meetings...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="displayedMeetings.length === 0 && !searchQuery" class="text-center py-12">
          <slot name="empty">
            <i class="pi pi-calendar-plus text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-700 mb-2">No meetings yet</h3>
            <p class="text-gray-500 mb-4">Create your first meeting to get started</p>
            <Button label="Create Meeting" icon="pi pi-plus" @click="emit('create')" />
          </slot>
        </div>

        <!-- No search results -->
        <div v-else-if="displayedMeetings.length === 0 && searchQuery" class="text-center py-8">
          <i class="pi pi-search text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500">No meetings found matching "{{ searchQuery }}"</p>
        </div>

        <!-- Meeting list -->
        <div v-else class="space-y-2">
          <div
            v-for="meeting in displayedMeetings"
            :key="meeting.id"
            class="p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-blue-500"
            :class="{
              'border-blue-500 bg-blue-50': selectedId === meeting.id,
              'border-gray-200': selectedId !== meeting.id
            }"
            @click="emit('select', meeting.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold text-lg mb-1">{{ meeting.title }}</h4>
                <div class="text-sm text-gray-600 space-y-1">
                  <div class="flex items-center space-x-2">
                    <i class="pi pi-calendar text-xs"></i>
                    <span>{{ formatDate(meeting.proposed_time) }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <i class="pi pi-clock text-xs"></i>
                    <span>{{ formatTime(meeting.proposed_time) }}</span>
                  </div>
                  <div
                    v-if="meeting.participants && meeting.participants.length > 0"
                    class="flex items-center space-x-2"
                  >
                    <i class="pi pi-users text-xs"></i>
                    <span>{{ meeting.participants.length }} participants</span>
                  </div>
                </div>
              </div>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                aria-label="Delete meeting"
                @click.stop="handleDelete(meeting.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
