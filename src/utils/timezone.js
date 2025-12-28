/**
 * Timezone Utilities
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 *
 * Provides timezone conversion, validation, and formatting utilities
 * Uses the IANA timezone database via Intl API
 */

/**
 * Get list of all available timezones
 * @returns {string[]} Array of IANA timezone identifiers
 */
export const getAvailableTimezones = () => {
  // Using Intl.supportedValuesOf if available (modern browsers)
  if (Intl.supportedValuesOf) {
    const timezones = Intl.supportedValuesOf('timeZone')
    // Ensure UTC is always included (it might be missing or be Etc/UTC)
    if (!timezones.includes('UTC')) {
      return ['UTC', ...timezones]
    }
    return timezones
  }

  // Fallback to common timezones
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'America/Honolulu',
    'America/Toronto',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Europe/Stockholm',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Seoul',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'Africa/Johannesburg',
    'Africa/Cairo'
  ]
}

/**
 * Validate if a string is a valid IANA timezone identifier
 * @param {string} timezone - Timezone identifier to validate
 * @returns {boolean} True if valid timezone
 */
export const isValidTimezone = (timezone) => {
  if (!timezone || typeof timezone !== 'string') {
    return false
  }

  // Reject common timezone abbreviations (they're not IANA identifiers)
  const abbreviations = ['EST', 'EDT', 'CST', 'CDT', 'MST', 'MDT', 'PST', 'PDT', 'GMT', 'BST']
  if (abbreviations.includes(timezone.toUpperCase())) {
    return false
  }

  try {
    // Try to create a DateTimeFormat with the timezone
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Get the user's current timezone
 * @returns {string} IANA timezone identifier
 */
export const getCurrentTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

/**
 * Convert a date from one timezone to another
 * @param {Date} date - Date to convert
 * @param {string} fromTimezone - Source timezone (IANA identifier)
 * @param {string} toTimezone - Target timezone (IANA identifier)
 * @returns {Date} Converted date
 */
export const convertTimezone = (date, fromTimezone, toTimezone) => {
  if (!date || !(date instanceof Date)) {
    throw new Error('Invalid date provided')
  }

  if (!isValidTimezone(fromTimezone)) {
    throw new Error(`Invalid source timezone: ${fromTimezone}`)
  }

  if (!isValidTimezone(toTimezone)) {
    throw new Error(`Invalid target timezone: ${toTimezone}`)
  }

  // If same timezone, return a copy of the original date
  if (fromTimezone === toTimezone) {
    return new Date(date.getTime())
  }

  // Get the date string in the source timezone
  const dateString = date.toLocaleString('en-US', { timeZone: fromTimezone })

  // Create a new date from that string
  const sourceDate = new Date(dateString)

  // Get the offset difference
  const sourceOffset = getTimezoneOffset(date, fromTimezone)
  const targetOffset = getTimezoneOffset(date, toTimezone)
  const offsetDiff = targetOffset - sourceOffset

  // Apply the offset difference
  return new Date(sourceDate.getTime() + offsetDiff)
}

/**
 * Get timezone offset in milliseconds for a specific date
 * @param {Date} date - Date to get offset for
 * @param {string} timezone - IANA timezone identifier
 * @returns {number} Offset in milliseconds
 */
export const getTimezoneOffset = (date, timezone) => {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`)
  }

  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))

  return tzDate.getTime() - utcDate.getTime()
}

/**
 * Format a date in a specific timezone
 * @param {Date} date - Date to format
 * @param {string} timezone - IANA timezone identifier
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatInTimezone = (date, timezone, options = {}) => {
  if (!date || !(date instanceof Date)) {
    throw new Error('Invalid date provided')
  }

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`)
  }

  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    ...options
  }

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date)
}

/**
 * Get timezone abbreviation (e.g., PST, EST, GMT)
 * @param {string} timezone - IANA timezone identifier
 * @param {Date} date - Date to get abbreviation for (defaults to now)
 * @returns {string} Timezone abbreviation
 */
export const getTimezoneAbbreviation = (timezone, date = new Date()) => {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`)
  }

  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  }).format(date)

  // Extract the abbreviation (last part after space)
  const parts = formatted.split(' ')
  return parts[parts.length - 1]
}

/**
 * Get friendly timezone name with offset
 * @param {string} timezone - IANA timezone identifier
 * @param {Date} date - Date to calculate offset for (defaults to now)
 * @returns {string} Friendly name like "America/New_York (EST, UTC-5)"
 */
export const getTimezoneFriendlyName = (timezone, date = new Date()) => {
  if (!isValidTimezone(timezone)) {
    return timezone
  }

  const abbreviation = getTimezoneAbbreviation(timezone, date)
  const offset = getTimezoneOffset(date, timezone)
  const offsetHours = Math.floor(Math.abs(offset) / (1000 * 60 * 60))
  const offsetMinutes = Math.floor((Math.abs(offset) % (1000 * 60 * 60)) / (1000 * 60))
  const offsetSign = offset >= 0 ? '+' : '-'

  let offsetString = `UTC${offsetSign}${offsetHours}`
  if (offsetMinutes > 0) {
    offsetString += `:${String(offsetMinutes).padStart(2, '0')}`
  }

  return `${timezone} (${abbreviation}, ${offsetString})`
}

/**
 * Get all timezones grouped by region
 * @returns {object} Timezones grouped by region
 */
export const getTimezonesByRegion = () => {
  const timezones = getAvailableTimezones()
  const grouped = {
    UTC: [],
    Americas: [],
    Europe: [],
    Asia: [],
    Africa: [],
    Australia: [],
    Pacific: []
  }

  timezones.forEach((tz) => {
    if (tz === 'UTC') {
      grouped.UTC.push(tz)
    } else if (tz.startsWith('America/')) {
      grouped.Americas.push(tz)
    } else if (tz.startsWith('Europe/')) {
      grouped.Europe.push(tz)
    } else if (tz.startsWith('Asia/')) {
      grouped.Asia.push(tz)
    } else if (tz.startsWith('Africa/')) {
      grouped.Africa.push(tz)
    } else if (tz.startsWith('Australia/')) {
      grouped.Australia.push(tz)
    } else if (tz.startsWith('Pacific/')) {
      grouped.Pacific.push(tz)
    }
  })

  return grouped
}

/**
 * Check if a timezone observes daylight saving time
 * @param {string} timezone - IANA timezone identifier
 * @param {number} year - Year to check (defaults to current year)
 * @returns {boolean} True if DST is observed
 */
export const observesDST = (timezone, year = new Date().getFullYear()) => {
  if (!isValidTimezone(timezone)) {
    return false
  }

  // Check offset in January (winter) and July (summer)
  const jan = new Date(year, 0, 1)
  const jul = new Date(year, 6, 1)

  const janOffset = getTimezoneOffset(jan, timezone)
  const julOffset = getTimezoneOffset(jul, timezone)

  // If offsets differ, DST is observed
  return janOffset !== julOffset
}

/**
 * Get business hours overlap between two timezones
 * @param {string} timezone1 - First timezone
 * @param {string} timezone2 - Second timezone
 * @param {object} businessHours - Business hours config { start: 9, end: 17 }
 * @returns {object} Overlap information
 */
export const getBusinessHoursOverlap = (
  timezone1,
  timezone2,
  businessHours = { start: 9, end: 17 }
) => {
  if (!isValidTimezone(timezone1) || !isValidTimezone(timezone2)) {
    throw new Error('Invalid timezone provided')
  }

  const now = new Date()
  const offset1 = getTimezoneOffset(now, timezone1)
  const offset2 = getTimezoneOffset(now, timezone2)
  const offsetDiff = (offset2 - offset1) / (1000 * 60 * 60) // Convert to hours

  // Calculate when business hours in timezone1 are in timezone2
  const tz1StartInTz2 = businessHours.start + offsetDiff
  const tz1EndInTz2 = businessHours.end + offsetDiff

  // Find overlap
  const overlapStart = Math.max(businessHours.start, tz1StartInTz2)
  const overlapEnd = Math.min(businessHours.end, tz1EndInTz2)

  const hasOverlap = overlapStart < overlapEnd

  return {
    hasOverlap,
    overlapStart: hasOverlap ? overlapStart : null,
    overlapEnd: hasOverlap ? overlapEnd : null,
    overlapHours: hasOverlap ? overlapEnd - overlapStart : 0
  }
}
