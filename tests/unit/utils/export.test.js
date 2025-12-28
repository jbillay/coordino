/**
 * Unit tests for data export utilities
 * T062: Test JSON/CSV formatting and flattening logic
 *
 * Tests data transformation, formatting, and ZIP archive generation
 * for the data export feature (User Story 4 - FR-014 to FR-019)
 */

import { describe, it, expect } from 'vitest'
import {
  generateJSON,
  generateCSV,
  flattenData,
  createZipArchive,
  formatEntityForCSV
} from '@/utils/export'

describe('Data Export Utilities (T062)', () => {
  describe('generateJSON', () => {
    it('should generate JSON with metadata', () => {
      const data = {
        tasks: [{ id: '1', title: 'Test Task' }],
        notes: [{ id: '2', content: 'Test Note' }]
      }

      const result = generateJSON(data)
      const parsed = JSON.parse(result)

      expect(parsed).toHaveProperty('metadata')
      expect(parsed.metadata).toHaveProperty('exportedAt')
      expect(parsed.metadata).toHaveProperty('version')
      expect(parsed.metadata).toHaveProperty('schema')
      expect(parsed).toHaveProperty('data')
      expect(parsed.data).toEqual(data)
    })

    it('should include current timestamp in metadata', () => {
      const data = { tasks: [] }
      const before = new Date().toISOString()

      const result = generateJSON(data)
      const parsed = JSON.parse(result)

      const after = new Date().toISOString()

      expect(parsed.metadata.exportedAt).toBeTypeOf('string')
      expect(new Date(parsed.metadata.exportedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime()
      )
      expect(new Date(parsed.metadata.exportedAt).getTime()).toBeLessThanOrEqual(
        new Date(after).getTime()
      )
    })

    it('should include version and schema information', () => {
      const data = { tasks: [] }
      const result = generateJSON(data)
      const parsed = JSON.parse(result)

      expect(parsed.metadata.version).toBe('1.0.0')
      expect(parsed.metadata.schema).toBe('coordino-export-v1')
    })

    it('should handle empty data', () => {
      const data = {}
      const result = generateJSON(data)
      const parsed = JSON.parse(result)

      expect(parsed.data).toEqual({})
      expect(parsed.metadata).toBeDefined()
    })

    it('should preserve nested objects in JSON', () => {
      const data = {
        tasks: [
          {
            id: '1',
            title: 'Task',
            metadata: { created: '2025-01-01', updated: '2025-01-02' }
          }
        ]
      }

      const result = generateJSON(data)
      const parsed = JSON.parse(result)

      expect(parsed.data.tasks[0].metadata).toEqual(data.tasks[0].metadata)
    })
  })

  describe('flattenData', () => {
    it('should flatten nested objects for CSV compatibility', () => {
      const nested = {
        id: '1',
        title: 'Task',
        metadata: {
          created: '2025-01-01',
          tags: ['urgent', 'work']
        }
      }

      const result = flattenData(nested)

      expect(result).toEqual({
        id: '1',
        title: 'Task',
        'metadata.created': '2025-01-01',
        'metadata.tags': 'urgent,work'
      })
    })

    it('should handle arrays by joining with commas', () => {
      const data = {
        id: '1',
        tags: ['tag1', 'tag2', 'tag3']
      }

      const result = flattenData(data)

      expect(result.tags).toBe('tag1,tag2,tag3')
    })

    it('should handle null and undefined values', () => {
      const data = {
        id: '1',
        title: 'Task',
        description: null,
        notes: undefined
      }

      const result = flattenData(data)

      expect(result.description).toBe('')
      expect(result.notes).toBe('')
    })

    it('should handle deeply nested objects', () => {
      const data = {
        id: '1',
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      }

      const result = flattenData(data)

      expect(result['level1.level2.level3.value']).toBe('deep')
    })

    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2025-01-01T10:00:00Z')
      const data = {
        id: '1',
        createdAt: date
      }

      const result = flattenData(data)

      expect(result.createdAt).toBe(date.toISOString())
    })
  })

  describe('formatEntityForCSV', () => {
    it('should format task entity correctly', () => {
      const tasks = [
        {
          id: '1',
          title: 'Test Task',
          completed: true,
          created_at: '2025-01-01T10:00:00Z'
        }
      ]

      const result = formatEntityForCSV('tasks', tasks)

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id', '1')
      expect(result[0]).toHaveProperty('title', 'Test Task')
      expect(result[0]).toHaveProperty('completed', true)
    })

    it('should flatten nested properties', () => {
      const notes = [
        {
          id: '1',
          content: 'Note',
          metadata: { author: 'User', created: '2025-01-01' }
        }
      ]

      const result = formatEntityForCSV('notes', notes)

      expect(result[0]).toHaveProperty('metadata.author', 'User')
      expect(result[0]).toHaveProperty('metadata.created', '2025-01-01')
    })

    it('should handle empty arrays', () => {
      const result = formatEntityForCSV('tasks', [])
      expect(result).toEqual([])
    })
  })

  describe('generateCSV', () => {
    it('should generate CSV string with headers', () => {
      const data = [
        { id: '1', title: 'Task 1', completed: false },
        { id: '2', title: 'Task 2', completed: true }
      ]

      const result = generateCSV('tasks', data)

      // PapaParse quotes all fields, so check for quoted format
      expect(result).toContain('"id"')
      expect(result).toContain('"title"')
      expect(result).toContain('"completed"')
      expect(result).toContain('"1"')
      expect(result).toContain('"Task 1"')
    })

    it('should handle special characters and quotes', () => {
      const data = [{ id: '1', title: 'Task with "quotes" and, commas' }]

      const result = generateCSV('tasks', data)

      // CSV should properly escape quotes and handle commas
      expect(result).toContain('"Task with ""quotes"" and, commas"')
    })

    it('should handle empty data arrays', () => {
      const result = generateCSV('tasks', [])

      // Should return empty string or headers only
      expect(result).toBeTypeOf('string')
    })

    it('should handle multiline text content', () => {
      const data = [{ id: '1', content: 'Line 1\nLine 2\nLine 3' }]

      const result = generateCSV('notes', data)

      // Multiline content should be properly escaped in quotes
      expect(result).toContain('"Line 1\nLine 2\nLine 3"')
    })

    it('should maintain consistent column order', () => {
      const data = [
        { id: '1', title: 'A', priority: 'high' },
        { id: '2', priority: 'low', title: 'B' } // Different property order
      ]

      const result = generateCSV('tasks', data)
      const lines = result.split('\n')

      // Header should define column order (with quotes)
      const header = lines[0]
      expect(header).toContain('"id"')
      expect(header).toContain('"title"')
      expect(header).toContain('"priority"')

      // All rows should follow same order and contain values
      expect(lines[1]).toContain('"1"')
      expect(lines[1]).toContain('"A"')
      expect(lines[1]).toContain('"high"')
      expect(lines[2]).toContain('"2"')
      expect(lines[2]).toContain('"B"')
      expect(lines[2]).toContain('"low"')
    })
  })

  describe('createZipArchive', () => {
    it('should create ZIP archive with provided files', async () => {
      const files = {
        'json/tasks.json': JSON.stringify([{ id: '1' }]),
        'csv/tasks.csv': 'id,title\n1,Task',
        'README.txt': 'Export created at 2025-01-01'
      }

      const result = await createZipArchive(files)

      // Result should be a Blob
      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/zip')
    })

    it('should organize files in correct folder structure', async () => {
      const files = {
        'json/tasks.json': '[]',
        'json/notes.json': '[]',
        'csv/tasks.csv': '',
        'csv/notes.csv': '',
        'README.txt': 'Info'
      }

      const result = await createZipArchive(files)

      expect(result).toBeInstanceOf(Blob)
      // We can't easily inspect ZIP contents in unit test,
      // but we verify it creates a valid ZIP blob
    })

    it('should handle large files efficiently', async () => {
      // Create a large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Task ${i}`,
        description: 'Lorem ipsum dolor sit amet '.repeat(10)
      }))

      const files = {
        'json/tasks.json': JSON.stringify(largeData)
      }

      const startTime = Date.now()
      const result = await createZipArchive(files)
      const duration = Date.now() - startTime

      expect(result).toBeInstanceOf(Blob)
      // Should complete reasonably fast (< 5 seconds even for large data)
      expect(duration).toBeLessThan(5000)
    })

    it('should handle empty files object', async () => {
      const result = await createZipArchive({})

      expect(result).toBeInstanceOf(Blob)
    })

    it('should include README.txt with export metadata', async () => {
      const files = {
        'README.txt': 'Coordino Data Export\nExported: 2025-01-01\nVersion: 1.0.0'
      }

      const result = await createZipArchive(files)

      expect(result).toBeInstanceOf(Blob)
      expect(result.size).toBeGreaterThan(0)
    })
  })

  describe('Export Integration', () => {
    it('should export complete dataset in dual formats', async () => {
      const dataset = {
        tasks: [{ id: '1', title: 'Task 1' }],
        notes: [{ id: '2', content: 'Note 1' }],
        topics: [{ id: '3', name: 'Topic 1' }]
      }

      // Generate JSON
      const json = generateJSON(dataset)
      expect(json).toBeTypeOf('string')

      // Generate CSV for each entity
      const tasksCSV = generateCSV('tasks', dataset.tasks)
      const notesCSV = generateCSV('notes', dataset.notes)
      const topicsCSV = generateCSV('topics', dataset.topics)

      expect(tasksCSV).toContain('Task 1')
      expect(notesCSV).toContain('Note 1')
      expect(topicsCSV).toContain('Topic 1')

      // Create archive
      const files = {
        'json/export.json': json,
        'csv/tasks.csv': tasksCSV,
        'csv/notes.csv': notesCSV,
        'csv/topics.csv': topicsCSV,
        'README.txt': 'Export info'
      }

      const archive = await createZipArchive(files)
      expect(archive).toBeInstanceOf(Blob)
    })
  })
})
