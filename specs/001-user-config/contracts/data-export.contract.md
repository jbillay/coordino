# API Contract: Data Export

**Feature**: `001-user-config`
**Contract Type**: Supabase Database Queries + Client-Side Processing
**Date**: 2025-12-27

## Overview

This contract defines the data export functionality that allows users to download all their Coordino data in structured JSON and CSV formats within a compressed archive.

---

## 1. Export Data Retrieval

### Purpose

Fetch all user data from Coordino database for export. Data is retrieved in a single batch to ensure consistency (all data from same point in time).

### Queries

**1. Fetch Tasks**:
```javascript
const { data: tasks, error: tasksError } = await supabase
  .from('tasks')
  .select(`
    id,
    title,
    description,
    priority,
    owner,
    due_date,
    completed_at,
    created_at,
    updated_at,
    status:task_statuses(name, color),
    category:task_categories(name, color)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

**2. Fetch Notes**:
```javascript
const { data: notes, error: notesError } = await supabase
  .from('notes')
  .select(`
    id,
    title,
    content,
    created_at,
    updated_at,
    topic:topics(name, color)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

**3. Fetch Topics**:
```javascript
const { data: topics, error: topicsError } = await supabase
  .from('topics')
  .select('id, name, description, color, display_order, created_at, updated_at')
  .eq('user_id', userId)
  .order('display_order', { ascending: true })
```

**4. Fetch Locations**:
```javascript
const { data: locations, error: locationsError } = await supabase
  .from('locations')
  .select('id, name, timezone, work_hours_start, work_hours_end, is_favorite, created_at, updated_at')
  .eq('user_id', userId)
  .order('name', { ascending: true })
```

**5. Fetch Meetings**:
```javascript
const { data: meetings, error: meetingsError } = await supabase
  .from('meetings')
  .select(`
    id,
    title,
    proposed_time,
    duration_minutes,
    notes,
    created_at,
    updated_at,
    locations:meeting_locations(location:locations(name, timezone))
  `)
  .eq('user_id', userId)
  .order('proposed_time', { ascending: false })
```

**6. Fetch Task Categories**:
```javascript
const { data: categories, error: categoriesError } = await supabase
  .from('task_categories')
  .select('id, name, color, display_order, created_at')
  .eq('user_id', userId)
  .order('display_order', { ascending: true })
```

**7. Fetch Task Statuses** (including default statuses):
```javascript
const { data: statuses, error: statusesError } = await supabase
  .from('task_statuses')
  .select('id, name, color, is_default, display_order')
  .or(`user_id.eq.${userId},user_id.is.null`)  // User's custom + default statuses
  .order('display_order', { ascending: true })
```

### Error Handling

**Per-Query Errors**:
```javascript
const exportData = async () => {
  const errors = []

  // Fetch all data with individual error handling
  const [tasks, notes, topics, ...] = await Promise.all([
    fetchTasks().catch(e => { errors.push('tasks'); return [] }),
    fetchNotes().catch(e => { errors.push('notes'); return [] }),
    fetchTopics().catch(e => { errors.push('topics'); return [] }),
    // ... other queries
  ])

  if (errors.length > 0) {
    throw new Error(`Failed to export: ${errors.join(', ')}`)
  }

  return { tasks, notes, topics, locations, meetings, categories, statuses }
}
```

### Row Level Security

**Automatic Filtering**:
- All queries filtered by `user_id = auth.uid()` via RLS policies
- No risk of exporting another user's data
- Queries return empty arrays if no data exists (valid export)

---

## 2. JSON Export Format

### Structure

```json
{
  "exportMetadata": {
    "exportedAt": "2025-12-27T15:30:00.000Z",
    "coordinoVersion": "1.0.0",
    "schemaVersion": "1",
    "timezone": "America/New_York"
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "preferred_timezone": "America/New_York",
    "theme": "dark",
    "date_format": "MM/DD/YYYY"
  },
  "tasks": [
    {
      "id": "uuid",
      "title": "Review PR #42",
      "description": "Check for security vulnerabilities",
      "priority": "high",
      "owner": null,
      "due_date": "2025-12-28",
      "completed_at": null,
      "created_at": "2025-12-20T10:30:00Z",
      "updated_at": "2025-12-27T14:22:00Z",
      "status": {
        "name": "In Progress",
        "color": "#3b82f6"
      },
      "category": {
        "name": "Development",
        "color": "#10b981"
      }
    }
  ],
  "notes": [
    {
      "id": "uuid",
      "title": "Meeting Notes - Q4 Planning",
      "content": "Discussed roadmap priorities...",
      "created_at": "2025-12-15T09:00:00Z",
      "updated_at": "2025-12-15T09:30:00Z",
      "topic": {
        "name": "Work",
        "color": "#8b5cf6"
      }
    }
  ],
  "topics": [
    {
      "id": "uuid",
      "name": "Work",
      "description": "Work-related notes and meetings",
      "color": "#8b5cf6",
      "display_order": 1,
      "created_at": "2025-01-10T08:00:00Z",
      "updated_at": "2025-01-10T08:00:00Z"
    }
  ],
  "locations": [
    {
      "id": "uuid",
      "name": "New York Office",
      "timezone": "America/New_York",
      "work_hours_start": "09:00:00",
      "work_hours_end": "17:00:00",
      "is_favorite": true,
      "created_at": "2025-01-12T10:00:00Z",
      "updated_at": "2025-01-12T10:00:00Z"
    }
  ],
  "meetings": [
    {
      "id": "uuid",
      "title": "Team Standup",
      "proposed_time": "2025-12-28T15:00:00Z",
      "duration_minutes": 30,
      "notes": "Discuss sprint progress",
      "created_at": "2025-12-27T08:00:00Z",
      "updated_at": "2025-12-27T08:00:00Z",
      "locations": [
        { "name": "New York Office", "timezone": "America/New_York" },
        { "name": "London Office", "timezone": "Europe/London" }
      ]
    }
  ],
  "categories": [
    {
      "id": "uuid",
      "name": "Development",
      "color": "#10b981",
      "display_order": 1,
      "created_at": "2025-01-15T12:00:00Z"
    }
  ],
  "statuses": [
    {
      "id": "uuid",
      "name": "In Progress",
      "color": "#3b82f6",
      "is_default": true,
      "display_order": 2
    }
  ]
}
```

### Generation

```javascript
import { formatInTimeZone } from 'date-fns-tz'

const generateJSON = (data, user) => {
  const exportData = {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      coordinoVersion: '1.0.0',  // From package.json
      schemaVersion: '1',
      timezone: user.preferred_timezone
    },
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      preferred_timezone: user.preferred_timezone,
      theme: user.theme,
      date_format: user.date_format
    },
    ...data  // tasks, notes, topics, locations, meetings, categories, statuses
  }

  return JSON.stringify(exportData, null, 2)  // Pretty-printed with 2-space indent
}
```

---

## 3. CSV Export Format

### Files Generated

Each entity type exported as separate CSV file:
- `tasks.csv`
- `notes.csv`
- `topics.csv`
- `locations.csv`
- `meetings.csv`
- `task_categories.csv`
- `task_statuses.csv`

### CSV Structure

**tasks.csv**:
```csv
ID,Title,Description,Priority,Owner,Due Date,Completed At,Status,Category,Created At,Updated At
"550e8400-...","Review PR #42","Check for security vulnerabilities","high","","2025-12-28","","In Progress","Development","2025-12-20T10:30:00Z","2025-12-27T14:22:00Z"
```

**notes.csv**:
```csv
ID,Title,Content,Topic,Created At,Updated At
"550e8400-...","Meeting Notes - Q4 Planning","Discussed roadmap priorities...","Work","2025-12-15T09:00:00Z","2025-12-15T09:30:00Z"
```

**topics.csv**:
```csv
ID,Name,Description,Color,Display Order,Created At,Updated At
"550e8400-...","Work","Work-related notes and meetings","#8b5cf6","1","2025-01-10T08:00:00Z","2025-01-10T08:00:00Z"
```

### Flattening Nested Data

**Problem**: CSV doesn't support nested objects (e.g., `task.status.name`)

**Solution**: Flatten to single-level structure
```javascript
const flattenTaskForCSV = (task) => ({
  'ID': task.id,
  'Title': task.title,
  'Description': task.description || '',
  'Priority': task.priority,
  'Owner': task.owner || '',
  'Due Date': task.due_date || '',
  'Completed At': task.completed_at || '',
  'Status': task.status?.name || '',
  'Category': task.category?.name || '',
  'Created At': task.created_at,
  'Updated At': task.updated_at
})
```

### CSV Generation

```javascript
import Papa from 'papaparse'

const generateCSV = (data, filename) => {
  const csv = Papa.unparse(data, {
    header: true,
    quotes: true,        // Quote all fields (handle commas in content)
    escapeFormulae: true // Prevent CSV injection attacks
  })

  return { filename, content: csv }
}

// Generate all CSV files
const generateAllCSVs = (data) => [
  generateCSV(data.tasks.map(flattenTaskForCSV), 'tasks.csv'),
  generateCSV(data.notes.map(flattenNoteForCSV), 'notes.csv'),
  generateCSV(data.topics.map(flattenTopicForCSV), 'topics.csv'),
  generateCSV(data.locations.map(flattenLocationForCSV), 'locations.csv'),
  generateCSV(data.meetings.map(flattenMeetingForCSV), 'meetings.csv'),
  generateCSV(data.categories.map(flattenCategoryForCSV), 'task_categories.csv'),
  generateCSV(data.statuses.map(flattenStatusForCSV), 'task_statuses.csv')
]
```

---

## 4. Archive Creation (ZIP)

### Directory Structure

```
coordino_export_2025-12-27_15-30-00/
├── README.txt
├── json/
│   └── full_export.json
└── csv/
    ├── tasks.csv
    ├── notes.csv
    ├── topics.csv
    ├── locations.csv
    ├── meetings.csv
    ├── task_categories.csv
    └── task_statuses.csv
```

### README.txt Content

```text
Coordino Data Export
====================

Export Date: December 27, 2025 at 3:30 PM
Timezone: America/New_York
Coordino Version: 1.0.0
Schema Version: 1

This archive contains all your Coordino data in two formats:

JSON Export (json/full_export.json)
------------------------------------
Complete data export in JSON format, preserving all relationships and
metadata. Use this for backup or importing into another system.

CSV Exports (csv/*.csv)
-----------------------
Individual CSV files for each data type, compatible with spreadsheet
applications like Microsoft Excel, Google Sheets, or LibreOffice Calc.

- tasks.csv: All your tasks with status, category, and priority
- notes.csv: All your notes with associated topics
- topics.csv: Your note organization topics
- locations.csv: Saved locations for meeting scheduling
- meetings.csv: Proposed meetings with timezone information
- task_categories.csv: Your custom task categories
- task_statuses.csv: Task statuses (both default and custom)

Questions?
----------
For help importing this data or other questions, visit:
https://coordino.app/help

Data Privacy
------------
This export contains ALL your Coordino data. Keep this file secure and
do not share it publicly.
```

### ZIP Generation

```javascript
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const createExportArchive = async (jsonExport, csvExports, timestamp) => {
  const zip = new JSZip()

  // Create folder name with timestamp
  const folderName = `coordino_export_${timestamp.replace(/:/g, '-')}`

  // Add README
  zip.file(`${folderName}/README.txt`, readmeContent)

  // Add JSON export
  zip.file(`${folderName}/json/full_export.json`, jsonExport)

  // Add CSV exports
  csvExports.forEach(({ filename, content }) => {
    zip.file(`${folderName}/csv/${filename}`, content)
  })

  // Generate ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }  // Balanced compression
  })

  // Trigger browser download
  saveAs(blob, `${folderName}.zip`)

  return { success: true, filename: `${folderName}.zip` }
}
```

---

## 5. Performance & Large Dataset Handling

### Data Volume Limits (from Clarifications)

- Soft limit: 5,000 tasks, 3,000 notes
- Export should complete in <30 seconds for 1,000 records (SC-005)

### Chunking for Large Exports (>1,000 records)

**Problem**: Exporting 5,000+ records in single query may timeout

**Solution**: Paginated queries with progress tracking
```javascript
const fetchAllTasks = async (userId) => {
  const BATCH_SIZE = 1000
  let allTasks = []
  let hasMore = true
  let offset = 0

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + BATCH_SIZE - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    allTasks = [...allTasks, ...batch]
    hasMore = batch.length === BATCH_SIZE
    offset += BATCH_SIZE

    // Emit progress event
    emit('export:progress', {
      entity: 'tasks',
      fetched: allTasks.length
    })
  }

  return allTasks
}
```

### Asynchronous Processing (FR-019)

**Trigger**: Dataset exceeds 1,000 records across all entities

**Flow**:
1. Show loading state: "Preparing your export... This may take a few moments."
2. Process export in background (Web Worker if needed)
3. Show progress: "Exporting tasks... 1,250 / 5,000"
4. When complete: "Export ready! Download will start automatically."
5. Trigger download

**Timeout Handling**:
```javascript
const exportWithTimeout = async (data) => {
  const TIMEOUT = 60000  // 60 seconds max

  return Promise.race([
    createExportArchive(data),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Export timeout')), TIMEOUT)
    )
  ])
}
```

---

## 6. Error Handling

### Error Scenarios

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| Database query fails | "Failed to retrieve data. Please try again." | Retry button, auto-retry 1x |
| Export exceeds size limit | "Your data export is too large. Please contact support." | Contact support link |
| ZIP generation fails | "Failed to create export file. Please try again." | Retry button |
| Download blocked | "Download blocked. Please allow downloads for this site." | Show browser permission instructions |

### Retry Logic

```javascript
const exportDataWithRetry = async (maxRetries = 2) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fetchAllData()
      const archive = await createExportArchive(data)
      return { success: true }
    } catch (error) {
      if (attempt === maxRetries) {
        // Final attempt failed
        throw new Error(`Export failed after ${maxRetries + 1} attempts: ${error.message}`)
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
    }
  }
}
```

---

## 7. Testing Contract

### Unit Tests

**Test**: Flatten task for CSV
```javascript
describe('flattenTaskForCSV', () => {
  it('flattens nested task structure', () => {
    const task = {
      id: 'uuid',
      title: 'Test Task',
      status: { name: 'In Progress', color: '#3b82f6' },
      category: { name: 'Development', color: '#10b981' },
      due_date: '2025-12-28'
    }

    const flattened = flattenTaskForCSV(task)

    expect(flattened['Title']).toBe('Test Task')
    expect(flattened['Status']).toBe('In Progress')
    expect(flattened['Category']).toBe('Development')
  })

  it('handles null nested objects', () => {
    const task = { id: 'uuid', title: 'Test', status: null, category: null }
    const flattened = flattenTaskForCSV(task)

    expect(flattened['Status']).toBe('')
    expect(flattened['Category']).toBe('')
  })
})
```

**Test**: CSV generation with special characters
```javascript
describe('generateCSV', () => {
  it('properly escapes commas in content', () => {
    const data = [{ title: 'Task with, comma', description: 'Test' }]
    const csv = generateCSV(data, 'test.csv')

    expect(csv.content).toContain('"Task with, comma"')
  })

  it('prevents CSV injection attacks', () => {
    const data = [{ title: '=1+1', description: 'Formula' }]
    const csv = generateCSV(data, 'test.csv')

    // PapaParse escapeFormulae option should prefix with single quote
    expect(csv.content).not.toContain('=1+1')
  })
})
```

### Integration Tests

**Test**: Data export flow
```javascript
describe('Data Export Integration', () => {
  it('exports all user data in dual format', async () => {
    // Setup: Create test data
    const testUser = await createTestUser()
    await createTestTasks(testUser.id, 10)
    await createTestNotes(testUser.id, 5)

    // Execute export
    const result = await exportData(testUser.id)

    // Verify JSON
    expect(result.json.tasks.length).toBe(10)
    expect(result.json.notes.length).toBe(5)

    // Verify CSV
    expect(result.csvs.find(f => f.filename === 'tasks.csv')).toBeDefined()
    expect(result.csvs.find(f => f.filename === 'notes.csv')).toBeDefined()
  })
})
```

### E2E Tests

**Test**: Data export end-to-end (SC-005)
```javascript
test('user exports data and downloads archive within 30 seconds', async ({ page }) => {
  const startTime = Date.now()

  // 1. Navigate to Settings > Data Export
  await page.goto('/settings')
  await page.click('text=Data Export')

  // 2. Click "Export All My Data"
  const downloadPromise = page.waitForEvent('download')
  await page.click('button:has-text("Export All My Data")')

  // 3. Wait for download
  const download = await downloadPromise

  // 4. Verify filename format
  expect(download.suggestedFilename()).toMatch(/coordino_export_\d{4}-\d{2}-\d{2}/)

  // 5. Verify file size is reasonable
  const path = await download.path()
  const stats = require('fs').statSync(path)
  expect(stats.size).toBeGreaterThan(1000)  // At least 1KB

  // 6. Verify completion time
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(30000)  // 30 seconds
})
```

---

## Contract Summary

**Data Sources**:
- ✅ 7 Supabase tables queried (tasks, notes, topics, locations, meetings, categories, statuses)
- ✅ RLS policies ensure user isolation
- ✅ Nested relationships resolved via joins

**Export Formats**:
- ✅ JSON: Complete data structure with metadata
- ✅ CSV: 7 separate files, flattened structure

**Archive**:
- ✅ ZIP compression (level 6)
- ✅ Organized folder structure
- ✅ README with instructions

**Performance**:
- ✅ <30 seconds for 1,000 records (SC-005)
- ✅ Chunking for large datasets (>1,000 records)
- ✅ Async processing with progress tracking

**Error Handling**:
- ✅ Per-query error isolation
- ✅ Retry logic with exponential backoff
- ✅ User-friendly error messages
- ✅ Timeout handling (60s max)

**Security**:
- ✅ CSV injection prevention (escapeFormulae)
- ✅ RLS automatic filtering
- ✅ Client-side processing (no server storage)
