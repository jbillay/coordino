/**
 * Working Hours Validator Utility
 * Determines color status for participant based on their local time and country configuration
 */

/**
 * Determine color status for participant
 * @param {Date} localTime - Participant's local time
 * @param {Object} config - Country configuration
 * @param {string} config.green_start - HH:MM:SS
 * @param {string} config.green_end - HH:MM:SS
 * @param {string} config.orange_start_morning - HH:MM:SS
 * @param {string} config.orange_end_morning - HH:MM:SS
 * @param {string} config.orange_start_evening - HH:MM:SS
 * @param {string} config.orange_end_evening - HH:MM:SS
 * @param {string} config.work_week_pattern - e.g., 'MTWTF', 'SuMTWTh'
 * @param {boolean} isHoliday - Whether the date is a holiday
 * @param {boolean} isWorkDay - Whether the day is a work day
 * @returns {Object} Status object
 * @returns {string} return.status - 'green', 'orange', 'red'
 * @returns {boolean} return.is_critical - Whether it's a critical conflict
 * @returns {string} return.reason - Human-readable reason
 *
 * @example
 * const config = {
 *   green_start: '09:00:00',
 *   green_end: '17:00:00',
 *   orange_start_morning: '08:00:00',
 *   orange_end_morning: '09:00:00',
 *   orange_start_evening: '17:00:00',
 *   orange_end_evening: '18:00:00',
 *   work_week_pattern: 'MTWTF'
 * }
 * determineColorStatus(new Date('2025-12-15T14:00:00'), config, false, true)
 * // { status: 'green', is_critical: false, reason: 'Within optimal working hours' }
 */
export function determineColorStatus(localTime, config, isHoliday = false) {
  // Input validation
  if (!localTime || isNaN(localTime.getTime())) {
    throw new Error('Valid localTime Date object is required')
  }

  if (!config) {
    throw new Error('Country configuration is required')
  }

  // Check if it's a work day
  const isWorkDay = checkWorkDay(localTime, config.work_week_pattern)

  // Priority 1: Holiday or non-work day (Critical Red)
  if (isHoliday) {
    return {
      status: 'red',
      is_critical: true,
      reason: 'National holiday'
    }
  }

  if (!isWorkDay) {
    return {
      status: 'red',
      is_critical: true,
      reason: 'Non-working day'
    }
  }

  // Extract time from local time
  const hours = localTime.getHours()
  const minutes = localTime.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  // Parse config times to minutes
  const greenStart = parseTimeToMinutes(config.green_start)
  const greenEnd = parseTimeToMinutes(config.green_end)
  const orangeStartMorning = parseTimeToMinutes(config.orange_start_morning)
  const orangeEndMorning = parseTimeToMinutes(config.orange_end_morning)
  const orangeStartEvening = parseTimeToMinutes(config.orange_start_evening)
  const orangeEndEvening = parseTimeToMinutes(config.orange_end_evening)

  // Priority 2: Within green range (Optimal)
  if (timeInMinutes >= greenStart && timeInMinutes < greenEnd) {
    return {
      status: 'green',
      is_critical: false,
      reason: 'Within optimal working hours'
    }
  }

  // Priority 3: Within orange range (Acceptable)
  const inOrangeMorning = timeInMinutes >= orangeStartMorning && timeInMinutes < orangeEndMorning
  const inOrangeEvening = timeInMinutes >= orangeStartEvening && timeInMinutes < orangeEndEvening

  if (inOrangeMorning || inOrangeEvening) {
    return {
      status: 'orange',
      is_critical: false,
      reason: 'Outside optimal hours but acceptable'
    }
  }

  // Priority 4: Outside acceptable hours (Red)
  return {
    status: 'red',
    is_critical: false,
    reason: 'Outside acceptable working hours'
  }
}

/**
 * Check if date is a work day based on work week pattern
 * @param {Date} date - Date to check
 * @param {string} workWeekPattern - Pattern like 'MTWTF', 'SuMTWTh'
 * @returns {boolean} True if work day
 *
 * @example
 * isWorkingDay(new Date('2025-12-15'), 'MTWTF') // true (Monday)
 * isWorkingDay(new Date('2025-12-13'), 'MTWTF') // false (Saturday)
 * isWorkingDay(new Date('2025-12-14'), 'SuMTWTh') // true (Sunday)
 */
export function isWorkingDay(date, workWeekPattern) {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Valid date is required')
  }

  if (!workWeekPattern || typeof workWeekPattern !== 'string') {
    throw new Error('Valid work week pattern is required')
  }

  return checkWorkDay(date, workWeekPattern)
}

/**
 * Helper function to check work day
 * @private
 */
function checkWorkDay(date, workWeekPattern) {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Map day of week to pattern characters
  const dayMap = {
    0: 'Su', // Sunday
    1: 'M', // Monday
    2: 'T', // Tuesday
    3: 'W', // Wednesday
    4: 'Th', // Thursday
    5: 'F', // Friday
    6: 'Sa' // Saturday
  }

  const dayCode = dayMap[dayOfWeek]

  // Check if day code is in work week pattern
  return workWeekPattern.includes(dayCode)
}

/**
 * Parse time string to minutes since midnight
 * @private
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format
 * @returns {number} Minutes since midnight
 */
function parseTimeToMinutes(timeString) {
  const parts = timeString.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  return hours * 60 + minutes
}

/**
 * Format time range for display
 * @param {string} startTime - Start time (HH:MM:SS)
 * @param {string} endTime - End time (HH:MM:SS)
 * @returns {string} Formatted range like "9:00 AM - 5:00 PM"
 *
 * @example
 * formatTimeRange('09:00:00', '17:00:00') // "9:00 AM - 5:00 PM"
 */
export function formatTimeRange(startTime, endTime) {
  const formatTime = (timeString) => {
    const parts = timeString.split(':')
    let hours = parseInt(parts[0], 10)
    const minutes = parts[1]
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${hours}:${minutes} ${ampm}`
  }

  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}
