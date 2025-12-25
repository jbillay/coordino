import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { retryWithBackoff, fetchHolidays, prefetchHolidays, checkHoliday } from '../useHolidays'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'

// Mock dependencies
vi.mock('@/composables/useSupabase')
vi.mock('@/stores/auth')

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useHolidays', () => {
  let mockSupabaseClient
  let mockAuthStore

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null })
    }
    vi.mocked(useSupabase).mockReturnValue({ supabase: mockSupabaseClient })

    mockAuthStore = {
      user: { id: 'test-user-id' }
    }
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)
  })

  // --- retryWithBackoff Tests ---
  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return the result on the first successful attempt', async () => {
      const successfulFn = vi.fn().mockResolvedValue('success')
      await expect(retryWithBackoff(successfulFn)).resolves.toBe('success')
      expect(successfulFn).toHaveBeenCalledTimes(1)
    })

    it('should retry the function on failure', async () => {
      const failingFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success')

      const promise = retryWithBackoff(failingFn, 2)
      await vi.advanceTimersByTimeAsync(1001)

      await expect(promise).resolves.toBe('success')
      expect(failingFn).toHaveBeenCalledTimes(2)
    })

    it('should throw an error after all retries fail', async () => {
      const alwaysFailingFn = vi.fn().mockRejectedValue(new Error('persistent failure'))

      const promise = retryWithBackoff(alwaysFailingFn, 3)

      // Immediately attach catch handler to prevent unhandled rejection
      promise.catch(() => {})

      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('persistent failure')
      expect(alwaysFailingFn).toHaveBeenCalledTimes(3)
    })
  })

  // --- fetchHolidays Tests ---
  describe('fetchHolidays', () => {
    const mockHolidays = [{ date: '2025-01-01', name: "New Year's Day" }]

    it('should return cached holidays if they are recent', async () => {
      const cachedData = {
        holidays_json: mockHolidays,
        cached_at: new Date().toISOString()
      }
      mockSupabaseClient.from().maybeSingle.mockResolvedValue({ data: cachedData, error: null })

      const result = await fetchHolidays('US', 2025)

      expect(result).toEqual(mockHolidays)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('holiday_cache')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fetch from API if cache is expired', async () => {
      const expiredCachedData = {
        holidays_json: [{ date: '2025-12-25', name: 'Christmas' }],
        cached_at: new Date('2020-01-01').toISOString()
      }
      mockSupabaseClient
        .from()
        .maybeSingle.mockResolvedValue({ data: expiredCachedData, error: null })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockHolidays
      })

      const result = await fetchHolidays('US', 2025)

      expect(result).toEqual(mockHolidays)
      expect(mockFetch).toHaveBeenCalled()
      expect(mockSupabaseClient.from('holiday_cache').upsert).toHaveBeenCalled()
    })

    it('should fetch from API and cache the result if not in cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockHolidays
      })

      const result = await fetchHolidays('US', 2025)

      expect(result).toEqual(mockHolidays)
      expect(mockSupabaseClient.from('holiday_cache').upsert).toHaveBeenCalled()
    })

    it('should return an empty array on API failure', async () => {
      vi.useFakeTimers()
      mockFetch.mockRejectedValue(new Error('Network failure'))

      const resultPromise = fetchHolidays('US', 2025)
      await vi.runAllTimersAsync()
      const result = await resultPromise

      expect(result).toEqual([])
      vi.useRealTimers()
    })

    it('should fetch directly from API if user is not authenticated', async () => {
      mockAuthStore.user = null
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockHolidays
      })

      const result = await fetchHolidays('US', 2025)

      expect(result).toEqual(mockHolidays)
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  // --- prefetchHolidays Tests ---
  describe('prefetchHolidays', () => {
    it('should call fetch for current and next year for each country code', async () => {
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] })

      await prefetchHolidays(['US', 'FR'])

      expect(mockFetch).toHaveBeenCalledWith(
        `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/US`
      )
      expect(mockFetch).toHaveBeenCalledWith(
        `https://date.nager.at/api/v3/PublicHolidays/${nextYear}/US`
      )
      expect(mockFetch).toHaveBeenCalledWith(
        `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/FR`
      )
      expect(mockFetch).toHaveBeenCalledWith(
        `https://date.nager.at/api/v3/PublicHolidays/${nextYear}/FR`
      )
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })
  })

  // --- checkHoliday Tests ---
  describe('checkHoliday', () => {
    const holidays = [
      { date: '2025-01-01', name: "New Year's Day" },
      { date: '2025-12-25', name: 'Christmas Day' }
    ]

    it('should return the holiday object if the date is a holiday', () => {
      const date = new Date('2025-12-25T12:00:00Z')
      const result = checkHoliday(date, holidays)
      expect(result).not.toBeNull()
      expect(result.name).toBe('Christmas Day')
    })

    it('should return null if the date is not a holiday', () => {
      const date = new Date('2025-12-26T12:00:00Z')
      const result = checkHoliday(date, holidays)
      expect(result).toBeNull()
    })

    it('should return null for an empty holiday list', () => {
      const date = new Date('2025-01-01T00:00:00Z')
      expect(checkHoliday(date, [])).toBeNull()
      expect(checkHoliday(date, null)).toBeNull()
    })
  })
})
