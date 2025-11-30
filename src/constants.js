/**
 * @fileoverview Centralized constants for the Coordino application.
 */

/**
 * The key used to store the theme preference in localStorage.
 * @type {string}
 */
export const THEME_STORAGE_KEY = 'coordino-theme'

/**
 * Array of priority levels for tasks.
 * @type {string[]}
 */
export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent']

/**
 * The default field to sort tasks by.
 * @type {string}
 */
export const DEFAULT_SORT_BY = 'created_at'

/**
 * The default grouping for tasks.
 * @type {string}
 */
export const DEFAULT_GROUP_BY = 'none'
