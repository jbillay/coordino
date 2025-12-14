/**
 * Holiday detection using Nager.Date public API
 * Provides caching and retry logic for reliability
 */

import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'

const NAGER_API_BASE = 'https://date.nager.at/api/v3'
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Retry function with exponential backoff (T086)
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise} Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break
      }

      // Exponential backoff: 1s, 2s, 4s (2^attempt seconds)
      const delayMs = Math.pow(2, attempt) * 1000
      await new Promise((resolve) => setTimeout(resolve, delayMs))

      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms delay`)
    }
  }

  throw lastError
}

/**
 * Fetch holidays for a country and year with caching (T085, T087, T088, T089)
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'FR')
 * @param {number} year - Year to fetch holidays for
 * @param {Object} supabase - Supabase client (optional, will create if not provided)
 * @returns {Promise<Array>} Array of holiday objects
 */
export async function fetchHolidays(countryCode, year, supabase = null) {
  // Get Supabase client
  const client = supabase || useSupabase().supabase
  const authStore = useAuthStore()
  const userId = authStore.user?.id

  if (!userId) {
    console.warn('User not authenticated, cannot cache holidays')
    return await fetchHolidaysFromAPI(countryCode, year)
  }

  try {
    // T087: Check cache first
    const { data: cached, error: cacheError } = await client
      .from('holiday_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('country_code', countryCode)
      .eq('year', year)
      .maybeSingle()

    if (cacheError) {
      console.error('Cache read error:', cacheError)
    }

    // Check if cache is valid (exists and not expired)
    if (cached && cached.holidays_json) {
      const cacheAge = Date.now() - new Date(cached.cached_at).getTime()

      if (cacheAge < CACHE_DURATION_MS) {
        console.log(`Using cached holidays for ${countryCode} ${year}`)
        return cached.holidays_json
      }
      console.log(`Cache expired for ${countryCode} ${year}, fetching fresh data`)
    }

    // T085: Fetch from API with retry logic
    const holidays = await fetchHolidaysFromAPI(countryCode, year)

    // T088: Cache the results
    if (holidays.length > 0) {
      const { error: upsertError } = await client.from('holiday_cache').upsert(
        {
          user_id: userId,
          country_code: countryCode,
          year,
          holidays_json: holidays,
          cached_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,country_code,year'
        }
      )

      if (upsertError) {
        console.error('Failed to cache holidays:', upsertError)
      } else {
        console.log(`Cached ${holidays.length} holidays for ${countryCode} ${year}`)
      }
    }

    return holidays
  } catch (error) {
    // T089: Graceful degradation - return empty array on failure
    console.error(`Failed to fetch holidays for ${countryCode} ${year}:`, error)
    return []
  }
}

/**
 * Fetch holidays from Nager.Date API with retry logic
 * @param {string} countryCode - ISO country code
 * @param {number} year - Year
 * @returns {Promise<Array>} Holiday array
 */
async function fetchHolidaysFromAPI(countryCode, year) {
  return retryWithBackoff(async () => {
    const url = `${NAGER_API_BASE}/PublicHolidays/${year}/${countryCode}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Nager.Date API error: ${response.status} ${response.statusText}`)
    }

    const holidays = await response.json()

    // Transform to our format
    return holidays.map((holiday) => ({
      date: holiday.date,
      localName: holiday.localName,
      name: holiday.name,
      countryCode: holiday.countryCode,
      fixed: holiday.fixed,
      global: holiday.global,
      types: holiday.types
    }))
  })
}

/**
 * Batch pre-fetch holidays for current and next year (T090)
 * @param {Array} countryCodes - Array of country codes to pre-fetch
 * @param {Object} supabase - Supabase client (optional)
 * @returns {Promise<void>}
 */
export async function prefetchHolidays(countryCodes, supabase = null) {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1

  const fetchPromises = []

  for (const countryCode of countryCodes) {
    fetchPromises.push(fetchHolidays(countryCode, currentYear, supabase))
    fetchPromises.push(fetchHolidays(countryCode, nextYear, supabase))
  }

  try {
    await Promise.all(fetchPromises)
    console.log(`Pre-fetched holidays for ${countryCodes.length} countries (current + next year)`)
  } catch (error) {
    console.error('Error pre-fetching holidays:', error)
  }
}

/**
 * Check if a specific date is a holiday
 * @param {Date} date - Date to check
 * @param {Array} holidays - Array of holiday objects for the year
 * @returns {Object|null} Holiday object if date is a holiday, null otherwise
 */
export function checkHoliday(date, holidays) {
  if (!holidays || holidays.length === 0) {
    return null
  }

  // Format date as YYYY-MM-DD to match holiday data
  const dateStr = date.toISOString().split('T')[0]

  // Find matching holiday
  const holiday = holidays.find((h) => h.date === dateStr)

  return holiday || null
}
