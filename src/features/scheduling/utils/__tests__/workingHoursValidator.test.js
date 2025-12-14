import { describe, it, expect } from 'vitest'
import { determineColorStatus, isWorkingDay, formatTimeRange } from '../workingHoursValidator'

const config = {
  green_start: '09:00:00',
  green_end: '17:00:00',
  orange_start_morning: '08:00:00',
  orange_end_morning: '09:00:00',
  orange_start_evening: '17:00:00',
  orange_end_evening: '18:00:00',
  work_week_pattern: 'MTWTF'
}

describe('workingHoursValidator', () => {
  describe('determineColorStatus', () => {
    it('should return red for holidays', () => {
      const localTime = new Date('2025-12-25T10:00:00')
      const result = determineColorStatus(localTime, config, true)
      expect(result).toEqual({
        status: 'red',
        is_critical: true,
        reason: 'National holiday'
      })
    })

    it('should return red for non-working days', () => {
      const localTime = new Date('2025-12-28T10:00:00') // Sunday
      const result = determineColorStatus(localTime, config, false)
      expect(result).toEqual({
        status: 'red',
        is_critical: true,
        reason: 'Non-working day'
      })
    })

    it('should return green for optimal working hours', () => {
      const localTime = new Date('2025-12-29T14:00:00') // Monday
      const result = determineColorStatus(localTime, config, false)
      expect(result).toEqual({
        status: 'green',
        is_critical: false,
        reason: 'Within optimal working hours'
      })
    })

    it('should return orange for acceptable morning hours', () => {
      const localTime = new Date('2025-12-29T08:30:00') // Monday
      const result = determineColorStatus(localTime, config, false)
      expect(result).toEqual({
        status: 'orange',
        is_critical: false,
        reason: 'Outside optimal hours but acceptable'
      })
    })

    it('should return orange for acceptable evening hours', () => {
      const localTime = new Date('2025-12-29T17:30:00') // Monday
      const result = determineColorStatus(localTime, config, false)
      expect(result).toEqual({
        status: 'orange',
        is_critical: false,
        reason: 'Outside optimal hours but acceptable'
      })
    })

    it('should return red for times outside of working hours', () => {
      const localTime = new Date('2025-12-29T04:00:00') // Monday
      const result = determineColorStatus(localTime, config, false)
      expect(result).toEqual({
        status: 'red',
        is_critical: false,
        reason: 'Outside acceptable working hours'
      })
    })

    it('should throw an error for invalid input', () => {
      expect(() => determineColorStatus(null, config)).toThrow(
        'Valid localTime Date object is required'
      )
      expect(() => determineColorStatus(new Date(), null)).toThrow(
        'Country configuration is required'
      )
    })
  })

  describe('isWorkingDay', () => {
    it('should return true for a working day', () => {
      const date = new Date('2025-12-29T10:00:00') // Monday
      expect(isWorkingDay(date, 'MTWTF')).toBe(true)
    })

    it('should return false for a non-working day', () => {
      const date = new Date('2025-12-28T10:00:00') // Sunday
      expect(isWorkingDay(date, 'MTWTF')).toBe(false)
    })

    it('should handle different work week patterns', () => {
      const date = new Date('2025-12-28T10:00:00') // Sunday
      expect(isWorkingDay(date, 'SuMTWTh')).toBe(true)
      const date2 = new Date('2025-12-27T10:00:00') // Saturday
      expect(isWorkingDay(date2, 'SuMTWTh')).toBe(false)
    })

    it('should throw an error for invalid input', () => {
      expect(() => isWorkingDay(null, 'MTWTF')).toThrow('Valid date is required')
      expect(() => isWorkingDay(new Date(), null)).toThrow('Valid work week pattern is required')
      expect(() => isWorkingDay(new Date(), 123)).toThrow('Valid work week pattern is required')
    })
  })

  describe('formatTimeRange', () => {
    it('should format a time range correctly', () => {
      expect(formatTimeRange('09:00:00', '17:00:00')).toBe('9:00 AM - 5:00 PM')
    })

    it('should handle 24-hour format conversion', () => {
      expect(formatTimeRange('13:30:00', '22:00:00')).toBe('1:30 PM - 10:00 PM')
    })

    it('should handle midnight and noon correctly', () => {
      expect(formatTimeRange('00:00:00', '12:00:00')).toBe('12:00 AM - 12:00 PM')
      expect(formatTimeRange('12:00:00', '00:00:00')).toBe('12:00 PM - 12:00 AM')
    })
  })
})
