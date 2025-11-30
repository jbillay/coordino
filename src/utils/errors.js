/**
 * @fileoverview Utility for mapping database errors to user-friendly messages.
 */

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
