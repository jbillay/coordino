/**
 * Unit tests for timezone utilities
 * T060: Test toLocalTime - verify UTC to timezone conversion
 * T061: Test calculateStatus - verify priority order and status determination
 */

import { describe, it, expect } from 'vitest'
import {
  toLocalTime,
  toUTC,
  formatWithTimezone,
  calculateStatus
} from '@/features/scheduling/composables/useTimezone'
import { DEFAULT_CONFIG } from '@/features/scheduling/utils'

describe('useTimezone', () => {
  describe('toLocalTime (T060)', () => {
    it('should convert UTC time to participant timezone correctly', () => {
      // Create a UTC time: 2025-12-12 14:00 UTC
      const utcTime = new Date('2025-12-12T14:00:00.000Z')

      // Convert to different timezones
      const nyTime = toLocalTime(utcTime, 'America/New_York')
      const tokyoTime = toLocalTime(utcTime, 'Asia/Tokyo')
      const berlinTime = toLocalTime(utcTime, 'Europe/Berlin')

      // Verify hour conversion (accounting for timezone offsets)
      // NYC is UTC-5 in December (EST), so 14:00 UTC = 9:00 AM EST
      expect(nyTime.getHours()).toBe(9)
      expect(nyTime.getMinutes()).toBe(0)

      // Tokyo is UTC+9, so 14:00 UTC = 11:00 PM JST (same day)
      expect(tokyoTime.getHours()).toBe(23)
      expect(tokyoTime.getMinutes()).toBe(0)

      // Berlin is UTC+1 in December (CET), so 14:00 UTC = 3:00 PM CET
      expect(berlinTime.getHours()).toBe(15)
      expect(berlinTime.getMinutes()).toBe(0)
    })

    it('should handle string UTC timestamps', () => {
      const utcString = '2025-12-12T14:00:00.000Z'
      const localTime = toLocalTime(utcString, 'America/Los_Angeles')

      // LA is UTC-8 in December (PST), so 14:00 UTC = 6:00 AM PST
      expect(localTime.getHours()).toBe(6)
      expect(localTime.getMinutes()).toBe(0)
    })

    it('should handle DST transitions correctly', () => {
      // Summer time in NYC (EDT, UTC-4)
      const summerUtc = new Date('2025-07-15T14:00:00.000Z')
      const summerNyTime = toLocalTime(summerUtc, 'America/New_York')

      // 14:00 UTC in summer = 10:00 AM EDT
      expect(summerNyTime.getHours()).toBe(10)
    })

    it('should preserve minutes and seconds', () => {
      const utcTime = new Date('2025-12-12T14:23:45.123Z')
      const localTime = toLocalTime(utcTime, 'Europe/Paris')

      expect(localTime.getMinutes()).toBe(23)
      expect(localTime.getSeconds()).toBe(45)
    })
  })

  describe('toUTC (T060)', () => {
    it('should convert local time to UTC correctly', () => {
      // Create a local time in NYC timezone: 9:00 AM EST on Dec 12, 2025
      const localTime = new Date('2025-12-12T09:00:00')
      const utcTime = toUTC(localTime, 'America/New_York')

      // 9:00 AM EST = 14:00 UTC (EST is UTC-5)
      expect(utcTime.getUTCHours()).toBe(14)
      expect(utcTime.getUTCMinutes()).toBe(0)
    })
  })

  describe('formatWithTimezone (T060)', () => {
    it('should format time with timezone abbreviation', () => {
      const time = new Date('2025-12-12T14:00:00.000Z')
      const formatted = formatWithTimezone(time, 'America/New_York')

      // Should include time, timezone offset (UTC±N), and timezone identifier
      expect(formatted).toContain('AM')
      expect(formatted).toContain('UTC') // GMT offset format like UTC−5
      expect(formatted).toContain('America/New_York')
    })
  })

  describe('calculateStatus (T061)', () => {
    const workDay = true
    const notWorkDay = false
    const isHoliday = true
    const notHoliday = false

    it('should return critical for holidays (Priority 1)', () => {
      // Test at any time during a holiday
      const morningTime = new Date('2025-12-25T09:00:00')
      const result = calculateStatus(morningTime, DEFAULT_CONFIG, isHoliday, workDay)

      expect(result.status).toBe('critical')
      expect(result.reason).toBeDefined()
    })

    it('should return critical for non-working days (Priority 1)', () => {
      // Test at any time on a non-working day
      const morningTime = new Date('2025-12-13T09:00:00') // Saturday
      const result = calculateStatus(morningTime, DEFAULT_CONFIG, notHoliday, notWorkDay)

      expect(result.status).toBe('critical')
      expect(result.reason).toBeDefined()
    })

    it('should return green for times within green hours (Priority 2)', () => {
      // Test during green hours: 9:00 AM - 5:00 PM
      const testCases = [
        { hour: 9, minute: 0 }, // Start of green
        { hour: 12, minute: 0 }, // Middle of day
        { hour: 16, minute: 59 } // End of green (before 17:00)
      ]

      testCases.forEach(({ hour, minute }) => {
        const time = new Date(2025, 11, 12, hour, minute) // Month is 0-indexed
        const result = calculateStatus(time, DEFAULT_CONFIG, notHoliday, workDay)
        expect(result.status).toBe('green')
      })
    })

    it('should return orange for times in morning buffer (Priority 3)', () => {
      // Test during orange morning hours: 8:00 AM - 9:00 AM
      const testCases = [
        { hour: 8, minute: 0 }, // Start of orange morning
        { hour: 8, minute: 30 }, // Middle of orange morning
        { hour: 8, minute: 59 } // End of orange morning
      ]

      testCases.forEach(({ hour, minute }) => {
        const time = new Date(2025, 11, 12, hour, minute)
        const result = calculateStatus(time, DEFAULT_CONFIG, notHoliday, workDay)
        expect(result.status).toBe('orange')
      })
    })

    it('should return orange for times in evening buffer (Priority 3)', () => {
      // Test during orange evening hours: 5:00 PM - 6:00 PM
      const testCases = [
        { hour: 17, minute: 0 }, // Start of orange evening
        { hour: 17, minute: 30 }, // Middle of orange evening
        { hour: 17, minute: 59 } // End of orange evening
      ]

      testCases.forEach(({ hour, minute }) => {
        const time = new Date(2025, 11, 12, hour, minute)
        const result = calculateStatus(time, DEFAULT_CONFIG, notHoliday, workDay)
        expect(result.status).toBe('orange')
      })
    })

    it('should return red for times outside acceptable hours (Priority 4)', () => {
      // Test during red hours: before 8:00 AM and after 6:00 PM
      const testCases = [
        { hour: 0, minute: 0 }, // Midnight
        { hour: 7, minute: 59 }, // Before orange morning
        { hour: 18, minute: 0 }, // After orange evening
        { hour: 23, minute: 59 } // Late night
      ]

      testCases.forEach(({ hour, minute }) => {
        const time = new Date(2025, 11, 12, hour, minute)
        const result = calculateStatus(time, DEFAULT_CONFIG, notHoliday, workDay)
        expect(result.status).toBe('red')
      })
    })

    it('should respect custom config hours', () => {
      const customConfig = {
        green_start: '10:00',
        green_end: '18:00',
        orange_morning_start: '09:00',
        orange_morning_end: '10:00',
        orange_evening_start: '18:00',
        orange_evening_end: '19:00',
        work_days: [1, 2, 3, 4, 5]
      }

      // Test at 9:30 AM - should be orange with custom config
      const time = new Date(2025, 11, 12, 9, 30)
      const result = calculateStatus(time, customConfig, notHoliday, workDay)
      expect(result.status).toBe('orange')

      // Test at 10:30 AM - should be green with custom config
      const greenTime = new Date(2025, 11, 12, 10, 30)
      const greenResult = calculateStatus(greenTime, customConfig, notHoliday, workDay)
      expect(greenResult.status).toBe('green')
    })

    it('should prioritize holiday over time-based status', () => {
      // Even during green hours, holiday should return critical
      const greenHourTime = new Date(2025, 11, 25, 10, 0)
      const result = calculateStatus(greenHourTime, DEFAULT_CONFIG, isHoliday, workDay)

      expect(result.status).toBe('critical')
    })

    it('should prioritize non-working day over time-based status', () => {
      // Even during green hours, non-working day should return critical
      const greenHourTime = new Date(2025, 11, 13, 10, 0) // Saturday
      const result = calculateStatus(greenHourTime, DEFAULT_CONFIG, notHoliday, notWorkDay)

      expect(result.status).toBe('critical')
    })
  })
})
