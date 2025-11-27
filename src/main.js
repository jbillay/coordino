import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'

// Only register essential PrimeVue components globally
// Other components will be imported locally in components for better code splitting
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'

// PrimeIcons CSS
import 'primeicons/primeicons.css'

// Tailwind CSS
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

// Global error handler for Vue errors
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Error Info:', info)

  // You can integrate with error tracking service here (e.g., Sentry)
  // Example: Sentry.captureException(err)
}

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
  event.preventDefault() // Prevent default browser error reporting

  // You can integrate with error tracking service here
  // Example: Sentry.captureException(event.reason)
})

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
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

// Register only essential global components
// Button - Used frequently across the app
// Toast - Used for notifications
app.component('Button', Button)
app.component('Toast', Toast)

// Initialize auth store before mounting
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.initialize().then(() => {
  app.mount('#app')
})
