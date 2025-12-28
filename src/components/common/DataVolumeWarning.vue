<script setup>
/**
 * DataVolumeWarning Component
 * Feature: 001-user-config - User Story 6 (Performance Optimization)
 *
 * Displays warning when user approaches data volume soft limits:
 * - 90% of 5,000 tasks (4,500 tasks) - FR-035
 * - 90% of 3,000 notes (2,700 notes) - FR-035
 *
 * Recommends data export and archival (FR-036)
 *
 * @component
 */
import { computed } from 'vue'
import Message from 'primevue/message'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const props = defineProps({
  /**
   * Type of data ('tasks' or 'notes')
   */
  type: {
    type: String,
    required: true,
    validator: (value) => ['tasks', 'notes'].includes(value)
  },

  /**
   * Current count of items
   */
  count: {
    type: Number,
    required: true
  },

  /**
   * Show as banner (true) or inline message (false)
   */
  banner: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()

// Soft limits per type
const LIMITS = {
  tasks: 5000,
  notes: 3000
}

// Warning threshold (90%)
const WARNING_THRESHOLD = 0.9

const limit = computed(() => LIMITS[props.type])
const warningThreshold = computed(() => Math.floor(limit.value * WARNING_THRESHOLD))
const shouldShowWarning = computed(() => props.count >= warningThreshold.value)
const percentageFull = computed(() => Math.round((props.count / limit.value) * 100))

const typeLabel = computed(() => (props.type === 'tasks' ? 'tasks' : 'notes'))

const navigateToExport = () => {
  router.push({ name: 'settings', query: { tab: 'export' } })
}
</script>

<template>
  <Message
    v-if="shouldShowWarning"
    severity="warn"
    :closable="false"
    data-testid="data-volume-warning"
    class="data-volume-warning"
  >
    <div class="flex items-start gap-3">
      <div class="flex-1">
        <p class="font-semibold mb-1">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          Approaching Data Limit
        </p>
        <p class="text-sm mb-2">
          You have
          <strong>{{ count }} {{ typeLabel }}</strong>
          ({{ percentageFull }}% of the recommended limit of {{ limit.toLocaleString() }}). For
          optimal performance, consider exporting and archiving older {{ typeLabel }}.
        </p>
        <div class="flex gap-2 mt-3">
          <Button
            label="Export My Data"
            icon="pi pi-download"
            size="small"
            severity="warning"
            @click="navigateToExport"
          />
          <Button
            label="Learn More"
            icon="pi pi-info-circle"
            size="small"
            severity="secondary"
            text
            as="a"
            href="https://docs.coordino.app/performance/data-limits"
            target="_blank"
          />
        </div>
      </div>
    </div>
  </Message>
</template>

<style scoped>
.data-volume-warning {
  margin-bottom: 1rem;
  border-left: 4px solid var(--p-warn-500);
}

.data-volume-warning :deep(.p-message-text) {
  flex: 1;
}
</style>
