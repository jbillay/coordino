/**
 * Timezone Converter Utility
 * Handles timezone conversions using IANA timezone identifiers
 * Uses date-fns-tz for accurate conversions including DST
 */

import * as dateFnsTz from 'date-fns-tz'
import { parseISO } from 'date-fns'

/**
 * Convert date to specific timezone
 * @param {Date|string} date - Date object or ISO string
 * @param {string} timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns {Date} Date object in target timezone
 * @throws {RangeError} If timezone is invalid
 *
 * @example
 * const utcDate = new Date('2025-12-15T14:00:00Z')
 * const nyTime = convertToTimezone(utcDate, 'America/New_York')
 * // Returns Date representing 9:00 AM in New York
 */
export function convertToTimezone(date, timezone) {
  // Input validation
  if (!date) {
    throw new Error('Date is required')
  }

  if (!timezone || typeof timezone !== 'string') {
    throw new Error('Valid timezone string is required')
  }

  // Normalize input to Date object
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided')
  }

  // Convert to target timezone
  const zonedDate = dateFnsTz.toZonedTime(dateObj, timezone)
  if (isNaN(zonedDate.getTime())) {
    throw new RangeError(`Invalid timezone: ${timezone}`)
  }
  return zonedDate
}

/**
 * Format date in specific timezone
 * @param {Date|string} date - Date to format
 * @param {string} timezone - IANA timezone identifier
 * @param {string} [formatString='HH:mm'] - Format string (date-fns format)
 * @returns {string} Formatted time string
 * @throws {RangeError} If timezone is invalid
 *
 * @example
 * formatLocalTime(new Date(), 'Europe/Paris', 'HH:mm') // '15:30'
 * formatLocalTime(new Date(), 'Asia/Tokyo', 'h:mm a') // '11:30 PM'
 */
export function formatLocalTime(date, timezone, formatString = 'HH:mm') {
  // Input validation
  if (!date) {
    throw new Error('Date is required')
  }

  if (!timezone) {
    throw new Error('Timezone is required')
  }

  // Normalize to Date object
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided')
  }

  // Format in target timezone
  try {
    const formatted = dateFnsTz.formatInTimeZone(dateObj, timezone, formatString)
    // formatInTimeZone can return a string like 'Invalid Date2025-12-15T12:00:00.000Z'
    // with an invalid timezone. A simple check for 'Invalid Date' is enough.
    if (formatted.includes('Invalid Date')) {
      throw new RangeError(`Invalid timezone: ${timezone}`)
    }
    return formatted
  } catch (error) {
    if (error instanceof RangeError) {
      throw new RangeError(`Invalid timezone: ${timezone}`)
    }
    throw error
  }
}

/**
 * Get UTC offset for timezone at specific date
 * @param {Date} date - Date to check offset for
 * @param {string} timezone - IANA timezone identifier
 * @returns {Object} Offset information
 * @returns {number} return.offsetMinutes - Offset in minutes from UTC
 * @returns {string} return.offsetString - Formatted offset (e.g., '+05:30', '-08:00')
 * @returns {boolean} return.isDST - Whether DST is active
 *
 * @example
 * getTimezoneOffset(new Date('2025-06-15'), 'America/New_York')
 * // { offsetMinutes: -240, offsetString: '-04:00', isDST: true }
 *
 * getTimezoneOffset(new Date('2025-12-15'), 'America/New_York')
 * // { offsetMinutes: -300, offsetString: '-05:00', isDST: false }
 */
export function getTimezoneOffset(date, timezone) {
  // Input validation
  if (!date || isNaN(date.getTime())) {
    throw new Error('Valid date is required')
  }

  if (!timezone) {
    throw new Error('Timezone is required')
  }

  const offsetMilliseconds = dateFnsTz.getTimezoneOffset(timezone, date)
  if (isNaN(offsetMilliseconds)) {
    throw new RangeError(`Invalid timezone: ${timezone}`)
  }
  const offsetMinutes = offsetMilliseconds / (1000 * 60)

  // Format as string (e.g., '+05:30' or '-08:00')
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
  const offsetMins = Math.abs(offsetMinutes) % 60
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const offsetString = `${sign}${String(offsetHours).padStart(2, '0')}:${String(
    offsetMins
  ).padStart(2, '0')}`

  // Determine DST (simplified - checks if offset differs from January offset)
  const janOffset = getOffsetMinutes(new Date(date.getFullYear(), 0, 1), timezone)
  const isDST = offsetMinutes !== janOffset

  return {
    offsetMinutes,
    offsetString,
    isDST
  }
}

// Helper function
function getOffsetMinutes(date, timezone) {
  const offsetMilliseconds = dateFnsTz.getTimezoneOffset(timezone, date)
  if (isNaN(offsetMilliseconds)) {
    throw new RangeError(`Invalid timezone: ${timezone}`)
  }
  return offsetMilliseconds / (1000 * 60)
}

/**
 * Get timezones for country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {Array<Object>} Array of timezone objects
 * @returns {string} return[].timezone - IANA timezone identifier
 * @returns {string} return[].name - Human-readable name
 * @returns {string} return[].abbreviation - Common abbreviation (EST, PST, etc.)
 *
 * @example
 * getTimezonesForCountry('US')
 * // [
 * //   { timezone: 'America/New_York', name: 'Eastern Time', abbreviation: 'EST' },
 * //   { timezone: 'America/Chicago', name: 'Central Time', abbreviation: 'CST' },
 * //   { timezone: 'America/Denver', name: 'Mountain Time', abbreviation: 'MST' },
 * //   { timezone: 'America/Los_Angeles', name: 'Pacific Time', abbreviation: 'PST' }
 * // ]
 */
export function getTimezonesForCountry(countryCode) {
  // Input validation
  if (!countryCode || countryCode.length !== 2) {
    throw new Error('Valid ISO 3166-1 alpha-2 country code required')
  }

  const code = countryCode.toUpperCase()

  // Predefined mapping of countries to timezones
  const countryTimezones = {
    US: [
      { timezone: 'America/New_York', name: 'Eastern Time', abbreviation: 'EST' },
      { timezone: 'America/Chicago', name: 'Central Time', abbreviation: 'CST' },
      { timezone: 'America/Denver', name: 'Mountain Time', abbreviation: 'MST' },
      {
        timezone: 'America/Los_Angeles',
        name: 'Pacific Time',
        abbreviation: 'PST'
      },
      { timezone: 'America/Anchorage', name: 'Alaska Time', abbreviation: 'AKST' },
      { timezone: 'Pacific/Honolulu', name: 'Hawaii Time', abbreviation: 'HST' }
    ],
    GB: [
      {
        timezone: 'Europe/London',
        name: 'Greenwich Mean Time',
        abbreviation: 'GMT'
      }
    ],
    FR: [
      {
        timezone: 'Europe/Paris',
        name: 'Central European Time',
        abbreviation: 'CET'
      }
    ],
    DE: [
      {
        timezone: 'Europe/Berlin',
        name: 'Central European Time',
        abbreviation: 'CET'
      }
    ],
    ES: [
      {
        timezone: 'Europe/Madrid',
        name: 'Central European Time',
        abbreviation: 'CET'
      },
      { timezone: 'Atlantic/Canary', name: 'Canary Islands', abbreviation: 'WET' }
    ],
    JP: [
      {
        timezone: 'Asia/Tokyo',
        name: 'Japan Standard Time',
        abbreviation: 'JST'
      }
    ],
    CN: [
      {
        timezone: 'Asia/Shanghai',
        name: 'China Standard Time',
        abbreviation: 'CST'
      }
    ],
    AU: [
      {
        timezone: 'Australia/Sydney',
        name: 'Australian Eastern Time',
        abbreviation: 'AEST'
      },
      {
        timezone: 'Australia/Melbourne',
        name: 'Australian Eastern Time',
        abbreviation: 'AEST'
      },
      {
        timezone: 'Australia/Perth',
        name: 'Australian Western Time',
        abbreviation: 'AWST'
      }
    ],
    IN: [
      {
        timezone: 'Asia/Kolkata',
        name: 'India Standard Time',
        abbreviation: 'IST'
      }
    ],
    AE: [{ timezone: 'Asia/Dubai', name: 'Gulf Standard Time', abbreviation: 'GST' }],
    IL: [
      {
        timezone: 'Asia/Jerusalem',
        name: 'Israel Standard Time',
        abbreviation: 'IST'
      }
    ]
  }

  return countryTimezones[code] || []
}
