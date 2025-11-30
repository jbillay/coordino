/**
 * Unit Tests for Task Utilities
 * Tests filtering, sorting, and utility functions
 */

import { describe, it, expect } from 'vitest'
import {
  PRIORITY_CONFIG,
  getPriorityClasses,
  getPriorityLabel,
  filterTasks,
  sortTasks,
  formatTaskDate,
  calculateDaysRemaining,
  getTaskStats,
  groupTasks,
  getDaysRemainingText,
  isTaskOverdue,
  calculateDaysOpen,
  getPriorityConfig,
  generateRandomColor
} from '../utils'
import { PRIORITY_LEVELS } from '@/constants'

describe('PRIORITY_LEVELS', () => {
  it('exports array of priority levels', () => {
    expect(PRIORITY_LEVELS).toEqual(['low', 'medium', 'high', 'urgent'])
  })

  it('contains only valid priority strings', () => {
    PRIORITY_LEVELS.forEach((level) => {
      expect(typeof level).toBe('string')
      expect(level.length).toBeGreaterThan(0)
    })
  })
})

describe('PRIORITY_CONFIG', () => {
  it('has configuration for all priority levels', () => {
    PRIORITY_LEVELS.forEach((level) => {
      expect(PRIORITY_CONFIG[level]).toBeDefined()
      expect(PRIORITY_CONFIG[level].label).toBeDefined()
      expect(PRIORITY_CONFIG[level].color).toBeDefined()
    })
  })
})

describe('getPriorityClasses', () => {
  it('returns correct classes for low priority', () => {
    const classes = getPriorityClasses('low')
    expect(classes).toContain('bg-blue')
  })

  it('returns correct classes for medium priority', () => {
    const classes = getPriorityClasses('medium')
    expect(classes).toContain('bg-yellow')
  })

  it('returns correct classes for high priority', () => {
    const classes = getPriorityClasses('high')
    expect(classes).toContain('bg-orange')
  })

  it('returns correct classes for urgent priority', () => {
    const classes = getPriorityClasses('urgent')
    expect(classes).toContain('bg-red')
  })

  it('returns default classes for invalid priority', () => {
    const classes = getPriorityClasses('invalid')
    expect(classes).toBeDefined()
  })
})

describe('getPriorityLabel', () => {
  it('returns capitalized label for valid priority', () => {
    expect(getPriorityLabel('low')).toBe('Low')
    expect(getPriorityLabel('high')).toBe('High')
  })

  it('handles invalid priority', () => {
    expect(getPriorityLabel('invalid')).toBeDefined()
  })
})

describe('filterTasks', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Buy groceries',
      status_id: 1,
      category_id: 1,
      priority: 'high',
      completed_at: null,
      status: { name: 'Open' },
      category: { name: 'Personal' }
    },
    {
      id: 2,
      title: 'Write report',
      status_id: 2,
      category_id: 2,
      priority: 'medium',
      completed_at: '2024-01-01',
      status: { name: 'Completed' },
      category: { name: 'Work' }
    },
    {
      id: 3,
      title: 'Call dentist',
      status_id: 1,
      category_id: 1,
      priority: 'urgent',
      completed_at: null,
      status: { name: 'Open' },
      category: { name: 'Personal' }
    }
  ]

  it('returns all tasks when no filters applied', () => {
    const filtered = filterTasks(mockTasks, {})
    expect(filtered).toHaveLength(3)
  })

  it('filters by status', () => {
    const filtered = filterTasks(mockTasks, { status: 1 })
    expect(filtered).toHaveLength(2)
    expect(filtered.every((t) => t.status_id === 1)).toBe(true)
  })

  it('filters by category', () => {
    const filtered = filterTasks(mockTasks, { category: 2 })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].category_id).toBe(2)
  })

  it('filters by priority', () => {
    const filtered = filterTasks(mockTasks, { priority: 'high' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].priority).toBe('high')
  })

  it('filters by search term (case-insensitive)', () => {
    const filtered = filterTasks(mockTasks, { search: 'REPORT' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('Write report')
  })

  it('excludes completed tasks by default', () => {
    const filtered = filterTasks(mockTasks, { showCompleted: false })
    expect(filtered).toHaveLength(2)
    expect(filtered.every((t) => !t.completed_at)).toBe(true)
  })

  it('includes completed tasks when requested', () => {
    const filtered = filterTasks(mockTasks, { showCompleted: true })
    expect(filtered).toHaveLength(3)
  })

  it('combines multiple filters', () => {
    const filtered = filterTasks(mockTasks, {
      status: 1,
      priority: 'high',
      showCompleted: false
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(1)
  })
})

describe('sortTasks', () => {
  const mockTasks = [
    { id: 1, title: 'Zebra', priority: 'low', due_date: '2024-01-03', created_at: '2024-01-01' },
    { id: 2, title: 'Apple', priority: 'urgent', due_date: '2024-01-01', created_at: '2024-01-03' },
    { id: 3, title: 'Banana', priority: 'high', due_date: '2024-01-02', created_at: '2024-01-02' }
  ]

  it('sorts by title alphabetically', () => {
    const sorted = sortTasks(mockTasks, 'title')
    expect(sorted[0].title).toBe('Apple')
    expect(sorted[1].title).toBe('Banana')
    expect(sorted[2].title).toBe('Zebra')
  })

  it('sorts by created_at (newest first)', () => {
    const sorted = sortTasks(mockTasks, 'created_at')
    expect(sorted[0].id).toBe(2)
    expect(sorted[1].id).toBe(3)
    expect(sorted[2].id).toBe(1)
  })

  it('sorts by due_date', () => {
    const sorted = sortTasks(mockTasks, 'due_date')
    expect(sorted[0].due_date).toBe('2024-01-03')
    expect(sorted[2].due_date).toBe('2024-01-01')
  })

  it('sorts by priority', () => {
    const sorted = sortTasks(mockTasks, 'priority')
    expect(sorted[0].priority).toBe('urgent')
    expect(sorted[1].priority).toBe('high')
    expect(sorted[2].priority).toBe('low')
  })

  it('handles empty array', () => {
    const sorted = sortTasks([], 'title')
    expect(sorted).toHaveLength(0)
  })

  it('sorts by updated_at (newest first)', () => {
    const tasks = [
      { id: 1, title: 'A', updated_at: '2024-01-01' },
      { id: 2, title: 'B', updated_at: '2024-01-03' },
      { id: 3, title: 'C', updated_at: '2024-01-02' }
    ]
    const sorted = sortTasks(tasks, 'updated_at')
    expect(sorted[0].id).toBe(2) // Most recent first
    expect(sorted[1].id).toBe(3)
    expect(sorted[2].id).toBe(1)
  })

  it('sorts with desc order', () => {
    const tasks = [
      { id: 1, title: 'Apple' },
      { id: 2, title: 'Zebra' },
      { id: 3, title: 'Banana' }
    ]
    const sorted = sortTasks(tasks, 'title', 'desc')
    expect(sorted[0].title).toBe('Zebra')
    expect(sorted[1].title).toBe('Banana')
    expect(sorted[2].title).toBe('Apple')
  })

  it('handles invalid sortBy value', () => {
    const tasks = [
      { id: 1, title: 'A' },
      { id: 2, title: 'B' }
    ]
    const sorted = sortTasks(tasks, 'invalid')
    expect(sorted).toHaveLength(2)
    // Should maintain original order when sortBy is invalid
  })
})

describe('formatTaskDate', () => {
  it('formats ISO date string', () => {
    const formatted = formatTaskDate('2024-01-15')
    expect(formatted).toBe('Jan 15, 2024')
  })

  it('handles empty date', () => {
    const formatted = formatTaskDate(null)
    expect(formatted).toBe('')
  })

  it('handles undefined date', () => {
    const formatted = formatTaskDate(undefined)
    expect(formatted).toBe('')
  })

  it('accepts custom format string', () => {
    const formatted = formatTaskDate('2024-01-15', 'yyyy-MM-dd')
    expect(formatted).toBe('2024-01-15')
  })
})

describe('calculateDaysRemaining', () => {
  it('returns positive days for future date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const days = calculateDaysRemaining(futureDate.toISOString())
    expect(days).toBe(5)
  })

  it('returns 0 for today', () => {
    const today = new Date().toISOString()
    const days = calculateDaysRemaining(today)
    expect(days).toBe(0)
  })

  it('returns negative days for past date', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 3)
    const days = calculateDaysRemaining(pastDate.toISOString())
    expect(days).toBe(-3)
  })

  it('handles null date', () => {
    const days = calculateDaysRemaining(null)
    expect(days).toBe(0)
  })
})

describe('getTaskStats', () => {
  const mockTasks = [
    { id: 1, completed_at: null, due_date: null },
    { id: 2, completed_at: '2024-01-01', due_date: null },
    { id: 3, completed_at: null, due_date: '2020-01-01' }, // Overdue
    { id: 4, completed_at: null, due_date: null }
  ]

  it('calculates total tasks', () => {
    const stats = getTaskStats(mockTasks)
    expect(stats.total).toBe(4)
  })

  it('calculates active tasks', () => {
    const stats = getTaskStats(mockTasks)
    expect(stats.active).toBe(3)
  })

  it('calculates completed tasks', () => {
    const stats = getTaskStats(mockTasks)
    expect(stats.completed).toBe(1)
  })

  it('calculates overdue tasks', () => {
    const stats = getTaskStats(mockTasks)
    expect(stats.overdue).toBeGreaterThanOrEqual(1)
  })

  it('calculates completion rate', () => {
    const stats = getTaskStats(mockTasks)
    expect(stats.completionRate).toBe(25) // 1 of 4 completed
  })

  it('handles empty task list', () => {
    const stats = getTaskStats([])
    expect(stats.total).toBe(0)
    expect(stats.completionRate).toBe(0)
  })

  it('handles all completed tasks', () => {
    const allCompleted = [
      { id: 1, completed_at: '2024-01-01' },
      { id: 2, completed_at: '2024-01-02' }
    ]
    const stats = getTaskStats(allCompleted)
    expect(stats.completionRate).toBe(100)
  })
})

describe('groupTasks', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      status_id: 1,
      category_id: 1,
      priority: 'high',
      status: { name: 'Open' },
      category: { name: 'Work' }
    },
    {
      id: 2,
      title: 'Task 2',
      status_id: 2,
      category_id: 1,
      priority: 'low',
      status: { name: 'In Progress' },
      category: { name: 'Work' }
    },
    {
      id: 3,
      title: 'Task 3',
      status_id: 1,
      category_id: 2,
      priority: 'high',
      status: { name: 'Open' },
      category: { name: 'Personal' }
    },
    {
      id: 4,
      title: 'Task 4',
      status_id: 1,
      category_id: null,
      priority: 'urgent',
      status: { name: 'Open' },
      category: null
    }
  ]

  it('groups by status', () => {
    const grouped = groupTasks(mockTasks, 'status')
    expect(grouped['Open']).toHaveLength(3)
    expect(grouped['In Progress']).toHaveLength(1)
  })

  it('groups by category', () => {
    const grouped = groupTasks(mockTasks, 'category')
    expect(grouped['Work']).toHaveLength(2)
    expect(grouped['Personal']).toHaveLength(1)
    expect(grouped['No Category']).toHaveLength(1)
  })

  it('groups by priority', () => {
    const grouped = groupTasks(mockTasks, 'priority')
    expect(grouped['High']).toHaveLength(2)
    expect(grouped['Low']).toHaveLength(1)
    expect(grouped['Urgent']).toHaveLength(1)
  })

  it('returns all tasks when groupBy is "none"', () => {
    const grouped = groupTasks(mockTasks, 'none')
    expect(grouped['All Tasks']).toHaveLength(4)
  })

  it('returns all tasks when groupBy is empty', () => {
    const grouped = groupTasks(mockTasks, '')
    expect(grouped['All Tasks']).toHaveLength(4)
  })

  it('returns all tasks when groupBy is null', () => {
    const grouped = groupTasks(mockTasks, null)
    expect(grouped['All Tasks']).toHaveLength(4)
  })

  it('handles tasks without status', () => {
    const tasksWithoutStatus = [
      { id: 1, status: null, category: { name: 'Work' }, priority: 'high' }
    ]
    const grouped = groupTasks(tasksWithoutStatus, 'status')
    expect(grouped['No Status']).toHaveLength(1)
  })

  it('handles tasks without category', () => {
    const tasksWithoutCategory = [
      { id: 1, status: { name: 'Open' }, category: null, priority: 'high' }
    ]
    const grouped = groupTasks(tasksWithoutCategory, 'category')
    expect(grouped['No Category']).toHaveLength(1)
  })

  it('handles invalid groupBy value', () => {
    const grouped = groupTasks(mockTasks, 'invalid')
    expect(grouped['All Tasks']).toHaveLength(4)
  })

  it('handles empty task array', () => {
    const grouped = groupTasks([], 'status')
    expect(Object.keys(grouped)).toHaveLength(0)
  })
})

describe('getDaysRemainingText', () => {
  it('returns empty string for null date', () => {
    expect(getDaysRemainingText(null)).toBe('')
  })

  it('returns empty string for undefined date', () => {
    expect(getDaysRemainingText(undefined)).toBe('')
  })

  it('returns "Due today" for today', () => {
    const today = new Date().toISOString()
    expect(getDaysRemainingText(today)).toBe('Due today')
  })

  it('returns "Due tomorrow" for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(getDaysRemainingText(tomorrow.toISOString())).toBe('Due tomorrow')
  })

  it('returns days remaining for future date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    expect(getDaysRemainingText(future.toISOString())).toBe('5 days remaining')
  })

  it('returns overdue message for past date (singular)', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(getDaysRemainingText(past.toISOString())).toBe('1 day overdue')
  })

  it('returns overdue message for past date (plural)', () => {
    const past = new Date()
    past.setDate(past.getDate() - 3)
    expect(getDaysRemainingText(past.toISOString())).toBe('3 days overdue')
  })
})

describe('isTaskOverdue', () => {
  it('returns false for null date', () => {
    expect(isTaskOverdue(null)).toBe(false)
  })

  it('returns false for undefined date', () => {
    expect(isTaskOverdue(undefined)).toBe(false)
  })

  it('returns false for today', () => {
    const today = new Date().toISOString()
    expect(isTaskOverdue(today)).toBe(false)
  })

  it('returns false for future date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    expect(isTaskOverdue(future.toISOString())).toBe(false)
  })

  it('returns true for past date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isTaskOverdue(past.toISOString())).toBe(true)
  })
})

describe('calculateDaysOpen', () => {
  it('calculates days from past date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 5)
    const days = calculateDaysOpen(past.toISOString())
    expect(days).toBeGreaterThanOrEqual(5)
    expect(days).toBeLessThanOrEqual(6) // Account for timing
  })

  it('returns 0 for today', () => {
    const today = new Date().toISOString()
    const days = calculateDaysOpen(today)
    expect(days).toBeLessThanOrEqual(1) // 0 or 1 depending on timing
  })

  it('handles ISO date string', () => {
    const days = calculateDaysOpen('2024-01-01')
    expect(days).toBeGreaterThan(0)
  })

  it('handles Date object', () => {
    const date = new Date()
    date.setDate(date.getDate() - 10)
    const days = calculateDaysOpen(date)
    expect(days).toBeGreaterThanOrEqual(10)
  })
})

describe('getPriorityConfig', () => {
  it('returns config for valid priority', () => {
    const config = getPriorityConfig('high')
    expect(config).toBeDefined()
    expect(config.label).toBe('High')
    expect(config.color).toBeDefined()
  })

  it('returns medium config for invalid priority', () => {
    const config = getPriorityConfig('invalid')
    expect(config).toBeDefined()
    expect(config.label).toBe('Medium')
  })

  it('returns medium config for null priority', () => {
    const config = getPriorityConfig(null)
    expect(config).toBeDefined()
    expect(config.label).toBe('Medium')
  })

  it('has all required properties', () => {
    const config = getPriorityConfig('urgent')
    expect(config.label).toBeDefined()
    expect(config.color).toBeDefined()
    expect(config.bgClass).toBeDefined()
    expect(config.textClass).toBeDefined()
  })
})

describe('generateRandomColor', () => {
  it('returns a hex color code', () => {
    const color = generateRandomColor()
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns a color from the predefined list', () => {
    const validColors = [
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f43f5e',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#14b8a6',
      '#06b6d4',
      '#6366f1'
    ]
    const color = generateRandomColor()
    expect(validColors).toContain(color)
  })

  it('can generate different colors', () => {
    const colors = new Set()
    for (let i = 0; i < 20; i++) {
      colors.add(generateRandomColor())
    }
    // Should have generated at least 2 different colors in 20 tries
    expect(colors.size).toBeGreaterThanOrEqual(2)
  })
})
