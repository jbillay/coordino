/**
 * Unit Tests for useFeatureTour Composable
 * Feature: 001-user-config - User Story 9 (First-Time User Experience)
 * Tests tour completion tracking and persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useFeatureTour } from '../useFeatureTour'
import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/auth'
import { createPinia, setActivePinia } from 'pinia'

describe('useFeatureTour', () => {
  let tour
  let configStore
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())

    configStore = useConfigStore()
    authStore = useAuthStore()

    authStore.user = { id: 'test-user-123' }

    configStore.completedTours = ref([])
    configStore.isTourCompleted = vi.fn((tourId) =>
      configStore.completedTours.value.includes(tourId)
    )
    configStore.completeTour = vi.fn(async (tourId) => {
      if (!configStore.completedTours.value.includes(tourId)) {
        configStore.completedTours.value.push(tourId)
      }
      return { success: true }
    })
    configStore.resetTour = vi.fn(async (tourId) => {
      const index = configStore.completedTours.value.indexOf(tourId)
      if (index !== -1) {
        configStore.completedTours.value.splice(index, 1)
      }
      return { success: true }
    })
    configStore.resetAllTours = vi.fn(async () => {
      configStore.completedTours.value = []
      return { success: true }
    })
    configStore.getCompletedTours = vi.fn(() => [...configStore.completedTours.value])

    tour = useFeatureTour()
  })

  describe('isTourCompleted', () => {
    it('returns false for tours that have not been completed', () => {
      configStore.completedTours.value = []
      expect(tour.isTourCompleted('tasks-intro')).toBe(false)
    })

    it('returns true for tours that have been completed', () => {
      configStore.completedTours.value = ['tasks-intro', 'notes-intro']
      expect(tour.isTourCompleted('tasks-intro')).toBe(true)
      expect(tour.isTourCompleted('notes-intro')).toBe(true)
    })

    it('is case-sensitive for tour IDs', () => {
      configStore.completedTours.value = ['tasks-intro']
      expect(tour.isTourCompleted('tasks-intro')).toBe(true)
      expect(tour.isTourCompleted('Tasks-Intro')).toBe(false)
      expect(tour.isTourCompleted('TASKS-INTRO')).toBe(false)
    })
  })

  describe('markTourCompleted', () => {
    it('adds tour ID to completed_tours array', async () => {
      configStore.completedTours.value = []
      const result = await tour.markTourCompleted('tasks-intro')

      expect(result).toBe(true)
      expect(configStore.completeTour).toHaveBeenCalledWith('tasks-intro', 'test-user-123')
      expect(configStore.completedTours.value).toContain('tasks-intro')
    })

    it('returns true even if tour already completed', async () => {
      configStore.completedTours.value = ['tasks-intro']
      const result = await tour.markTourCompleted('tasks-intro')

      expect(result).toBe(true)
    })

    it('preserves existing completed tours when adding new ones', async () => {
      configStore.completedTours.value = ['tasks-intro', 'notes-intro']
      await tour.markTourCompleted('scheduling-intro')

      expect(configStore.completedTours.value).toEqual([
        'tasks-intro',
        'notes-intro',
        'scheduling-intro'
      ])
    })

    it('returns false when user is not authenticated', async () => {
      authStore.user = null
      const result = await tour.markTourCompleted('tasks-intro')

      expect(result).toBe(false)
      expect(configStore.completeTour).not.toHaveBeenCalled()
    })

    it('returns false on database error', async () => {
      configStore.completeTour = vi.fn().mockResolvedValue({ success: false, error: 'DB error' })
      const result = await tour.markTourCompleted('tasks-intro')

      expect(result).toBe(false)
    })
  })

  describe('resetTour', () => {
    it('removes tour ID from completed_tours array', async () => {
      configStore.completedTours.value = ['tasks-intro', 'notes-intro', 'scheduling-intro']
      const result = await tour.resetTour('notes-intro')

      expect(result).toBe(true)
      expect(configStore.resetTour).toHaveBeenCalledWith('notes-intro', 'test-user-123')
      expect(configStore.completedTours.value).toEqual(['tasks-intro', 'scheduling-intro'])
    })

    it('returns true if tour ID is not in completed_tours', async () => {
      configStore.completedTours.value = ['tasks-intro']
      const result = await tour.resetTour('nonexistent-tour')

      expect(result).toBe(true)
    })

    it('returns false when user is not authenticated', async () => {
      authStore.user = null
      const result = await tour.resetTour('tasks-intro')

      expect(result).toBe(false)
      expect(configStore.resetTour).not.toHaveBeenCalled()
    })

    it('returns false on database error', async () => {
      configStore.resetTour = vi.fn().mockResolvedValue({ success: false })
      const result = await tour.resetTour('tasks-intro')

      expect(result).toBe(false)
    })
  })

  describe('resetAllTours', () => {
    it('clears all completed tours', async () => {
      configStore.completedTours.value = ['tasks-intro', 'notes-intro', 'scheduling-intro']
      const result = await tour.resetAllTours()

      expect(result).toBe(true)
      expect(configStore.resetAllTours).toHaveBeenCalledWith('test-user-123')
      expect(configStore.completedTours.value).toEqual([])
    })

    it('returns true when completed_tours is already empty', async () => {
      configStore.completedTours.value = []
      const result = await tour.resetAllTours()

      expect(result).toBe(true)
    })

    it('returns false when user is not authenticated', async () => {
      authStore.user = null
      const result = await tour.resetAllTours()

      expect(result).toBe(false)
      expect(configStore.resetAllTours).not.toHaveBeenCalled()
    })

    it('returns false on database error', async () => {
      configStore.resetAllTours = vi.fn().mockResolvedValue({ success: false })
      const result = await tour.resetAllTours()

      expect(result).toBe(false)
    })
  })

  describe('getCompletedTours', () => {
    it('returns array of completed tour IDs', () => {
      configStore.completedTours.value = ['tasks-intro', 'notes-intro']
      expect(tour.getCompletedTours()).toEqual(['tasks-intro', 'notes-intro'])
    })

    it('returns empty array when no tours completed', () => {
      configStore.completedTours.value = []
      expect(tour.getCompletedTours()).toEqual([])
    })

    it('returns a copy of the array', () => {
      configStore.completedTours.value = ['tasks-intro']
      const result = tour.getCompletedTours()
      result.push('notes-intro')

      expect(configStore.completedTours.value).toEqual(['tasks-intro'])
    })
  })

  describe('shouldShowTour', () => {
    it('returns true for tours not yet completed', () => {
      configStore.completedTours.value = []
      expect(tour.shouldShowTour('tasks-intro')).toBe(true)
    })

    it('returns false for tours already completed', () => {
      configStore.completedTours.value = ['tasks-intro']
      expect(tour.shouldShowTour('tasks-intro')).toBe(false)
    })

    it('is opposite of isTourCompleted', () => {
      configStore.completedTours.value = ['notes-intro']
      expect(tour.shouldShowTour('tasks-intro')).toBe(!tour.isTourCompleted('tasks-intro'))
      expect(tour.shouldShowTour('notes-intro')).toBe(!tour.isTourCompleted('notes-intro'))
    })
  })
})
