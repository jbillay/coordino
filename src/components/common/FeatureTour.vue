<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useFeatureTour } from '@/composables/useFeatureTour'

/**
 * FeatureTour Component
 * Displays contextual onboarding tours for first-time users
 *
 * Feature: 001-user-config - User Story 9 (First-Time User Experience)
 *
 * @component
 * @example
 * <FeatureTour
 *   tour-id="tasks-intro"
 *   title="Welcome to Tasks"
 *   @tour-complete="handleTourComplete"
 * >
 *   <p>Here you can manage all your tasks and stay organized.</p>
 * </FeatureTour>
 */

const props = defineProps({
  /**
   * Unique identifier for this tour
   */
  tourId: {
    type: String,
    required: true
  },

  /**
   * Tour dialog title
   */
  title: {
    type: String,
    required: true
  },

  /**
   * Auto-show the tour if not completed
   */
  autoShow: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['tourComplete', 'tourSkipped'])

const tour = useFeatureTour()
const visible = ref(false)

// Check if tour should be shown
if (props.autoShow && tour.shouldShowTour(props.tourId)) {
  // Small delay to ensure page is rendered
  setTimeout(() => {
    visible.value = true
  }, 500)
}

async function handleComplete() {
  await tour.markTourCompleted(props.tourId)
  visible.value = false
  emit('tourComplete')
}

async function handleSkip() {
  await tour.markTourCompleted(props.tourId)
  visible.value = false
  emit('tourSkipped')
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="title"
    modal
    :closable="false"
    :style="{ width: '90vw', maxWidth: '500px' }"
    :pt="{
      root: { class: 'feature-tour-dialog' }
    }"
  >
    <div class="space-y-4">
      <!-- Tour content (slot) -->
      <div class="text-surface-700 dark:text-surface-300">
        <slot>
          <p>Welcome! Let's get you started with this feature.</p>
        </slot>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center w-full">
        <Button
          label="Skip"
          variant="text"
          severity="secondary"
          data-testid="tour-skip-button"
          @click="handleSkip"
        />
        <Button label="Got it" data-testid="tour-complete-button" @click="handleComplete" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
