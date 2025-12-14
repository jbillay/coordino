/**
 * Utility functions for Scheduling Assistant
 * Provides timezone lists, country codes, and default configurations
 */

/**
 * Get list of all IANA timezone identifiers
 * Uses Intl.supportedValuesOf('timeZone') for current browser support
 * @returns {Array<string>} Array of IANA timezone identifiers
 */
export function getIANATimezones() {
  try {
    // Modern browsers support Intl.supportedValuesOf
    if (Intl.supportedValuesOf) {
      return Intl.supportedValuesOf('timeZone')
    }
  } catch (error) {
    console.warn('Intl.supportedValuesOf not supported, using fallback list', error)
  }

  // Fallback: Common timezones if browser doesn't support supportedValuesOf
  return [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Vienna',
    'Europe/Stockholm',
    'Europe/Warsaw',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Pacific/Auckland',
    'America/Sao_Paulo',
    'America/Mexico_City',
    'America/Toronto',
    'Africa/Cairo',
    'Africa/Johannesburg'
  ].sort()
}

/**
 * Get list of ISO 3166-1 alpha-2 country codes with names
 * @returns {Array<Object>} Array of { code, name } objects
 */
export function getCountryCodes() {
  // Comprehensive list of ISO 3166-1 alpha-2 country codes
  // Sorted alphabetically by country name
  return [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'CA', name: 'Canada' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'EG', name: 'Egypt' },
    { code: 'EE', name: 'Estonia' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'GR', name: 'Greece' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MT', name: 'Malta' },
    { code: 'MX', name: 'Mexico' },
    { code: 'MA', name: 'Morocco' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TR', name: 'Turkey' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'VN', name: 'Vietnam' }
  ].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Default working hours configuration (FR-022)
 * Used when no custom country configuration exists
 */
export const DEFAULT_CONFIG = {
  // Green hours: Optimal working hours (9:00 AM - 5:00 PM)
  green_start: '09:00',
  green_end: '17:00',

  // Orange hours: Acceptable buffer hours
  // Morning buffer: 8:00 AM - 9:00 AM
  orange_morning_start: '08:00',
  orange_morning_end: '09:00',

  // Evening buffer: 5:00 PM - 6:00 PM
  orange_evening_start: '17:00',
  orange_evening_end: '18:00',

  // Work days: Monday-Friday (1=Monday, 5=Friday)
  work_days: [1, 2, 3, 4, 5]
}

/**
 * Validate IANA timezone identifier
 * @param {string} timezone - Timezone to validate
 * @returns {boolean} True if valid IANA timezone
 */
export function isValidTimezone(timezone) {
  const validTimezones = getIANATimezones()
  return validTimezones.includes(timezone)
}

/**
 * Validate ISO 3166-1 alpha-2 country code
 * @param {string} countryCode - Country code to validate
 * @returns {boolean} True if valid country code
 */
export function isValidCountryCode(countryCode) {
  const validCodes = getCountryCodes().map((c) => c.code)
  return validCodes.includes(countryCode.toUpperCase())
}

/**
 * Get country name from country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string|null} Country name or null if not found
 */
export function getCountryName(countryCode) {
  const country = getCountryCodes().find((c) => c.code === countryCode.toUpperCase())
  return country ? country.name : null
}
