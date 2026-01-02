/**
 * @fileoverview Utility for mapping database errors to user-friendly messages.
 * Includes comprehensive error mappings for tasks and notes.
 */

/**
 * Task-specific error messages
 * Maps task operations to user-friendly error messages
 */
export const TASK_ERRORS = {
  // Creation errors
  CREATE_MISSING_TITLE: 'Task title is required. Please provide a title for your task.',
  CREATE_TITLE_TOO_LONG: 'Task title is too long. Please keep it under 500 characters.',
  CREATE_INVALID_PRIORITY:
    'Invalid priority value. Please select a valid priority (low, medium, high, urgent).',
  CREATE_INVALID_STATUS: 'Invalid status. The selected status could not be found.',
  CREATE_INVALID_CATEGORY: 'Invalid category. The selected category could not be found.',
  CREATE_INVALID_DUE_DATE: 'Invalid due date. Please provide a valid date in the future.',
  CREATE_FAILED: 'Failed to create task. Please try again.',
  CREATE_PERMISSION_DENIED: 'You do not have permission to create tasks.',

  // Update errors
  UPDATE_NOT_FOUND: 'Task not found. It may have been deleted. Please refresh and try again.',
  UPDATE_MISSING_TITLE: 'Task title cannot be empty. Please provide a title.',
  UPDATE_TITLE_TOO_LONG: 'Task title is too long. Please keep it under 500 characters.',
  UPDATE_INVALID_PRIORITY:
    'Invalid priority value. Please select a valid priority (low, medium, high, urgent).',
  UPDATE_INVALID_STATUS:
    'Invalid status. The selected status could not be found. Please refresh and try again.',
  UPDATE_INVALID_CATEGORY:
    'Invalid category. The selected category could not be found. Please refresh and try again.',
  UPDATE_INVALID_DUE_DATE: 'Invalid due date. Please provide a valid date.',
  UPDATE_FAILED: 'Failed to update task. Please try again.',
  UPDATE_PERMISSION_DENIED: 'You do not have permission to update this task.',
  UPDATE_CONFLICT: 'Task has been modified by another action. Please refresh and try again.',

  // Deletion errors
  DELETE_NOT_FOUND: 'Task not found. It may have already been deleted.',
  DELETE_FAILED: 'Failed to delete task. Please try again.',
  DELETE_PERMISSION_DENIED: 'You do not have permission to delete this task.',

  // Fetch errors
  FETCH_FAILED: 'Failed to load tasks. Please refresh the page and try again.',
  FETCH_PERMISSION_DENIED: 'You do not have permission to view tasks.',
  FETCH_NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',

  // Toggle completion errors
  TOGGLE_NOT_FOUND: 'Task not found. It may have been deleted. Please refresh and try again.',
  TOGGLE_FAILED: 'Failed to update task completion status. Please try again.',
  TOGGLE_PERMISSION_DENIED: 'You do not have permission to update this task.',

  // Validation errors
  VALIDATION_MISSING_TITLE: 'Task title is required.',
  VALIDATION_TITLE_TOO_LONG: 'Task title must be less than 500 characters.',
  VALIDATION_INVALID_PRIORITY: 'Priority must be one of: low, medium, high, urgent.',
  VALIDATION_INVALID_DUE_DATE: 'Due date must be a valid date.',
  VALIDATION_DESCRIPTION_TOO_LONG: 'Task description must be less than 5000 characters.',

  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred while processing your task. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign out and sign in again.'
}

/**
 * Note-specific error messages
 * Maps note operations to user-friendly error messages
 */
export const NOTE_ERRORS = {
  // Creation errors
  CREATE_MISSING_TITLE: 'Note title is required. Please provide a title for your note.',
  CREATE_MISSING_CONTENT: 'Note content is required. Please provide some content for your note.',
  CREATE_CONTENT_TOO_LONG: 'Note content is too long. Please keep it under 50,000 characters.',
  CREATE_INVALID_TOPIC: 'Invalid topic. The selected topic could not be found.',
  CREATE_MISSING_TOPIC: 'Topic is required. Please select or create a topic for your note.',
  CREATE_FAILED: 'Failed to create note. Please try again.',
  CREATE_PERMISSION_DENIED: 'You do not have permission to create notes.',

  // Update errors
  UPDATE_NOT_FOUND: 'Note not found. It may have been deleted. Please refresh and try again.',
  UPDATE_MISSING_CONTENT: 'Note content cannot be empty. Please provide some content.',
  UPDATE_CONTENT_TOO_LONG: 'Note content is too long. Please keep it under 50,000 characters.',
  UPDATE_INVALID_TOPIC:
    'Invalid topic. The selected topic could not be found. Please refresh and try again.',
  UPDATE_FAILED: 'Failed to update note. Please try again.',
  UPDATE_PERMISSION_DENIED: 'You do not have permission to update this note.',
  UPDATE_CONFLICT: 'Note has been modified by another action. Please refresh and try again.',

  // Deletion errors
  DELETE_NOT_FOUND: 'Note not found. It may have already been deleted.',
  DELETE_FAILED: 'Failed to delete note. Please try again.',
  DELETE_PERMISSION_DENIED: 'You do not have permission to delete this note.',

  // Fetch errors
  FETCH_NOTE_FAILED: 'Failed to load notes. Please refresh the page and try again.',
  FETCH_TOPIC_FAILED: 'Failed to load topics. Please refresh the page and try again.',
  FETCH_PERMISSION_DENIED: 'You do not have permission to view notes.',
  FETCH_NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',

  // Topic errors
  TOPIC_CREATE_MISSING_NAME: 'Topic name is required. Please provide a name for your topic.',
  TOPIC_CREATE_NAME_TOO_LONG: 'Topic name is too long. Please keep it under 100 characters.',
  TOPIC_CREATE_DUPLICATE: 'A topic with this name already exists. Please choose a different name.',
  TOPIC_CREATE_FAILED: 'Failed to create topic. Please try again.',
  TOPIC_UPDATE_NOT_FOUND:
    'Topic not found. It may have been deleted. Please refresh and try again.',
  TOPIC_UPDATE_MISSING_NAME: 'Topic name cannot be empty. Please provide a name.',
  TOPIC_UPDATE_NAME_TOO_LONG: 'Topic name is too long. Please keep it under 100 characters.',
  TOPIC_UPDATE_DUPLICATE: 'A topic with this name already exists. Please choose a different name.',
  TOPIC_UPDATE_FAILED: 'Failed to update topic. Please try again.',
  TOPIC_DELETE_NOT_FOUND: 'Topic not found. It may have already been deleted.',
  TOPIC_DELETE_HAS_NOTES:
    'Cannot delete topic that contains notes. Please move or delete the notes first.',
  TOPIC_DELETE_FAILED: 'Failed to delete topic. Please try again.',

  // Validation errors
  VALIDATION_MISSING_CONTENT: 'Note content is required.',
  VALIDATION_CONTENT_TOO_LONG: 'Note content must be less than 50,000 characters.',
  VALIDATION_MISSING_TOPIC: 'Topic is required.',
  VALIDATION_INVALID_COLOR: 'Invalid topic color. Please provide a valid hex color code.',

  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred while processing your note. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign out and sign in again.'
}

/**
 * Maps a Supabase/Postgres error to a more user-friendly string.
 *
 * @param {object} error - The error object from Supabase.
 * @param {string} [context='item'] - A string to provide context for the error message (e.g., 'task', 'category').
 * @returns {string} A user-friendly error message.
 */
export function mapSupabaseError(error, context = 'item') {
  if (!error) {
    return 'An unknown error occurred.'
  }

  // Log the full error for debugging purposes in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Supabase Error:', error)
  }

  // Handle common Postgres error codes
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        if (error.message.includes('name')) {
          return `A ${context} with this name already exists. Please choose a different name.`
        }
        return `This ${context} conflicts with an existing one.`

      case '23503': // foreign_key_violation
        return `The selected item for this ${context} could not be found. It may have been deleted. Please refresh and try again.`

      case '23502': // not_null_violation
        if (error.message.includes('title')) {
          return 'The title field cannot be empty.'
        }
        return `A required field for this ${context} was left empty.`

      case '42P01': // undefined_table
        return 'A database error occurred. The required table could not be found.'

      case 'PGRST116': // The result contains 0 rows
        return `The requested ${context} could not be found.`
    }
  }

  // Handle common network or auth errors by message content
  if (error.message) {
    const message = error.message.toLowerCase()
    if (message.includes('network request failed')) {
      return 'Network error. Please check your internet connection and try again.'
    }
    if (message.includes('jwt expired')) {
      return 'Your session has expired. Please sign out and sign in again.'
    }
    if (message.includes('permission denied')) {
      return 'You do not have permission to perform this action.'
    }
  }

  // Default fallback message
  return error.message || 'An unexpected error occurred. Please try again later.'
}
