<template>
  <div v-if="error" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">
        <i class="pi pi-exclamation-triangle"></i>
      </div>
      <h2 class="error-title">Something went wrong</h2>
      <p class="error-message">{{ displayMessage }}</p>
      <div class="error-actions">
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          @click="handleRetry"
          class="p-button-outlined"
        />
        <Button
          label="Go to Dashboard"
          icon="pi pi-home"
          @click="goToDashboard"
        />
      </div>
      <details v-if="showDetails" class="error-details">
        <summary>Technical Details</summary>
        <pre>{{ error }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Props for ErrorBoundary component
 */
const props = defineProps({
  /**
   * Custom error message to display
   */
  fallbackMessage: {
    type: String,
    default: 'We encountered an unexpected error. Please try refreshing the page.'
  },

  /**
   * Whether to show technical error details
   */
  showDetails: {
    type: Boolean,
    default: import.meta.env.DEV // Show details in development only
  },

  /**
   * Callback function when error is caught
   */
  onError: {
    type: Function,
    default: null
  }
})

const router = useRouter()
const error = ref(null)

/**
 * Computed display message based on error type
 */
const displayMessage = computed(() => {
  if (!error.value) return ''

  // Check for common error types and provide specific messages
  const errorMessage = error.value?.message || error.value?.toString() || ''

  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
    return 'Network connection error. Please check your internet connection and try again.'
  }

  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return 'You don\'t have permission to access this resource.'
  }

  return props.fallbackMessage
})

/**
 * Capture errors from child components
 */
onErrorCaptured((err, instance, info) => {
  error.value = err
  console.error('ErrorBoundary caught error:', err)
  console.error('Component:', instance)
  console.error('Error Info:', info)

  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, instance, info)
  }

  // Prevent error from propagating further
  return false
})

/**
 * Retry by clearing the error (will re-render children)
 */
const handleRetry = () => {
  error.value = null
}

/**
 * Navigate to dashboard
 */
const goToDashboard = () => {
  error.value = null
  router.push('/dashboard')
}
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-container {
  max-width: 500px;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1.5rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.dark .error-title {
  color: #f9fafb;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.dark .error-message {
  color: #d1d5db;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.error-details {
  margin-top: 2rem;
  text-align: left;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  cursor: pointer;
}

.dark .error-details {
  background: #374151;
}

.error-details summary {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.dark .error-details summary {
  color: #d1d5db;
}

.error-details pre {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  overflow-x: auto;
  color: #1f2937;
}

.dark .error-details pre {
  background: #1f2937;
  border-color: #4b5563;
  color: #f9fafb;
}
</style>
