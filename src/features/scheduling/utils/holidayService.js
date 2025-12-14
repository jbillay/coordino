/**
 * Holiday Service Utility
 * Fetches and caches holiday data from Nager.Date API
 */

const NAGER_API_BASE = 'https://date.nager.at/api/v3'
const CACHE_KEY_PREFIX = 'holiday_cache'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

/**
 * Retry utility with exponential backoff
 * @private
 */
async function retryWithBackoff(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === retries - 1
      if (isLastAttempt) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
      console.warn(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Fetch holidays from Nager.Date API
 * Includes automatic retry with exponential backoff (3 attempts)
 * @param {string} countryCode - ISO 3166-1 alpha-2 code
 * @param {number} year - Year (e.g., 2025)
 * @returns {Promise<Array<Object>>} Array of holiday objects
 * @returns {Date} return[].date - Holiday date
 * @returns {string} return[].name - Holiday name
 * @returns {string} return[].localName - Local language name
 * @returns {string} return[].countryCode - Country code
 * @returns {boolean} return[].fixed - Whether date is fixed annually
 * @returns {boolean} return[].global - Whether it's a nationwide holiday
 * @returns {Array<string>|null} return[].counties - Specific regions (null if nationwide)
 * @returns {Array<string>} return[].types - Holiday types
 * @throws {Error} If API request fails after all retries
 *
 * @example
 * const holidays = await fetchHolidays('US', 2025)
 * // [
 * //   { date: Date('2025-01-01'), name: 'New Year\'s Day', ... },
 * //   { date: Date('2025-07-04'), name: 'Independence Day', ... }
 * // ]
 */
export async function fetchHolidays(countryCode, year) {
  // Input validation
  if (!countryCode || countryCode.length !== 2) {
    throw new Error('Valid ISO 3166-1 alpha-2 country code required')
  }

  if (!year || year < 2000 || year > 2100) {
    throw new Error('Valid year required (2000-2100)')
  }

  const code = countryCode.toUpperCase()
  const cacheKey = `${CACHE_KEY_PREFIX}_${code}_${year}`

  // Check cache first
  const cached = getCachedHolidays(cacheKey)
  if (cached) {
    return cached
  }

  const apiUrl = `${NAGER_API_BASE}/PublicHolidays/${year}/${code}`

  try {
    // Fetch with retry logic
    const data = await retryWithBackoff(async () => {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Country not found in API, return empty array (don't retry)
          console.warn(`No holiday data found for country: ${code}`)
          return []
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    })

    // Handle 404 case (empty array)
    if (Array.isArray(data) && data.length === 0) {
      return []
    }

    // Transform API response to our format
    const holidays = data.map((holiday) => ({
      date: new Date(holiday.date),
      name: holiday.name,
      localName: holiday.localName,
      countryCode: holiday.countryCode,
      fixed: holiday.fixed,
      global: holiday.global,
      counties: holiday.counties,
      types: holiday.types
    }))

    // Cache the results
    cacheHolidays(cacheKey, holidays)

    return holidays
  } catch (error) {
    // Network errors, timeouts, etc. (after all retries)
    console.error('Failed to fetch holidays after retries:', error)

    // Graceful degradation: return empty array
    // UI should show warning that holiday checking is unavailable
    return []
  }
}

/**
 * Check if date is a holiday
 * @param {Date} date - Date to check
 * @param {Array<Object>} holidays - Holiday list from fetchHolidays()
 * @returns {Object|null} Holiday object if found, null otherwise
 *
 * @example
 * const holidays = await fetchHolidays('US', 2025)
 * const christmas = isHoliday(new Date('2025-12-25'), holidays)
 * // { date: Date, name: 'Christmas Day', ... }
 */
export function isHoliday(date, holidays) {
  // Input validation
  if (!date || isNaN(date.getTime())) {
    throw new Error('Valid date is required')
  }

  if (!Array.isArray(holidays)) {
    throw new Error('Holidays must be an array')
  }

  // Normalize date to compare only year/month/day (ignore time)
  const targetDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )

  // Find matching holiday
  const holiday = holidays.find((h) => {
    const holidayDate = new Date(
      Date.UTC(h.date.getUTCFullYear(), h.date.getUTCMonth(), h.date.getUTCDate())
    )
    return holidayDate.getTime() === targetDate.getTime()
  })

  return holiday || null
}

/**
 * Get upcoming holidays
 * @param {Array<Object>} holidays - Holiday list
 * @param {Date} fromDate - Start date
 * @param {number} [count=5] - Number of holidays to return
 * @returns {Array<Object>} Upcoming holidays sorted by date
 *
 * @example
 * const upcoming = getUpcomingHolidays(holidays, new Date(), 3)
 * // Returns next 3 holidays after today
 */
export function getUpcomingHolidays(holidays, fromDate, count = 5) {
  if (!Array.isArray(holidays)) {
    throw new Error('Holidays must be an array')
  }

  if (!fromDate || isNaN(fromDate.getTime())) {
    throw new Error('Valid date is required')
  }

  // Filter holidays after fromDate
  const upcoming = holidays
    .filter((h) => h.date > fromDate)
    .sort((a, b) => a.date - b.date)
    .slice(0, count)

  return upcoming
}

/**
 * Get cached holidays from localStorage
 * @private
 */
function getCachedHolidays(cacheKey) {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (!cached) {
      return null
    }

    const { data, timestamp } = JSON.parse(cached)

    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey)
      return null
    }

    // Parse dates from cached data
    return data.map((holiday) => ({
      ...holiday,
      date: new Date(holiday.date)
    }))
  } catch (error) {
    console.error('Error reading holiday cache:', error)
    return null
  }
}

/**
 * Cache holidays to localStorage
 * @private
 */
function cacheHolidays(cacheKey, holidays) {
  try {
    const cacheData = {
      data: holidays,
      timestamp: Date.now()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error caching holidays:', error)
    // Don't throw - caching is optional
  }
}
