/**
 * Data Export Utilities
 * Feature: 001-user-config - User Story 4 (Data Export)
 *
 * Provides JSON/CSV formatting, data flattening, and ZIP archive generation
 * for exporting user data (FR-014 to FR-019)
 */

import JSZip from 'jszip'
import Papa from 'papaparse'

/**
 * Generate JSON export with metadata
 * @param {Object} data - User data to export
 * @returns {string} JSON string with metadata and data
 */
export function generateJSON(data) {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      schema: 'coordino-export-v1'
    },
    data
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Flatten nested objects for CSV compatibility
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Prefix for nested keys
 * @returns {Object} Flattened object
 */
export function flattenData(obj, prefix = '') {
  const flattened = {}

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue
    }

    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key

    if (value === null || value === undefined) {
      flattened[newKey] = ''
    } else if (value instanceof Date) {
      flattened[newKey] = value.toISOString()
    } else if (Array.isArray(value)) {
      // Join arrays with commas
      flattened[newKey] = value.join(',')
    } else if (typeof value === 'object' && value !== null) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenData(value, newKey))
    } else {
      flattened[newKey] = value
    }
  }

  return flattened
}

/**
 * Format entity data for CSV export
 * @param {string} entityType - Type of entity (tasks, notes, etc.)
 * @param {Array} data - Array of entity records
 * @returns {Array} Array of flattened records
 */
export function formatEntityForCSV(entityType, data) {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  return data.map((record) => flattenData(record))
}

/**
 * Generate CSV string from data using PapaParse
 * @param {string} entityType - Type of entity
 * @param {Array} data - Array of entity records
 * @returns {string} CSV string
 */
export function generateCSV(entityType, data) {
  if (!Array.isArray(data) || data.length === 0) {
    return ''
  }

  // Flatten the data
  const flattenedData = formatEntityForCSV(entityType, data)

  // Use PapaParse to convert to CSV
  const csv = Papa.unparse(flattenedData, {
    header: true,
    quotes: true, // Quote all fields for safety
    skipEmptyLines: false
  })

  return csv
}

/**
 * Create ZIP archive with all export files
 * @param {Object} files - Object with filename: content pairs
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function createZipArchive(files) {
  const zip = new JSZip()

  // Add all files to ZIP
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content)
  }

  // Generate ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6 // Balanced compression
    }
  })

  return blob
}

/**
 * Generate README.txt content for export archive
 * @param {Object} metadata - Export metadata
 * @returns {string} README content
 */
export function generateReadme(metadata = {}) {
  const { exportedAt = new Date().toISOString(), version = '1.0.0', recordCounts = {} } = metadata

  const date = new Date(exportedAt)
  const formattedDate = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })

  let readme = `Coordino Data Export
${'='.repeat(50)}

Export Information:
- Exported: ${formattedDate}
- Version: ${version}
- Format: Dual (JSON + CSV)

Directory Structure:
- json/          Full data in JSON format (preserves structure)
- csv/           Individual CSV files for spreadsheet analysis
- README.txt     This file

Data Contents:
`

  // Add record counts
  const entities = [
    'tasks',
    'notes',
    'topics',
    'locations',
    'meetings',
    'participants',
    'categories',
    'statuses'
  ]
  entities.forEach((entity) => {
    const count = recordCounts[entity] || 0
    readme += `- ${entity.charAt(0).toUpperCase() + entity.slice(1)}: ${count} record${count !== 1 ? 's' : ''}\n`
  })

  readme += `
Usage:
- JSON files: Use for backup or migration to another service
- CSV files: Open in Excel, Google Sheets, or any spreadsheet application

Data Privacy:
This export contains all your personal data from Coordino.
Store it securely and delete it when no longer needed.

For support or questions, visit: https://coordino.app/support

Thank you for using Coordino!
`

  return readme
}
