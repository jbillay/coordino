import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'

// Only register essential PrimeVue components globally
// Other components will be imported locally in components for better code splitting
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

// PrimeIcons CSS
import 'primeicons/primeicons.css'

// Tailwind CSS
import './assets/styles/main.css'

// Secure logger (dev-only console logging)
import { logger } from './utils/logger'

// Define Coordino preset with brand teal colors
const CoordinoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.500}',
      600: '{teal.600}',
      700: '{teal.700}',
      800: '{teal.800}',
      900: '{teal.900}',
      950: '{teal.950}'
    }
  }
})

const app = createApp(App)
const pinia = createPinia()

// Global error handler for Vue errors
app.config.errorHandler = (err, instance, info) => {
  logger.error('Vue Error:', err)
  logger.debug('Component:', instance)
  logger.debug('Error Info:', info)

  // You can integrate with error tracking service here (e.g., Sentry)
  // Example: Sentry.captureException(err)
}

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection:', event.reason)
  event.preventDefault() // Prevent default browser error reporting

  // You can integrate with error tracking service here
  // Example: Sentry.captureException(event.reason)
})

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: CoordinoPreset,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities'
      }
    }
  }
})
app.use(ToastService)

// Register only essential global components and directives
// Button - Used frequently across the app
// Toast - Used for notifications
// Tooltip - Used throughout the app for helpful hints
app.component('Button', Button)
app.component('Toast', Toast)
app.directive('tooltip', Tooltip)

// Initialize auth store before mounting
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.initialize().then(() => {
  app.mount('#app')
})
