/**
 * Task Utility Functions
 * Pure functions for task-related operations
 *
 * @module features/tasks/utils
 */

import { format, parseISO, differenceInDays, differenceInCalendarDays } from 'date-fns'

/**
 * Priority display configuration
 * @constant
 */
export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: '#3b82f6',
    bgClass: 'bg-blue-100 dark:bg-blue-900',
    textClass: 'text-blue-800 dark:text-blue-200'
  },
  medium: {
    label: 'Medium',
    color: '#eab308',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900',
    textClass: 'text-yellow-800 dark:text-yellow-200'
  },
  high: {
    label: 'High',
    color: '#f97316',
    bgClass: 'bg-orange-100 dark:bg-orange-900',
    textClass: 'text-orange-800 dark:text-orange-200'
  },
  urgent: {
    label: 'Urgent',
    color: '#ef4444',
    bgClass: 'bg-red-100 dark:bg-red-900',
    textClass: 'text-red-800 dark:text-red-200'
  }
}

/**
 * Get CSS classes for priority badge
 * @param {string} priority - Priority level
 * @returns {string} Tailwind CSS classes
 */
export const getPriorityClasses = (priority) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return `${config.bgClass} ${config.textClass}`
}

/**
 * Get priority configuration
 * @param {string} priority - Priority level
 * @returns {Object} Priority configuration object
 */
export const getPriorityConfig = (priority) => PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

/**
 * Get priority label for display
 * @param {string} priority - Priority level
 * @returns {string} Capitalized priority label
 */
export const getPriorityLabel = (priority) => {
  if (!priority) {
    return ''
  }
  const config = PRIORITY_CONFIG[priority]
  return config ? config.label : priority.charAt(0).toUpperCase() + priority.slice(1)
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} formatString - Format string (default: 'MMM d, yyyy')
 * @returns {string} Formatted date string
 */
export const formatTaskDate = (date, formatString = 'MMM d, yyyy') => {
  if (!date) {
    return ''
  }
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

/**
 * Calculate days remaining until due date
 * @param {string|Date} dueDate - Due date
 * @returns {number} Days remaining (negative if overdue, 0 if no date)
 */
export const calculateDaysRemaining = (dueDate) => {
  if (!dueDate) {
    return 0
  }
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
  return differenceInCalendarDays(dateObj, new Date())
}

/**
 * Get formatted days remaining message
 * @param {string|Date} dueDate - Due date
 * @returns {string} Human-readable message
 */
export const getDaysRemainingText = (dueDate) => {
  if (!dueDate) {
    return ''
  }

  const days = calculateDaysRemaining(dueDate)

  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
  } else if (days === 0) {
    return 'Due today'
  } else if (days === 1) {
    return 'Due tomorrow'
  }
  return `${days} days remaining`
}

/**
 * Check if task is overdue
 * @param {string|Date} dueDate - Due date
 * @returns {boolean} True if task is overdue
 */
export const isTaskOverdue = (dueDate) => {
  if (!dueDate) {
    return false
  }
  const days = calculateDaysRemaining(dueDate)
  return days < 0
}

/**
 * Calculate how many days a task has been open
 * @param {string|Date} createdAt - Task creation date
 * @returns {number} Days open
 */
export const calculateDaysOpen = (createdAt) => {
  const dateObj = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt
  return differenceInDays(new Date(), dateObj)
}

/**
 * Sort tasks by various criteria
 * @param {Array} tasks - Array of tasks
 * @param {string} sortBy - Sort criteria
 * @param {string} sortOrder - 'asc' or 'desc'
 * @returns {Array} Sorted tasks
 */
export const sortTasks = (tasks, sortBy, sortOrder = 'asc') => {
  const sorted = [...tasks]

  const compareFn = (a, b) => {
    let aValue, bValue

    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        return aValue.localeCompare(bValue)

      case 'priority': {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        aValue = priorityOrder[a.priority] || 2
        bValue = priorityOrder[b.priority] || 2
        return bValue - aValue // Higher priority first
      }

      case 'due_date':
        aValue = a.due_date ? new Date(a.due_date).getTime() : -Infinity
        bValue = b.due_date ? new Date(b.due_date).getTime() : -Infinity
        return bValue - aValue // Latest first (tasks without dates go to the end)

      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        return bValue - aValue // Newest first by default

      case 'updated_at':
        aValue = new Date(a.updated_at).getTime()
        bValue = new Date(b.updated_at).getTime()
        return bValue - aValue // Most recently updated first

      default:
        return 0
    }
  }

  sorted.sort(compareFn)

  if (
    sortOrder === 'desc' &&
    sortBy !== 'priority' &&
    sortBy !== 'created_at' &&
    sortBy !== 'updated_at'
  ) {
    sorted.reverse()
  }

  return sorted
}

/**
 * Group tasks by specified field
 * @param {Array} tasks - Array of tasks
 * @param {string} groupBy - Field to group by ('status', 'category', 'priority', 'none')
 * @returns {Object} Grouped tasks as { groupName: [tasks] }
 */
export const groupTasks = (tasks, groupBy) => {
  if (groupBy === 'none' || !groupBy) {
    return { 'All Tasks': tasks }
  }

  const groups = {}

  tasks.forEach((task) => {
    let groupKey

    switch (groupBy) {
      case 'status':
        groupKey = task.status?.name || 'No Status'
        break

      case 'category':
        groupKey = task.category?.name || 'No Category'
        break

      case 'priority':
        groupKey = PRIORITY_CONFIG[task.priority]?.label || 'Medium'
        break

      default:
        groupKey = 'All Tasks'
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }

    groups[groupKey].push(task)
  })

  return groups
}

/**
 * Filter tasks by various criteria
 * @param {Array} tasks - Array of tasks
 * @param {Object} filters - Filter criteria
 * @param {string} filters.status - Status ID
 * @param {string} filters.category - Category ID
 * @param {string} filters.priority - Priority level
 * @param {string} filters.search - Search query
 * @param {boolean} filters.showCompleted - Include completed tasks
 * @returns {Array} Filtered tasks
 */
export const filterTasks = (tasks, filters = {}) => {
  let filtered = [...tasks]

  // Filter by completion status
  if (filters.showCompleted === false) {
    filtered = filtered.filter((task) => !task.completed_at)
  }

  // Filter by status
  if (filters.status) {
    filtered = filtered.filter((task) => task.status_id === filters.status)
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter((task) => task.category_id === filters.category)
  }

  // Filter by priority
  if (filters.priority) {
    filtered = filtered.filter((task) => task.priority === filters.priority)
  }

  // Filter by search query (title and description)
  if (filters.search && filters.search.trim()) {
    const query = filters.search.toLowerCase().trim()
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.owner && task.owner.toLowerCase().includes(query))
    )
  }

  return filtered
}

/**
 * Get task statistics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Task statistics
 */
export const getTaskStats = (tasks) => {
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed_at).length
  const active = total - completed
  const overdue = tasks.filter((t) => !t.completed_at && isTaskOverdue(t.due_date)).length

  const byPriority = {
    urgent: tasks.filter((t) => !t.completed_at && t.priority === 'urgent').length,
    high: tasks.filter((t) => !t.completed_at && t.priority === 'high').length,
    medium: tasks.filter((t) => !t.completed_at && t.priority === 'medium').length,
    low: tasks.filter((t) => !t.completed_at && t.priority === 'low').length
  }

  return {
    total,
    completed,
    active,
    overdue,
    byPriority,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

/**
 * Generate a random color for categories/statuses
 * @returns {string} Hex color code
 */
export const generateRandomColor = () => {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#6366f1' // indigo
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
