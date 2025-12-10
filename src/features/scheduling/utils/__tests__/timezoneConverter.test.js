import { describe, it, expect } from 'vitest'
import {
  convertToTimezone,
  formatLocalTime,
  getTimezoneOffset,
  getTimezonesForCountry
} from '../timezoneConverter'

describe('timezoneConverter', () => {
  describe('convertToTimezone', () => {
    it('should convert a UTC date string to the specified timezone', () => {
      const utcDate = '2025-12-15T12:00:00Z'
      const timezone = 'America/New_York'
      const converted = convertToTimezone(utcDate, timezone)
      // NY is UTC-5
      expect(converted.getFullYear()).toBe(2025)
      expect(converted.getMonth()).toBe(11) // December
      expect(converted.getDate()).toBe(15)
      expect(converted.getHours()).toBe(7)
    })

    it('should handle Date objects', () => {
      const utcDate = new Date('2025-12-15T12:00:00Z')
      const timezone = 'Europe/Paris'
      const converted = convertToTimezone(utcDate, timezone)
      // Paris is UTC+1
      expect(converted.getHours()).toBe(13)
    })

    it('should throw an error for an invalid timezone', () => {
      const utcDate = '2025-12-15T12:00:00Z'
      let error
      try {
        convertToTimezone(utcDate, 'Invalid/Timezone')
      } catch (e) {
        error = e
      }
      expect(error).toBeInstanceOf(RangeError)
      expect(error.message).toBe('Invalid timezone: Invalid/Timezone')
    })

    it('should throw an error for a missing date', () => {
      expect(() => convertToTimezone(null, 'America/New_York')).toThrow('Date is required')
    })

    it('should throw an error for a missing timezone', () => {
      const utcDate = '2025-12-15T12:00:00Z'
      expect(() => convertToTimezone(utcDate, null)).toThrow('Valid timezone string is required')
    })
    describe('formatLocalTime', () => {
      it('should format a date in the specified timezone', () => {
        const date = '2025-12-15T12:00:00Z'
        const timezone = 'America/New_York'
        const format = 'HH:mm:ss'
        // NY is UTC-5
        expect(formatLocalTime(date, timezone, format)).toBe('07:00:00')
      })

      it('should use the default format HH:mm if no format is provided', () => {
        const date = '2025-12-15T12:00:00Z'
        const timezone = 'Europe/Paris'
        // Paris is UTC+1
        expect(formatLocalTime(date, timezone)).toBe('13:00')
      })

      it('should throw an error for an invalid timezone', () => {
        const date = '2025-12-15T12:00:00Z'
        expect(() => formatLocalTime(date, 'Invalid/Timezone')).toThrow(
          'Invalid timezone: Invalid/Timezone'
        )
      })

      it('should throw an error for a missing date', () => {
        expect(() => formatLocalTime(null, 'America/New_York')).toThrow('Date is required')
      })

      it('should throw an error for a missing timezone', () => {
        const date = '2025-12-15T12:00:00Z'
        expect(() => formatLocalTime(date, null)).toThrow('Timezone is required')
      })
      describe('getTimezoneOffset', () => {
        it('should return correct offset for America/New_York in winter', () => {
          const date = new Date('2025-12-15T12:00:00Z')
          const result = getTimezoneOffset(date, 'America/New_York')
          expect(result.offsetMinutes).toBe(-300)
          expect(result.offsetString).toBe('-05:00')
          expect(result.isDST).toBe(false)
        })

        it('should return correct offset for America/New_York in summer (DST)', () => {
          const date = new Date('2025-06-15T12:00:00Z')
          const result = getTimezoneOffset(date, 'America/New_York')
          expect(result.offsetMinutes).toBe(-240)
          expect(result.offsetString).toBe('-04:00')
          expect(result.isDST).toBe(true)
        })

        it('should throw an error for an invalid timezone', () => {
          const date = new Date()
          expect(() => getTimezoneOffset(date, 'Invalid/Timezone')).toThrow(
            'Invalid timezone: Invalid/Timezone'
          )
        })

        it('should throw an error for a missing date', () => {
          expect(() => getTimezoneOffset(null, 'America/New_York')).toThrow(
            'Valid date is required'
          )
        })

        it('should throw an error for a missing timezone', () => {
          const date = new Date()
          expect(() => getTimezoneOffset(date, null)).toThrow('Timezone is required')
        })
      })
      describe('getTimezonesForCountry', () => {
        it('should return timezones for a valid country code', () => {
          const timezones = getTimezonesForCountry('US')
          expect(timezones.length).toBeGreaterThan(0)
          expect(timezones[0]).toHaveProperty('timezone', 'America/New_York')
        })

        it('should be case-insensitive', () => {
          const timezones = getTimezonesForCountry('us')
          expect(timezones.length).toBeGreaterThan(0)
          expect(timezones[0]).toHaveProperty('timezone', 'America/New_York')
        })

        it('should return an empty array for an unknown country code', () => {
          const timezones = getTimezonesForCountry('XX')
          expect(timezones).toEqual([])
        })

        it('should throw an error for an invalid country code', () => {
          expect(() => getTimezonesForCountry('USA')).toThrow(
            'Valid ISO 3166-1 alpha-2 country code required'
          )
          expect(() => getTimezonesForCountry('U')).toThrow(
            'Valid ISO 3166-1 alpha-2 country code required'
          )
          expect(() => getTimezonesForCountry(null)).toThrow(
            'Valid ISO 3166-1 alpha-2 country code required'
          )
        })
      })
    })
  })
})
