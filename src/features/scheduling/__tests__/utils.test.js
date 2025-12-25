import { describe, it, expect } from 'vitest'
import {
  getIANATimezones,
  getCountryCodes,
  isValidTimezone,
  isValidCountryCode,
  getCountryName,
  DEFAULT_CONFIG
} from '../utils'

describe('utils.js', () => {
  describe('getIANATimezones', () => {
    it('should return an array of timezone strings', () => {
      const timezones = getIANATimezones()
      expect(Array.isArray(timezones)).toBe(true)
      expect(timezones.length).toBeGreaterThan(0)
    })

    it('should include common timezones', () => {
      const timezones = getIANATimezones()
      expect(timezones).toContain('America/New_York')
      expect(timezones).toContain('Europe/London')
      expect(timezones).toContain('Asia/Tokyo')
      expect(timezones).toContain('Australia/Sydney')
    })

    it('should return unique timezone strings', () => {
      const timezones = getIANATimezones()
      const uniqueTimezones = [...new Set(timezones)]
      expect(timezones.length).toBe(uniqueTimezones.length)
    })

    it('should return timezones in IANA format (Area/Location)', () => {
      const timezones = getIANATimezones()
      timezones.forEach((tz) => {
        expect(tz).toMatch(/^[A-Z][a-z_]+\/[A-Z][a-z_]+/)
      })
    })
  })

  describe('getCountryCodes', () => {
    it('should return an array of country objects', () => {
      const countries = getCountryCodes()
      expect(Array.isArray(countries)).toBe(true)
      expect(countries.length).toBeGreaterThan(0)
    })

    it('should return countries with code and name properties', () => {
      const countries = getCountryCodes()
      countries.forEach((country) => {
        expect(country).toHaveProperty('code')
        expect(country).toHaveProperty('name')
        expect(typeof country.code).toBe('string')
        expect(typeof country.name).toBe('string')
      })
    })

    it('should include common countries', () => {
      const countries = getCountryCodes()
      const codes = countries.map((c) => c.code)
      expect(codes).toContain('US')
      expect(codes).toContain('GB')
      expect(codes).toContain('FR')
      expect(codes).toContain('DE')
      expect(codes).toContain('JP')
    })

    it('should have country codes in uppercase ISO 3166-1 alpha-2 format', () => {
      const countries = getCountryCodes()
      countries.forEach((country) => {
        expect(country.code).toMatch(/^[A-Z]{2}$/)
      })
    })

    it('should have non-empty country names', () => {
      const countries = getCountryCodes()
      countries.forEach((country) => {
        expect(country.name.length).toBeGreaterThan(0)
      })
    })

    it('should return countries sorted by name', () => {
      const countries = getCountryCodes()
      const names = countries.map((c) => c.name)
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })
  })

  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      expect(isValidTimezone('America/New_York')).toBe(true)
      expect(isValidTimezone('Europe/London')).toBe(true)
      expect(isValidTimezone('Asia/Tokyo')).toBe(true)
      expect(isValidTimezone('Australia/Sydney')).toBe(true)
    })

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false)
      expect(isValidTimezone('NotATimezone')).toBe(false)
      expect(isValidTimezone('America/FakeCity')).toBe(false)
    })

    it('should return false for empty or null values', () => {
      expect(isValidTimezone('')).toBe(false)
      expect(isValidTimezone(null)).toBe(false)
      expect(isValidTimezone(undefined)).toBe(false)
    })

    it('should be case-sensitive', () => {
      expect(isValidTimezone('america/new_york')).toBe(false)
      expect(isValidTimezone('AMERICA/NEW_YORK')).toBe(false)
    })
  })

  describe('isValidCountryCode', () => {
    it('should return true for valid ISO 3166-1 alpha-2 country codes', () => {
      expect(isValidCountryCode('US')).toBe(true)
      expect(isValidCountryCode('GB')).toBe(true)
      expect(isValidCountryCode('FR')).toBe(true)
      expect(isValidCountryCode('DE')).toBe(true)
      expect(isValidCountryCode('JP')).toBe(true)
    })

    it('should return false for invalid country codes', () => {
      expect(isValidCountryCode('XX')).toBe(false)
      expect(isValidCountryCode('ZZ')).toBe(false)
      expect(isValidCountryCode('ABC')).toBe(false)
      expect(isValidCountryCode('1A')).toBe(false)
    })

    it('should be case-insensitive (accepts lowercase)', () => {
      expect(isValidCountryCode('us')).toBe(true)
      expect(isValidCountryCode('gb')).toBe(true)
      expect(isValidCountryCode('Us')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidCountryCode('')).toBe(false)
    })

    it('should throw error for null or undefined values', () => {
      expect(() => isValidCountryCode(null)).toThrow()
      expect(() => isValidCountryCode(undefined)).toThrow()
    })
  })

  describe('getCountryName', () => {
    it('should return the country name for valid country codes', () => {
      expect(getCountryName('US')).toBe('United States')
      expect(getCountryName('GB')).toBe('United Kingdom')
      expect(getCountryName('FR')).toBe('France')
      expect(getCountryName('DE')).toBe('Germany')
      expect(getCountryName('JP')).toBe('Japan')
    })

    it('should return null for invalid country codes', () => {
      expect(getCountryName('XX')).toBeNull()
      expect(getCountryName('ZZ')).toBeNull()
      expect(getCountryName('ABC')).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(getCountryName('')).toBeNull()
    })

    it('should throw error for null or undefined values', () => {
      expect(() => getCountryName(null)).toThrow()
      expect(() => getCountryName(undefined)).toThrow()
    })

    it('should be case-insensitive (accepts lowercase)', () => {
      expect(getCountryName('us')).toBe('United States')
      expect(getCountryName('gb')).toBe('United Kingdom')
      expect(getCountryName('Us')).toBe('United States')
    })
  })

  describe('DEFAULT_CONFIG', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('green_start')
      expect(DEFAULT_CONFIG).toHaveProperty('green_end')
      expect(DEFAULT_CONFIG).toHaveProperty('orange_morning_start')
      expect(DEFAULT_CONFIG).toHaveProperty('orange_morning_end')
      expect(DEFAULT_CONFIG).toHaveProperty('orange_evening_start')
      expect(DEFAULT_CONFIG).toHaveProperty('orange_evening_end')
      expect(DEFAULT_CONFIG).toHaveProperty('work_days')
    })

    it('should have valid time format strings (HH:MM)', () => {
      expect(DEFAULT_CONFIG.green_start).toMatch(/^\d{2}:\d{2}$/)
      expect(DEFAULT_CONFIG.green_end).toMatch(/^\d{2}:\d{2}$/)
      expect(DEFAULT_CONFIG.orange_morning_start).toMatch(/^\d{2}:\d{2}$/)
      expect(DEFAULT_CONFIG.orange_morning_end).toMatch(/^\d{2}:\d{2}$/)
      expect(DEFAULT_CONFIG.orange_evening_start).toMatch(/^\d{2}:\d{2}$/)
      expect(DEFAULT_CONFIG.orange_evening_end).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should have work_days as an array of numbers', () => {
      expect(Array.isArray(DEFAULT_CONFIG.work_days)).toBe(true)
      DEFAULT_CONFIG.work_days.forEach((day) => {
        expect(typeof day).toBe('number')
        expect(day).toBeGreaterThanOrEqual(0)
        expect(day).toBeLessThanOrEqual(6)
      })
    })

    it('should have standard working hours (9-5)', () => {
      expect(DEFAULT_CONFIG.green_start).toBe('09:00')
      expect(DEFAULT_CONFIG.green_end).toBe('17:00')
    })

    it('should have work_days for Monday-Friday (1-5)', () => {
      expect(DEFAULT_CONFIG.work_days).toEqual([1, 2, 3, 4, 5])
    })

    it('should have orange hours surrounding green hours', () => {
      expect(DEFAULT_CONFIG.orange_morning_start).toBe('08:00')
      expect(DEFAULT_CONFIG.orange_morning_end).toBe('09:00')
      expect(DEFAULT_CONFIG.orange_evening_start).toBe('17:00')
      expect(DEFAULT_CONFIG.orange_evening_end).toBe('18:00')
    })
  })
})
