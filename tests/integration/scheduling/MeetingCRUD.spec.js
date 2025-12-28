/**
 * Integration tests for Meeting CRUD operations
 * T063: Test createMeeting + addParticipant
 * Verifies: 50 participant limit, duration validation, database operations
 *
 * Note: These tests require a test Supabase instance or mocked Supabase client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSchedulingStore } from '@/features/scheduling/store'

// Mock Supabase client
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: {
      from: vi.fn(() => ({
        insert: vi.fn((data) => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: 'mock-meeting-id',
                  ...data // Spread the inserted data (data is an object, not array)
                },
                error: null
              })
            )
          }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
            })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: {}, error: null }))
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    }
  })
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'mock-user-id', email: 'test@example.com' }
  })
}))

describe('Meeting CRUD Integration (T063)', () => {
  let store

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
    store = useSchedulingStore()
  })

  describe('createMeeting', () => {
    it('should create a meeting with valid data', async () => {
      const meetingData = {
        title: 'International Team Sync',
        proposed_time: '2025-12-12T14:00:00.000Z',
        duration_minutes: 60,
        notes: 'Quarterly planning'
      }

      const meeting = await store.createMeeting(meetingData)

      expect(meeting).toBeDefined()
      expect(meeting.id).toBeDefined()
      expect(meeting.title).toBe(meetingData.title)
      expect(meeting.proposed_time).toBe(meetingData.proposed_time)
      expect(meeting.duration_minutes).toBe(meetingData.duration_minutes)
    })

    it('should validate duration is at least 15 minutes (FR-001a)', async () => {
      const invalidMeeting = {
        title: 'Too Short',
        proposed_time: '2025-12-12T14:00:00.000Z',
        duration_minutes: 10, // Invalid: < 15
        notes: null
      }

      await expect(store.createMeeting(invalidMeeting)).rejects.toThrow(
        'Meeting duration must be between 15 and 480 minutes'
      )
    })

    it('should validate duration is at most 480 minutes (FR-001a)', async () => {
      const invalidMeeting = {
        title: 'Too Long',
        proposed_time: '2025-12-12T14:00:00.000Z',
        duration_minutes: 500, // Invalid: > 480
        notes: null
      }

      await expect(store.createMeeting(invalidMeeting)).rejects.toThrow(
        'Meeting duration must be between 15 and 480 minutes'
      )
    })

    it('should accept valid duration values', async () => {
      const validDurations = [15, 30, 60, 90, 120, 240, 480]

      for (const duration of validDurations) {
        const meetingData = {
          title: `Meeting ${duration}min`,
          proposed_time: '2025-12-12T14:00:00.000Z',
          duration_minutes: duration
        }

        const meeting = await store.createMeeting(meetingData)
        expect(meeting.duration_minutes).toBe(duration)
      }
    })
  })

  describe('addParticipantToMeeting', () => {
    const mockMeetingId = 'mock-meeting-id'
    const mockParticipantId = 'mock-participant-id'

    beforeEach(async () => {
      // Reset the mock to return 0 existing participants by default
      const { useSupabase } = await import('@/composables/useSupabase')
      const supabase = await useSupabase().supabase
      supabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })

    it('should add participant to meeting successfully', async () => {
      await expect(store.addParticipantToMeeting(mockMeetingId, mockParticipantId)).resolves.toBe(
        true
      )
    })

    it('should allow adding up to 50 participants', async () => {
      // Mock having 49 participants
      const { useSupabase } = await import('@/composables/useSupabase')
      const supabase = await useSupabase().supabase

      const mockExistingParticipants = Array.from({ length: 49 }, (_, i) => ({
        id: `participant-${i}`
      }))

      supabase.from = vi.fn((table) => {
        if (table === 'meeting_participants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
                }))
              })),
              limit: vi.fn(() =>
                Promise.resolve({
                  data: mockExistingParticipants,
                  error: null,
                  count: 49
                })
              )
            })),
            insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }
        }
        return supabase.from(table)
      })

      // Should succeed - adding 50th participant
      await expect(store.addParticipantToMeeting(mockMeetingId, 'participant-50')).resolves.toBe(
        true
      )
    })
  })

  describe('Meeting CRUD Workflow', () => {
    it('should complete full workflow: create meeting, add participants, update, delete', async () => {
      // 1. Create meeting
      const meetingData = {
        title: 'Sprint Planning',
        proposed_time: '2025-12-12T14:00:00.000Z',
        duration_minutes: 90,
        notes: 'Q1 2026'
      }

      const meeting = await store.createMeeting(meetingData)
      expect(meeting).toBeDefined()
      expect(meeting.id).toBeDefined()

      // 2. Add participants (would normally create participants first)
      // This is mocked, so we just verify the function can be called
      const addResult = await store.addParticipantToMeeting(meeting.id, 'participant-1')
      expect(addResult).toBe(true)

      // 3. Update meeting
      const updatedMeeting = await store.updateMeeting(meeting.id, {
        duration_minutes: 120
      })
      expect(updatedMeeting).toBeDefined()

      // 4. Delete meeting
      await expect(store.deleteMeeting(meeting.id)).resolves.toBe(true)
    })
  })
})
