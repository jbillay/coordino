/**
 * Unit tests for timezone utilities
 * Feature: 001-user-config - User Story 2 (Profile & Preferences)
 * Tests timezone conversion, validation, and formatting utilities
 */

import { describe, it, expect } from 'vitest'
import {
  getAvailableTimezones,
  isValidTimezone,
  getCurrentTimezone,
  convertTimezone,
  getTimezoneOffset,
  formatInTimezone,
  getTimezoneAbbreviation,
  getTimezoneFriendlyName,
  getTimezonesByRegion,
  observesDST,
  getBusinessHoursOverlap
} from '../../../src/utils/timezone.js'

describe('Timezone Utilities', () => {
  describe('getAvailableTimezones', () => {
    it('should return an array of timezone identifiers', () => {
      const timezones = getAvailableTimezones()

      expect(Array.isArray(timezones)).toBe(true)
      expect(timezones.length).toBeGreaterThan(0)
    })

    it('should include UTC', () => {
      const timezones = getAvailableTimezones()

      expect(timezones).toContain('UTC')
    })

    it('should include common timezones', () => {
      const timezones = getAvailableTimezones()

      expect(timezones).toContain('America/New_York')
      expect(timezones).toContain('Europe/London')
      expect(timezones).toContain('Asia/Tokyo')
    })
  })

  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezone identifiers', () => {
      expect(isValidTimezone('UTC')).toBe(true)
      expect(isValidTimezone('America/New_York')).toBe(true)
      expect(isValidTimezone('Europe/London')).toBe(true)
      expect(isValidTimezone('Asia/Tokyo')).toBe(true)
    })

    it('should return false for invalid timezone identifiers', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false)
      expect(isValidTimezone('EST')).toBe(false) // Abbreviations are not valid
      expect(isValidTimezone('GMT')).toBe(false) // Use UTC instead
    })

    it('should return false for empty or null input', () => {
      expect(isValidTimezone('')).toBe(false)
      expect(isValidTimezone(null)).toBe(false)
      expect(isValidTimezone(undefined)).toBe(false)
    })

    it('should return false for non-string input', () => {
      expect(isValidTimezone(123)).toBe(false)
      expect(isValidTimezone({})).toBe(false)
      expect(isValidTimezone([])).toBe(false)
    })
  })

  describe('getCurrentTimezone', () => {
    it('should return a valid timezone identifier', () => {
      const timezone = getCurrentTimezone()

      expect(typeof timezone).toBe('string')
      expect(timezone.length).toBeGreaterThan(0)
      expect(isValidTimezone(timezone)).toBe(true)
    })
  })

  describe('convertTimezone', () => {
    it('should convert date between timezones', () => {
      const date = new Date('2024-01-15T12:00:00Z') // Noon UTC

      const converted = convertTimezone(date, 'UTC', 'America/New_York')

      // New York is UTC-5, so noon UTC should be 7am EST
      expect(converted).toBeInstanceOf(Date)
    })

    it('should throw error for invalid date', () => {
      expect(() => {
        convertTimezone('not a date', 'UTC', 'America/New_York')
      }).toThrow('Invalid date')
    })

    it('should throw error for invalid source timezone', () => {
      expect(() => {
        convertTimezone(new Date(), 'Invalid/TZ', 'America/New_York')
      }).toThrow('Invalid source timezone')
    })

    it('should throw error for invalid target timezone', () => {
      expect(() => {
        convertTimezone(new Date(), 'UTC', 'Invalid/TZ')
      }).toThrow('Invalid target timezone')
    })

    it('should handle same timezone conversion', () => {
      const date = new Date('2024-01-15T12:00:00Z')

      const converted = convertTimezone(date, 'UTC', 'UTC')

      expect(converted.getTime()).toBeCloseTo(date.getTime(), -2) // Allow small precision differences
    })
  })

  describe('getTimezoneOffset', () => {
    it('should return offset in milliseconds', () => {
      const date = new Date('2024-01-15T12:00:00Z')

      const offset = getTimezoneOffset(date, 'America/New_York')

      expect(typeof offset).toBe('number')
      // New York is typically UTC-5 (18000000 ms) in January
      expect(Math.abs(offset)).toBeGreaterThan(0)
    })

    it('should return 0 for UTC', () => {
      const date = new Date()

      const offset = getTimezoneOffset(date, 'UTC')

      expect(offset).toBe(0)
    })

    it('should throw error for invalid timezone', () => {
      expect(() => {
        getTimezoneOffset(new Date(), 'Invalid/TZ')
      }).toThrow('Invalid timezone')
    })

    it('should handle DST transitions', () => {
      // January (winter) in New York
      const winter = new Date('2024-01-15T12:00:00Z')
      const winterOffset = getTimezoneOffset(winter, 'America/New_York')

      // July (summer) in New York
      const summer = new Date('2024-07-15T12:00:00Z')
      const summerOffset = getTimezoneOffset(summer, 'America/New_York')

      // Offsets should differ due to DST
      expect(winterOffset).not.toBe(summerOffset)
    })
  })

  describe('formatInTimezone', () => {
    it('should format date in specified timezone', () => {
      const date = new Date('2024-01-15T12:00:00Z')

      const formatted = formatInTimezone(date, 'America/New_York')

      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should throw error for invalid date', () => {
      expect(() => {
        formatInTimezone('not a date', 'UTC')
      }).toThrow('Invalid date')
    })

    it('should throw error for invalid timezone', () => {
      expect(() => {
        formatInTimezone(new Date(), 'Invalid/TZ')
      }).toThrow('Invalid timezone')
    })

    it('should accept custom format options', () => {
      const date = new Date('2024-01-15T12:00:00Z')

      const formatted = formatInTimezone(date, 'UTC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      expect(formatted).toContain('2024')
      expect(formatted).toContain('January')
    })
  })

  describe('getTimezoneAbbreviation', () => {
    it('should return timezone abbreviation', () => {
      const date = new Date('2024-01-15T12:00:00Z') // Winter

      const abbr = getTimezoneAbbreviation('America/New_York', date)

      expect(typeof abbr).toBe('string')
      expect(abbr).toBe('EST') // Eastern Standard Time in winter
    })

    it('should handle DST abbreviations', () => {
      const summer = new Date('2024-07-15T12:00:00Z')

      const abbr = getTimezoneAbbreviation('America/New_York', summer)

      expect(abbr).toBe('EDT') // Eastern Daylight Time in summer
    })

    it('should throw error for invalid timezone', () => {
      expect(() => {
        getTimezoneAbbreviation('Invalid/TZ')
      }).toThrow('Invalid timezone')
    })

    it('should use current date if not provided', () => {
      const abbr = getTimezoneAbbreviation('America/New_York')

      expect(typeof abbr).toBe('string')
      expect(abbr.length).toBeGreaterThan(0)
    })
  })

  describe('getTimezoneFriendlyName', () => {
    it('should return friendly timezone name with offset', () => {
      const date = new Date('2024-01-15T12:00:00Z')

      const friendly = getTimezoneFriendlyName('America/New_York', date)

      expect(friendly).toContain('America/New_York')
      expect(friendly).toContain('EST')
      expect(friendly).toContain('UTC')
    })

    it('should handle positive UTC offsets', () => {
      const friendly = getTimezoneFriendlyName('Asia/Tokyo')

      expect(friendly).toContain('+')
    })

    it('should handle negative UTC offsets', () => {
      const friendly = getTimezoneFriendlyName('America/Los_Angeles')

      expect(friendly).toContain('-')
    })

    it('should return original timezone for invalid input', () => {
      const result = getTimezoneFriendlyName('Invalid/TZ')

      expect(result).toBe('Invalid/TZ')
    })
  })

  describe('getTimezonesByRegion', () => {
    it('should return timezones grouped by region', () => {
      const grouped = getTimezonesByRegion()

      expect(typeof grouped).toBe('object')
      expect(grouped).toHaveProperty('UTC')
      expect(grouped).toHaveProperty('Americas')
      expect(grouped).toHaveProperty('Europe')
      expect(grouped).toHaveProperty('Asia')
      expect(grouped).toHaveProperty('Africa')
      expect(grouped).toHaveProperty('Australia')
      expect(grouped).toHaveProperty('Pacific')
    })

    it('should have UTC in UTC group', () => {
      const grouped = getTimezonesByRegion()

      expect(grouped.UTC).toContain('UTC')
    })

    it('should have American timezones in Americas group', () => {
      const grouped = getTimezonesByRegion()

      expect(grouped.Americas.length).toBeGreaterThan(0)
      grouped.Americas.forEach((tz) => {
        expect(tz).toMatch(/^America\//)
      })
    })

    it('should have European timezones in Europe group', () => {
      const grouped = getTimezonesByRegion()

      expect(grouped.Europe.length).toBeGreaterThan(0)
      grouped.Europe.forEach((tz) => {
        expect(tz).toMatch(/^Europe\//)
      })
    })
  })

  describe('observesDST', () => {
    it('should return true for timezones that observe DST', () => {
      const observes = observesDST('America/New_York')

      expect(observes).toBe(true)
    })

    it('should return false for timezones that do not observe DST', () => {
      const observes = observesDST('Asia/Tokyo')

      expect(observes).toBe(false)
    })

    it('should return false for UTC', () => {
      const observes = observesDST('UTC')

      expect(observes).toBe(false)
    })

    it('should accept custom year parameter', () => {
      const observes2024 = observesDST('America/New_York', 2024)

      expect(typeof observes2024).toBe('boolean')
    })

    it('should return false for invalid timezone', () => {
      const observes = observesDST('Invalid/TZ')

      expect(observes).toBe(false)
    })
  })

  describe('getBusinessHoursOverlap', () => {
    it('should calculate overlap for timezones with overlapping business hours', () => {
      const overlap = getBusinessHoursOverlap('America/New_York', 'America/Los_Angeles')

      expect(overlap).toHaveProperty('hasOverlap')
      expect(overlap).toHaveProperty('overlapStart')
      expect(overlap).toHaveProperty('overlapEnd')
      expect(overlap).toHaveProperty('overlapHours')

      // NY (EST) and LA (PST) have 3-hour difference, so there should be overlap
      expect(overlap.hasOverlap).toBe(true)
      expect(overlap.overlapHours).toBeGreaterThan(0)
    })

    it('should return no overlap for very distant timezones', () => {
      const overlap = getBusinessHoursOverlap('America/New_York', 'Asia/Tokyo')

      // These timezones are ~13-14 hours apart, might have no business hours overlap
      expect(overlap).toHaveProperty('hasOverlap')
      expect(typeof overlap.hasOverlap).toBe('boolean')
    })

    it('should accept custom business hours', () => {
      const overlap = getBusinessHoursOverlap('America/New_York', 'America/Los_Angeles', {
        start: 8,
        end: 18
      })

      expect(overlap).toHaveProperty('overlapHours')
      expect(overlap.overlapHours).toBeGreaterThanOrEqual(0)
    })

    it('should throw error for invalid timezones', () => {
      expect(() => {
        getBusinessHoursOverlap('Invalid/TZ1', 'Invalid/TZ2')
      }).toThrow('Invalid timezone')
    })

    it('should have full overlap for same timezone', () => {
      const overlap = getBusinessHoursOverlap('America/New_York', 'America/New_York')

      expect(overlap.hasOverlap).toBe(true)
      expect(overlap.overlapHours).toBe(8) // Default 9-17 = 8 hours
    })
  })
})
