/**
 * Unit tests for equity score calculation
 * T062: Test calculateScore - verify scoring algorithm for different participant statuses
 */

import { describe, it, expect } from 'vitest'
import { calculateScore, getBreakdown } from '@/features/scheduling/composables/useEquityScore'

describe('useEquityScore', () => {
  describe('calculateScore (T062)', () => {
    it('should return 100 for all green participants', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'green' },
        { id: 2, name: 'Bob', status: 'green' },
        { id: 3, name: 'Charlie', status: 'green' }
      ]

      const score = calculateScore(participants)

      // All green: 3 participants × +10 points = 30
      // Normalized to 0-100 scale: 30 / 30 max = 100
      expect(score).toBe(100)
    })

    it('should return 0 for all critical participants', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'critical' },
        { id: 2, name: 'Bob', status: 'critical' },
        { id: 3, name: 'Charlie', status: 'critical' }
      ]

      const score = calculateScore(participants)

      // All critical: 3 × -50 = -150
      // Normalized and clamped to 0
      expect(score).toBe(0)
    })

    it('should calculate mixed status scores correctly', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'green' }, // +10
        { id: 2, name: 'Bob', status: 'orange' }, // +5
        { id: 3, name: 'Charlie', status: 'red' }, // -15
        { id: 4, name: 'David', status: 'critical' } // -50
      ]

      const score = calculateScore(participants)

      // Total raw score: 10 + 5 - 15 - 50 = -50
      // With 4 participants: max possible = 40 (all green), min = -200 (all critical)
      // Normalized: (-50 - (-200)) / (40 - (-200)) = 150 / 240 = 0.625
      // As percentage: 62.5
      expect(score).toBeCloseTo(62.5, 1)
    })

    it('should handle single participant', () => {
      const greenParticipant = [{ id: 1, name: 'Alice', status: 'green' }]
      const criticalParticipant = [{ id: 1, name: 'Alice', status: 'critical' }]

      expect(calculateScore(greenParticipant)).toBe(100)
      expect(calculateScore(criticalParticipant)).toBe(0)
    })

    it('should return 0 for empty participant list', () => {
      const score = calculateScore([])
      expect(score).toBe(0)
    })

    it('should handle all orange participants', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'orange' },
        { id: 2, name: 'Bob', status: 'orange' }
      ]

      const score = calculateScore(participants)

      // All orange: 2 × +5 = 10
      // Max possible: 2 × +10 = 20
      // Min possible: 2 × -50 = -100
      // Normalized: (10 - (-100)) / (20 - (-100)) = 110 / 120 = 0.9167
      // As percentage: ~91.67
      expect(score).toBeCloseTo(91.67, 1)
    })

    it('should handle all red participants', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'red' },
        { id: 2, name: 'Bob', status: 'red' }
      ]

      const score = calculateScore(participants)

      // All red: 2 × -15 = -30
      // Max possible: 2 × +10 = 20
      // Min possible: 2 × -50 = -100
      // Normalized: (-30 - (-100)) / (20 - (-100)) = 70 / 120 = 0.5833
      // As percentage: ~58.33
      expect(score).toBeCloseTo(58.33, 1)
    })

    it('should handle equal green and critical mix', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'green' },
        { id: 2, name: 'Bob', status: 'critical' }
      ]

      const score = calculateScore(participants)

      // Mix: +10 - 50 = -40
      // Max: 2 × +10 = 20
      // Min: 2 × -50 = -100
      // Normalized: (-40 - (-100)) / (20 - (-100)) = 60 / 120 = 0.5
      // As percentage: 50
      expect(score).toBe(50)
    })

    it('should scale correctly with different participant counts', () => {
      // 10 green participants
      const tenGreen = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `Person${i}`,
        status: 'green'
      }))

      expect(calculateScore(tenGreen)).toBe(100)

      // 10 critical participants
      const tenCritical = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `Person${i}`,
        status: 'critical'
      }))

      expect(calculateScore(tenCritical)).toBe(0)
    })

    it('should handle realistic meeting scenario', () => {
      // Realistic international meeting:
      // - 2 participants in good timezone (green)
      // - 1 participant in acceptable timezone (orange)
      // - 1 participant in poor timezone (red)
      const participants = [
        { id: 1, name: 'NYC', status: 'green' },
        { id: 2, name: 'London', status: 'green' },
        { id: 3, name: 'Berlin', status: 'orange' },
        { id: 4, name: 'Tokyo', status: 'red' }
      ]

      const score = calculateScore(participants)

      // Raw: 10 + 10 + 5 - 15 = 10
      // Max: 40, Min: -200
      // Normalized: (10 - (-200)) / (40 - (-200)) = 210 / 240 = 0.875
      // As percentage: 87.5
      expect(score).toBeCloseTo(87.5, 1)
    })
  })

  describe('getBreakdown (T062)', () => {
    it('should count participants by status', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'green' },
        { id: 2, name: 'Bob', status: 'green' },
        { id: 3, name: 'Charlie', status: 'orange' },
        { id: 4, name: 'David', status: 'red' },
        { id: 5, name: 'Eve', status: 'critical' }
      ]

      const breakdown = getBreakdown(participants)

      expect(breakdown.green).toBe(2)
      expect(breakdown.orange).toBe(1)
      expect(breakdown.red).toBe(1)
      expect(breakdown.critical).toBe(1)
      expect(breakdown.total).toBe(5)
    })

    it('should handle all same status', () => {
      const participants = [
        { id: 1, name: 'Alice', status: 'green' },
        { id: 2, name: 'Bob', status: 'green' },
        { id: 3, name: 'Charlie', status: 'green' }
      ]

      const breakdown = getBreakdown(participants)

      expect(breakdown.green).toBe(3)
      expect(breakdown.orange).toBe(0)
      expect(breakdown.red).toBe(0)
      expect(breakdown.critical).toBe(0)
      expect(breakdown.total).toBe(3)
    })

    it('should handle empty list', () => {
      const breakdown = getBreakdown([])

      expect(breakdown.green).toBe(0)
      expect(breakdown.orange).toBe(0)
      expect(breakdown.red).toBe(0)
      expect(breakdown.critical).toBe(0)
      expect(breakdown.total).toBe(0)
    })

    it('should handle single participant of each status', () => {
      const greenOnly = [{ id: 1, status: 'green' }]
      const orangeOnly = [{ id: 1, status: 'orange' }]
      const redOnly = [{ id: 1, status: 'red' }]
      const criticalOnly = [{ id: 1, status: 'critical' }]

      expect(getBreakdown(greenOnly).green).toBe(1)
      expect(getBreakdown(orangeOnly).orange).toBe(1)
      expect(getBreakdown(redOnly).red).toBe(1)
      expect(getBreakdown(criticalOnly).critical).toBe(1)
    })

    it('should calculate total correctly', () => {
      const participants = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        status: i % 4 === 0 ? 'green' : i % 4 === 1 ? 'orange' : i % 4 === 2 ? 'red' : 'critical'
      }))

      const breakdown = getBreakdown(participants)

      expect(breakdown.total).toBe(50)
      expect(breakdown.green + breakdown.orange + breakdown.red + breakdown.critical).toBe(50)
    })
  })
})
