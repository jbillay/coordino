<script setup>
import Button from 'primevue/button'

/**
 * EmptyState Component
 * Displays encouraging empty state messages with call-to-action buttons
 *
 * Feature: 001-user-config - User Story 9 (First-Time User Experience)
 *
 * @component
 * @example
 * <EmptyState
 *   icon="pi pi-check"
 *   title="No tasks yet"
 *   message="Create your first task to get started organizing your work"
 *   ctaLabel="Create Your First Task"
 *   @cta-click="handleCreateTask"
 * />
 */

defineProps({
  /**
   * PrimeIcons icon class to display
   */
  icon: {
    type: String,
    default: 'pi pi-inbox'
  },

  /**
   * Main title text
   */
  title: {
    type: String,
    required: true
  },

  /**
   * Descriptive message text
   */
  message: {
    type: String,
    required: true
  },

  /**
   * Call-to-action button label
   */
  ctaLabel: {
    type: String,
    default: 'Get Started'
  },

  /**
   * Optional secondary action button label
   */
  secondaryCtaLabel: {
    type: String,
    default: ''
  },

  /**
   * Icon size (small, medium, large)
   */
  iconSize: {
    type: String,
    default: 'large',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['ctaClick', 'secondaryCtaClick'])

const iconSizeClasses = {
  small: 'text-4xl',
  medium: 'text-6xl',
  large: 'text-8xl'
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center py-16 px-4 text-center"
    data-testid="empty-state"
    role="region"
    :aria-label="title"
  >
    <!-- Icon -->
    <div
      class="mb-6 text-surface-400 dark:text-surface-500 transition-colors"
      :class="iconSizeClasses[iconSize]"
    >
      <i :class="icon" aria-hidden="true" />
    </div>

    <!-- Title -->
    <h2 class="text-2xl font-semibold mb-3 text-surface-900 dark:text-surface-0">
      {{ title }}
    </h2>

    <!-- Message -->
    <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-md">
      {{ message }}
    </p>

    <!-- Action Buttons -->
    <div class="flex gap-3 flex-wrap justify-center">
      <Button
        :label="ctaLabel"
        icon="pi pi-plus"
        class="px-6"
        data-testid="empty-state-cta"
        @click="emit('ctaClick')"
      />

      <Button
        v-if="secondaryCtaLabel"
        :label="secondaryCtaLabel"
        variant="outlined"
        class="px-6"
        data-testid="empty-state-secondary-cta"
        @click="emit('secondaryCtaClick')"
      />
    </div>

    <!-- Optional slot for custom content -->
    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </div>
</template>
