import { describe, it, expect } from 'vitest'
import { calculateEquityScore, getScoreQuality } from '../equityScorer'

describe('equityScorer', () => {
  describe('calculateEquityScore', () => {
    it('calculates score for all green statuses', () => {
      const statuses = [
        { status: 'green', is_critical: false },
        { status: 'green', is_critical: false },
        { status: 'green', is_critical: false }
      ]

      const result = calculateEquityScore(statuses)

      expect(result.green_count).toBe(3)
      expect(result.orange_count).toBe(0)
      expect(result.red_count).toBe(0)
      expect(result.critical_count).toBe(0)
      expect(result.total_points).toBe(30) // 3 * 10
      expect(result.max_possible).toBe(30) // 3 * 10
      expect(result.score).toBe(100) // Perfect score
    })

    it('calculates score for mixed statuses', () => {
      const statuses = [
        { status: 'green', is_critical: false },
        { status: 'orange', is_critical: false },
        { status: 'red', is_critical: false }
      ]

      const result = calculateEquityScore(statuses)

      expect(result.green_count).toBe(1)
      expect(result.orange_count).toBe(1)
      expect(result.red_count).toBe(1)
      expect(result.critical_count).toBe(0)
      expect(result.total_points).toBe(0) // 10 + 5 - 15
      expect(result.max_possible).toBe(30) // 3 * 10
      expect(result.score).toBe(0)
    })

    it('handles critical status', () => {
      const statuses = [
        { status: 'green', is_critical: false },
        { status: 'red', is_critical: true }
      ]

      const result = calculateEquityScore(statuses)

      expect(result.green_count).toBe(1)
      expect(result.critical_count).toBe(1)
      expect(result.total_points).toBe(-40) // 10 - 50
      expect(result.max_possible).toBe(20) // 2 * 10
      expect(result.score).toBe(0) // Clamped to 0
    })

    it('clamps negative scores to 0', () => {
      const statuses = [
        { status: 'red', is_critical: false },
        { status: 'red', is_critical: false }
      ]

      const result = calculateEquityScore(statuses)

      expect(result.total_points).toBe(-30) // 2 * -15
      expect(result.score).toBe(0) // Clamped
    })

    it('clamps scores above 100 to 100', () => {
      // This shouldn't happen in practice, but test the boundary
      const statuses = [{ status: 'green', is_critical: false }]

      const result = calculateEquityScore(statuses)

      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('returns zero score for empty array', () => {
      const result = calculateEquityScore([])

      expect(result.green_count).toBe(0)
      expect(result.orange_count).toBe(0)
      expect(result.red_count).toBe(0)
      expect(result.critical_count).toBe(0)
      expect(result.total_points).toBe(0)
      expect(result.max_possible).toBe(0)
      expect(result.score).toBe(0)
    })

    it('prioritizes critical over regular status color', () => {
      const statuses = [{ status: 'green', is_critical: true }]

      const result = calculateEquityScore(statuses)

      expect(result.critical_count).toBe(1)
      expect(result.green_count).toBe(0)
      expect(result.total_points).toBe(-50)
    })

    it('handles all orange statuses', () => {
      const statuses = [
        { status: 'orange', is_critical: false },
        { status: 'orange', is_critical: false }
      ]

      const result = calculateEquityScore(statuses)

      expect(result.orange_count).toBe(2)
      expect(result.total_points).toBe(10) // 2 * 5
      expect(result.max_possible).toBe(20) // 2 * 10
      expect(result.score).toBe(50) // 10/20 * 100
    })

    it('handles large number of participants', () => {
      const statuses = Array(10).fill({ status: 'green', is_critical: false })

      const result = calculateEquityScore(statuses)

      expect(result.green_count).toBe(10)
      expect(result.total_points).toBe(100)
      expect(result.max_possible).toBe(100)
      expect(result.score).toBe(100)
    })

    it('rounds score to integer', () => {
      const statuses = [
        { status: 'green', is_critical: false },
        { status: 'orange', is_critical: false },
        { status: 'orange', is_critical: false }
      ]

      const result = calculateEquityScore(statuses)

      expect(Number.isInteger(result.score)).toBe(true)
    })
  })

  describe('getScoreQuality', () => {
    it('returns excellent for score >= 71', () => {
      expect(getScoreQuality(100)).toBe('excellent')
      expect(getScoreQuality(85)).toBe('excellent')
      expect(getScoreQuality(71)).toBe('excellent')
    })

    it('returns good for score >= 41 and < 71', () => {
      expect(getScoreQuality(70)).toBe('good')
      expect(getScoreQuality(55)).toBe('good')
      expect(getScoreQuality(41)).toBe('good')
    })

    it('returns fair for score >= 1 and < 41', () => {
      expect(getScoreQuality(40)).toBe('fair')
      expect(getScoreQuality(20)).toBe('fair')
      expect(getScoreQuality(1)).toBe('fair')
    })

    it('returns poor for score 0', () => {
      expect(getScoreQuality(0)).toBe('poor')
    })

    it('returns poor for negative scores', () => {
      expect(getScoreQuality(-10)).toBe('poor')
    })

    it('handles edge cases at boundaries', () => {
      expect(getScoreQuality(71)).toBe('excellent')
      expect(getScoreQuality(70)).toBe('good')
      expect(getScoreQuality(41)).toBe('good')
      expect(getScoreQuality(40)).toBe('fair')
      expect(getScoreQuality(1)).toBe('fair')
      expect(getScoreQuality(0)).toBe('poor')
    })
  })
})
