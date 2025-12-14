import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchHolidays, isHoliday, getUpcomingHolidays } from '../holidayService'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

describe('holidayService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockClear()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('fetchHolidays', () => {
    it('should fetch and return holidays for a valid country and year', async () => {
      const mockHolidays = [
        {
          date: '2025-01-01',
          name: "New Year's Day",
          localName: "New Year's Day",
          countryCode: 'US',
          fixed: true,
          global: true,
          counties: null,
          types: ['Public']
        }
      ]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHolidays)
      })

      const holidays = await fetchHolidays('US', 2025)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://date.nager.at/api/v3/PublicHolidays/2025/US',
        expect.any(Object)
      )
      expect(holidays).toHaveLength(1)
      expect(holidays[0].name).toBe("New Year's Day")
      expect(holidays[0].date).toBeInstanceOf(Date)
    })

    it('should return cached holidays without fetching', async () => {
      const mockHolidays = [
        {
          date: '2025-01-01',
          name: "New Year's Day",
          localName: "New Year's Day",
          countryCode: 'US',
          fixed: true,
          global: true,
          counties: null,
          types: ['Public']
        }
      ]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHolidays)
      })

      // First call to populate cache
      await fetchHolidays('US', 2025)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second call
      const holidays = await fetchHolidays('US', 2025)

      expect(mockFetch).toHaveBeenCalledTimes(1) // Should not fetch again
      expect(holidays).toHaveLength(1)
      expect(holidays[0].name).toBe("New Year's Day")
    })

    it('should re-fetch holidays when cache is expired', async () => {
      const mockHolidays = [
        {
          date: '2025-01-01',
          name: "New Year's Day",
          localName: "New Year's Day",
          countryCode: 'US',
          fixed: true,
          global: true,
          counties: null,
          types: ['Public']
        }
      ]
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHolidays)
      })

      // First call to populate cache
      await fetchHolidays('US', 2025)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Advance time by 8 days
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000)

      // Second call
      await fetchHolidays('US', 2025)
      expect(mockFetch).toHaveBeenCalledTimes(2) // Should fetch again
    })

    it('should not retry on 404 and return an empty array', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const holidays = await fetchHolidays('XX', 2025)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(holidays).toEqual([])
    })

    it('should throw an error for invalid input', async () => {
      await expect(fetchHolidays('USA', 2025)).rejects.toThrow(
        'Valid ISO 3166-1 alpha-2 country code required'
      )
      await expect(fetchHolidays('U', 2025)).rejects.toThrow(
        'Valid ISO 3166-1 alpha-2 country code required'
      )
      await expect(fetchHolidays(null, 2025)).rejects.toThrow(
        'Valid ISO 3166-1 alpha-2 country code required'
      )
      await expect(fetchHolidays('US', 1999)).rejects.toThrow('Valid year required (2000-2100)')
      await expect(fetchHolidays('US', 2101)).rejects.toThrow('Valid year required (2000-2100)')
    })
  })

  describe('isHoliday', () => {
    const holidays = [
      {
        date: new Date('2025-12-25T00:00:00.000Z'),
        name: 'Christmas Day'
      },
      {
        date: new Date('2025-01-01T00:00:00.000Z'),
        name: "New Year's Day"
      }
    ]

    it('should return the holiday object if the date is a holiday', () => {
      const date = new Date('2025-12-25T10:00:00.000Z')
      const holiday = isHoliday(date, holidays)
      expect(holiday).not.toBeNull()
      expect(holiday.name).toBe('Christmas Day')
    })

    it('should return null if the date is not a holiday', () => {
      const date = new Date('2025-12-26T10:00:00.000Z')
      expect(isHoliday(date, holidays)).toBeNull()
    })

    it('should ignore the time part of the date', () => {
      const date = new Date('2025-12-25T23:59:59.999Z')
      const holiday = isHoliday(date, holidays)
      expect(holiday).not.toBeNull()
      expect(holiday.name).toBe('Christmas Day')
    })

    it('should throw an error for invalid input', () => {
      expect(() => isHoliday(null, holidays)).toThrow('Valid date is required')
      expect(() => isHoliday(new Date(), null)).toThrow('Holidays must be an array')
      expect(() => isHoliday(new Date(), {})).toThrow('Holidays must be an array')
    })
  })

  describe('getUpcomingHolidays', () => {
    const holidays = [
      { date: new Date('2025-12-25T00:00:00.000Z'), name: 'Christmas Day' },
      { date: new Date('2026-01-01T00:00:00.000Z'), name: "New Year's Day" },
      { date: new Date('2025-07-04T00:00:00.000Z'), name: 'Independence Day' },
      { date: new Date('2025-11-27T00:00:00.000Z'), name: 'Thanksgiving' }
    ]

    it('should return the specified number of upcoming holidays', () => {
      const fromDate = new Date('2025-07-01T00:00:00.000Z')
      const upcoming = getUpcomingHolidays(holidays, fromDate, 2)
      expect(upcoming).toHaveLength(2)
      expect(upcoming[0].name).toBe('Independence Day')
      expect(upcoming[1].name).toBe('Thanksgiving')
    })

    it('should return holidays sorted by date', () => {
      const fromDate = new Date('2025-01-01T00:00:00.000Z')
      const upcoming = getUpcomingHolidays(holidays, fromDate, 4)
      expect(upcoming.map((h) => h.name)).toEqual([
        'Independence Day',
        'Thanksgiving',
        'Christmas Day',
        "New Year's Day"
      ])
    })

    it('should return an empty array if no upcoming holidays', () => {
      const fromDate = new Date('2026-01-02T00:00:00.000Z')
      const upcoming = getUpcomingHolidays(holidays, fromDate)
      expect(upcoming).toEqual([])
    })

    it('should throw an error for invalid input', () => {
      expect(() => getUpcomingHolidays(null, new Date())).toThrow('Holidays must be an array')
      expect(() => getUpcomingHolidays([], null)).toThrow('Valid date is required')
    })
  })
})
