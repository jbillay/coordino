<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSchedulingStore } from '../store'
import { useToast } from 'primevue/usetoast'
import CountryConfigForm from '../components/CountryConfigForm.vue'
import CountryConfigList from '../components/CountryConfigList.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const store = useSchedulingStore()
const toast = useToast()
const configListRef = ref(null)

const initialLoading = ref(true)
const editingConfig = ref(null)

onMounted(async () => {
  try {
    await store.fetchCountryConfigurations()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to load country configurations: ${error.message}`,
      life: 5000
    })
  } finally {
    initialLoading.value = false
  }
})

async function handleSubmit(formData) {
  try {
    if (editingConfig.value) {
      // Update existing configuration
      await store.updateCountryConfiguration(editingConfig.value.id, formData)

      toast.add({
        severity: 'success',
        summary: 'Updated',
        detail: `Custom working hours updated for ${getCountryName(formData.country_code)}`,
        life: 4000
      })

      // T124: Screen reader announcement
      announceToScreenReader(
        `Custom working hours updated for ${getCountryName(formData.country_code)}`
      )
    } else {
      // Create new configuration
      await store.createCountryConfiguration(formData)

      toast.add({
        severity: 'success',
        summary: 'Created',
        detail: `Custom working hours saved for ${getCountryName(formData.country_code)}`,
        life: 4000
      })

      // T124: Screen reader announcement
      announceToScreenReader(
        `Custom working hours saved for ${getCountryName(formData.country_code)}`
      )
    }

    // Reset form
    editingConfig.value = null
  } catch (error) {
    const action = editingConfig.value ? 'update' : 'create'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to ${action} configuration: ${error.message}`,
      life: 5000
    })
  }
}

function handleEdit(config) {
  editingConfig.value = config
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleCancel() {
  editingConfig.value = null
}

async function handleDelete(configId) {
  try {
    await store.deleteCountryConfiguration(configId)

    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Configuration deleted. Country reverted to default working hours.',
      life: 4000
    })

    // Close the delete dialog in the list component
    if (configListRef.value) {
      configListRef.value.closeDeleteDialog()
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to delete configuration: ${error.message}`,
      life: 5000
    })
  }
}

// Helper to get country name
function getCountryName(code) {
  const countryMap = {
    US: 'United States',
    GB: 'United Kingdom',
    FR: 'France',
    DE: 'Germany',
    ES: 'Spain',
    IT: 'Italy',
    JP: 'Japan',
    CN: 'China',
    IN: 'India',
    AU: 'Australia',
    CA: 'Canada',
    BR: 'Brazil',
    MX: 'Mexico',
    RU: 'Russia',
    KR: 'South Korea'
  }
  return countryMap[code] || code
}

// T124: Accessibility - Screen reader announcement
function announceToScreenReader(message) {
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('role', 'status')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.className = 'sr-only'
  liveRegion.textContent = message

  document.body.appendChild(liveRegion)

  setTimeout(() => {
    document.body.removeChild(liveRegion)
  }, 1000)
}
</script>

<template>
  <div class="country-config-management">
    <!-- Header -->
    <div class="view-header">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        aria-label="Back to scheduling"
        class="back-button"
        @click="router.push('/scheduling')"
      />
      <div class="header-content">
        <h1 class="page-title">Custom Working Hours</h1>
        <p class="page-description">
          Configure custom working hours for different countries to improve scheduling accuracy.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="initialLoading" class="loading-state">
      <ProgressSpinner />
      <p>Loading configurations...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="content-grid">
      <!-- Add/Edit Form -->
      <div class="form-section">
        <CountryConfigForm
          :initial-data="editingConfig"
          :loading="store.loading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>

      <!-- Configurations List -->
      <div class="list-section">
        <Card>
          <template #title>
            <div class="list-header">
              <span>Configured Countries</span>
              <Tag
                :value="`${store.countryConfigurations.length} ${store.countryConfigurations.length === 1 ? 'country' : 'countries'}`"
                severity="secondary"
              />
            </div>
          </template>
          <template #content>
            <CountryConfigList
              ref="configListRef"
              :configurations="store.countryConfigurations"
              :loading="store.loading"
              @edit="handleEdit"
              @delete="handleDelete"
            />
          </template>
        </Card>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Toast />
  </div>
</template>

<style scoped>
.country-config-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.view-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--p-text-color);
}

.page-description {
  font-size: 1rem;
  color: var(--p-text-muted-color);
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* Screen reader only class (T124) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Accessibility: Focus indicators */
:deep(button:focus-visible) {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 450px 1fr;
  }
}

@media (max-width: 640px) {
  .country-config-management {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
