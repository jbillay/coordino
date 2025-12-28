/**
 * useDataExport Composable
 * Feature: 001-user-config - User Story 4 (Data Export)
 *
 * Orchestrates data export workflow with progress tracking
 * Fetches all user data, generates dual-format export, and triggers download
 */

import { ref } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { generateJSON, generateCSV, createZipArchive, generateReadme } from '@/utils/export'
import { saveAs } from 'file-saver'

/**
 * Composable for data export functionality
 * @returns {Object} Export state and methods
 */
export function useDataExport() {
  const { supabase } = useSupabase()
  const authStore = useAuthStore()

  // State
  const isExporting = ref(false)
  const progress = ref(0)
  const currentStep = ref('')
  const error = ref(null)

  /**
   * Fetch all user data from database
   * @returns {Promise<Object>} Object with all entity types
   */
  async function fetchAllData() {
    if (!authStore.user) {
      throw new Error('User must be authenticated')
    }

    const userId = authStore.user.id

    currentStep.value = 'Fetching data...'
    progress.value = 10

    // Entity types to export
    const entities = [
      'tasks',
      'notes',
      'topics',
      'locations',
      'meetings',
      'meeting_participants',
      'task_categories',
      'task_statuses'
    ]

    const result = {}
    const progressIncrement = 30 / entities.length

    // Fetch each entity type
    for (const entityType of entities) {
      const { data, error: fetchError } = await supabase
        .from(entityType)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw new Error(`Failed to fetch ${entityType}: ${fetchError.message}`)
      }

      result[entityType] = data || []
      progress.value += progressIncrement
    }

    return result
  }

  /**
   * Export all user data
   * @returns {Promise<void>}
   */
  async function exportData() {
    try {
      isExporting.value = true
      error.value = null
      progress.value = 0

      // Step 1: Fetch all data
      const userData = await fetchAllData()

      // Step 2: Generate JSON
      currentStep.value = 'Generating JSON...'
      progress.value = 45

      const jsonContent = generateJSON(userData)

      // Step 3: Generate CSV files
      currentStep.value = 'Generating CSV files...'
      progress.value = 55

      const csvFiles = {}
      const entities = Object.keys(userData)
      const csvProgressIncrement = 25 / entities.length

      for (const entityType of entities) {
        if (userData[entityType].length > 0) {
          csvFiles[entityType] = generateCSV(entityType, userData[entityType])
        }
        progress.value += csvProgressIncrement
      }

      // Step 4: Calculate record counts for README
      const recordCounts = {}
      entities.forEach((entity) => {
        recordCounts[entity] = userData[entity].length
      })

      // Generate README
      const readme = generateReadme({
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        recordCounts
      })

      // Step 5: Create ZIP archive
      currentStep.value = 'Creating archive...'
      progress.value = 85

      const files = {
        'json/export.json': jsonContent,
        'README.txt': readme
      }

      // Add CSV files
      for (const [entityType, csvContent] of Object.entries(csvFiles)) {
        if (csvContent) {
          files[`csv/${entityType}.csv`] = csvContent
        }
      }

      const zipBlob = await createZipArchive(files)

      // Step 6: Trigger download
      currentStep.value = 'Downloading...'
      progress.value = 95

      const filename = `coordino-export-${new Date().toISOString().split('T')[0]}.zip`
      saveAs(zipBlob, filename)

      // Complete
      progress.value = 100
      currentStep.value = 'Export complete'
    } catch (err) {
      error.value = err.message || 'An error occurred during export'
      throw err
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Reset state to initial values
   */
  function resetState() {
    isExporting.value = false
    progress.value = 0
    currentStep.value = ''
    error.value = null
  }

  return {
    // State
    isExporting,
    progress,
    currentStep,
    error,

    // Methods
    exportData,
    fetchAllData,
    resetState
  }
}
