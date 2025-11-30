import { describe, it, expect, vi } from 'vitest'
import { mapSupabaseError } from '../errors'

describe('mapSupabaseError', () => {
  it('returns a default message for null or undefined errors', () => {
    expect(mapSupabaseError(null)).toBe('An unknown error occurred.')
    expect(mapSupabaseError(undefined)).toBe('An unknown error occurred.')
  })

  it('handles unique_violation (23505) for a name conflict', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint "categories_name_key"' }
    expect(mapSupabaseError(error, 'category')).toBe('A category with this name already exists. Please choose a different name.')
  })

  it('handles generic unique_violation (23505)', () => {
    const error = { code: '23505', message: 'some other unique constraint' }
    expect(mapSupabaseError(error, 'item')).toBe('This item conflicts with an existing one.')
  })

  it('handles foreign_key_violation (23503)', () => {
    const error = { code: '23503', message: 'foreign key constraint fail' }
    expect(mapSupabaseError(error, 'task')).toBe('The selected item for this task could not be found. It may have been deleted. Please refresh and try again.')
  })

  it('handles not_null_violation (23502) for a title', () => {
    const error = { code: '23502', message: 'null value in column "title"' }
    expect(mapSupabaseError(error)).toBe('The title field cannot be empty.')
  })

  it('handles generic not_null_violation (23502)', () => {
    const error = { code: '23502', message: 'null value in column "description"' }
    expect(mapSupabaseError(error, 'task')).toBe('A required field for this task was left empty.')
  })

  it('handles undefined_table (42P01)', () => {
    const error = { code: '42P01', message: 'table not found' }
    expect(mapSupabaseError(error)).toBe('A database error occurred. The required table could not be found.')
  })

  it('handles PGRST116 (0 rows)', () => {
    const error = { code: 'PGRST116', message: 'The result contains 0 rows' }
    expect(mapSupabaseError(error, 'item')).toBe('The requested item could not be found.')
  })

  it('handles network errors from message content', () => {
    const error = { message: 'Network request failed' }
    expect(mapSupabaseError(error)).toBe('Network error. Please check your internet connection and try again.')
  })

  it('handles JWT expired errors from message content', () => {
    const error = { message: 'JWT expired' }
    expect(mapSupabaseError(error)).toBe('Your session has expired. Please sign out and sign in again.')
  })

  it('handles permission denied errors from message content', () => {
    const error = { message: 'permission denied for table tasks' }
    expect(mapSupabaseError(error)).toBe('You do not have permission to perform this action.')
  })

  it('returns the error message as a fallback', () => {
    const error = { message: 'A very specific and unexpected error.' }
    expect(mapSupabaseError(error)).toBe('A very specific and unexpected error.')
  })

  it('returns a generic fallback if no message or code is present', () => {
    const error = { details: 'Something went wrong' }
    expect(mapSupabaseError(error)).toBe('An unexpected error occurred. Please try again later.')
  })

  it('logs the full error in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = { code: '12345', message: 'Dev error' }
    mapSupabaseError(error)

    expect(consoleErrorSpy).toHaveBeenCalledWith('Supabase Error:', error)

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = originalNodeEnv
  })
})
