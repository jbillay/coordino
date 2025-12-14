/**
 * Timezone conversion utilities for international meeting scheduling
 * Uses date-fns-tz for accurate timezone conversion with DST support
 */

import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz'

/**
 * Convert UTC time to local timezone
 * @param {Date|string} utcTime - UTC timestamp
 * @param {string} timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns {Date} Local time in the specified timezone
 */
export function toLocalTime(utcTime, timezone) {
  const date = typeof utcTime === 'string' ? new Date(utcTime) : utcTime
  return toZonedTime(date, timezone)
}

/**
 * Convert local time to UTC
 * @param {Date|string} localTime - Local timestamp
 * @param {string} timezone - IANA timezone identifier
 * @returns {Date} UTC timestamp
 */
export function toUTC(localTime, timezone) {
  const date = typeof localTime === 'string' ? new Date(localTime) : localTime
  return fromZonedTime(date, timezone)
}

/**
 * Format time with timezone information
 * @param {Date} time - Time to format
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} Formatted string like "2:00 PM EST (America/New_York)"
 */
export function formatWithTimezone(time, timezone) {
  // Format time in 12-hour format with timezone abbreviation
  const timeStr = formatInTimeZone(time, timezone, 'h:mm a zzz')
  // Return format: "2:00 PM EST (America/New_York)"
  return `${timeStr} (${timezone})`
}

/**
 * Calculate participant status based on meeting time and working hours
 * @param {Date} meetingTime - Meeting time in participant's local timezone
 * @param {Object} config - Country configuration with working hours
 * @param {Object|null} holiday - Holiday object if date is a holiday, null otherwise
 * @param {boolean} isWorkDay - Whether the day is a work day
 * @returns {Object} Object with { status, reason } where status is 'green'|'orange'|'red'|'critical'
 */
export function calculateStatus(meetingTime, config, holiday, isWorkDay) {
  // Priority 1: Check for holiday → critical (T092)
  if (holiday) {
    return {
      status: 'critical',
      reason: `National Holiday: ${holiday.localName || holiday.name}`
    }
  }

  // Priority 1b: Check for non-working day → critical (T093)
  if (!isWorkDay) {
    return {
      status: 'critical',
      reason: 'Non-working day'
    }
  }

  // Get hour and minute from meeting time
  const hours = meetingTime.getHours()
  const minutes = meetingTime.getMinutes()
  const timeMinutes = hours * 60 + minutes // Convert to minutes since midnight

  // Parse config times to minutes
  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const greenStart = parseTime(config.green_start)
  const greenEnd = parseTime(config.green_end)
  const orangeMorningStart = parseTime(config.orange_morning_start)
  const orangeMorningEnd = parseTime(config.orange_morning_end)
  const orangeEveningStart = parseTime(config.orange_evening_start)
  const orangeEveningEnd = parseTime(config.orange_evening_end)

  // Priority 2: Check if within green range → green
  if (timeMinutes >= greenStart && timeMinutes < greenEnd) {
    return {
      status: 'green',
      reason: 'Optimal working hours'
    }
  }

  // Priority 3: Check if within orange range → orange
  if (timeMinutes >= orangeMorningStart && timeMinutes < orangeMorningEnd) {
    return {
      status: 'orange',
      reason: 'Acceptable (early)'
    }
  }

  if (timeMinutes >= orangeEveningStart && timeMinutes < orangeEveningEnd) {
    return {
      status: 'orange',
      reason: 'Acceptable (late)'
    }
  }

  // Priority 4: Outside acceptable hours → red
  return {
    status: 'red',
    reason: 'Outside working hours'
  }
}
