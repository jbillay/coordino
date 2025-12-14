/**
 * 24-hour heatmap generation for optimal time discovery
 * Calculates equity scores for each hour of a given date
 */

import { calculateScore, getBreakdown } from './useEquityScore'
import { toLocalTime, calculateStatus } from './useTimezone'
import { checkHoliday } from './useHolidays'
import { DEFAULT_CONFIG } from '../utils'

// Cache for heatmap results to avoid redundant calculations
const heatmapCache = new Map()

/**
 * Generate cache key from date and participants
 * @param {Date} date - Meeting date
 * @param {Array} participants - Participant list
 * @returns {string} Cache key
 */
function generateCacheKey(date, participants) {
  const dateKey = date.toISOString().split('T')[0] // Get YYYY-MM-DD
  const participantIds = participants
    .map((p) => p.id || p.email)
    .sort()
    .join(',')
  return `${dateKey}:${participantIds}`
}

/**
 * Generate 24-hour heatmap showing equity scores for each hour
 * @param {Array} participants - Array of participant objects with timezone and country
 * @param {Date} date - Date to generate heatmap for
 * @param {Object} countryConfigs - Map of country code to working hours configuration
 * @param {Object} holidaysCache - Map of 'countryCode_year' to holidays array (US3)
 * @returns {Array} Array of 24 objects with { hour, score, breakdown: { green, orange, red, critical, total } }
 */
export function generateHeatmap(participants, date, countryConfigs = {}, holidaysCache = {}) {
  if (!participants || participants.length === 0) {
    return []
  }

  // Check cache first
  const cacheKey = generateCacheKey(date, participants)
  if (heatmapCache.has(cacheKey)) {
    return heatmapCache.get(cacheKey)
  }

  const heatmapData = []
  const year = date.getFullYear()

  // Generate equity score for each hour of the day (0-23)
  for (let hour = 0; hour < 24; hour++) {
    // Create a Date object for this hour on the given date (in UTC)
    const meetingTime = new Date(date)
    meetingTime.setUTCHours(hour, 0, 0, 0)

    // Calculate status for each participant at this time
    const participantsWithStatus = participants.map((participant) => {
      // Convert UTC meeting time to participant's local timezone
      const localTime = toLocalTime(meetingTime, participant.timezone)

      // Get config for this participant's country (custom or default)
      const config = countryConfigs[participant.country_code] || DEFAULT_CONFIG

      // Get day of week in participant's timezone (0=Sunday, 1=Monday, etc.)
      const dayOfWeek = localTime.getDay()
      // Convert JS day (0-6) to ISO day (1-7): Sunday=7, Monday=1, etc.
      const dayOfWeekISO = dayOfWeek === 0 ? 7 : dayOfWeek
      const isWorkDay = config.work_days.includes(dayOfWeekISO)

      // US3: Check for holidays
      const countryHolidaysKey = `${participant.country_code}_${year}`
      const countryHolidays = holidaysCache[countryHolidaysKey] || []
      const holiday = checkHoliday(localTime, countryHolidays)

      // Calculate status for this participant
      const statusResult = calculateStatus(localTime, config, holiday, isWorkDay)

      return {
        ...participant,
        status: statusResult.status,
        statusReason: statusResult.reason,
        localTime
      }
    })

    // Calculate equity score for this hour
    const score = calculateScore(participantsWithStatus)

    // Get breakdown of participants by status
    const breakdown = getBreakdown(participantsWithStatus)
    breakdown.total = participants.length

    heatmapData.push({
      hour,
      score,
      breakdown,
      meetingTime: meetingTime.toISOString()
    })
  }

  // Store in cache before returning
  heatmapCache.set(cacheKey, heatmapData)

  return heatmapData
}

/**
 * Get top N optimal time suggestions from heatmap
 * @param {Array} heatmap - 24-hour heatmap data
 * @param {number} count - Number of suggestions to return (default: 3)
 * @returns {Array} Top N hours sorted by equity score (highest first)
 */
export function getTopSuggestions(heatmap, count = 3) {
  if (!heatmap || heatmap.length === 0) {
    return []
  }

  // Sort by equity score descending (highest score first)
  const sorted = [...heatmap].sort((a, b) => b.score - a.score)

  // Return top N suggestions
  return sorted.slice(0, count)
}
