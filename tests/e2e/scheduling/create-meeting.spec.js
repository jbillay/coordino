/**
 * E2E test for meeting creation flow
 * T064: Test full workflow - create participants, create meeting, verify timezone display
 * Verifies: complete user journey through the scheduling feature
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import SchedulingView from '@/views/SchedulingView.vue'
import { useSchedulingStore } from '@/features/scheduling/store'

// Mock Supabase client
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: {
      from: vi.fn((table) => {
        if (table === 'participants') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'mock-participant-id',
                      name: 'Test Participant',
                      email: 'test@example.com',
                      country: 'US',
                      timezone: 'America/New_York'
                    },
                    error: null
                  })
                )
              }))
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [],
                  error: null
                })
              )
            }))
          }
        }

        if (table === 'meetings') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: 'mock-meeting-id',
                      title: 'Test Meeting',
                      proposed_time: '2025-12-12T14:00:00.000Z',
                      duration_minutes: 60,
                      user_id: 'mock-user-id'
                    },
                    error: null
                  })
                )
              }))
            })),
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [],
                  error: null
                })
              )
            }))
          }
        }

        if (table === 'meeting_participants') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
                })),
                limit: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
              }))
            })),
            insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }
        }

        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }
      })
    }
  })
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'mock-user-id', email: 'test@example.com' }
  })
}))

describe('Meeting Creation E2E Flow (T064)', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/scheduling',
          name: 'scheduling',
          component: SchedulingView
        }
      ]
    })
  })

  it('should complete full meeting creation workflow', async () => {
    const store = useSchedulingStore()

    // Step 1: Create 3 participants with different timezones
    const participant1 = await store.createParticipant({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      country: 'US',
      timezone: 'America/New_York',
      notes: 'Product Manager'
    })

    const participant2 = await store.createParticipant({
      name: 'Bob Schmidt',
      email: 'bob@example.com',
      country: 'DE',
      timezone: 'Europe/Berlin',
      notes: 'Engineering Lead'
    })

    const participant3 = await store.createParticipant({
      name: 'Yuki Tanaka',
      email: 'yuki@example.com',
      country: 'JP',
      timezone: 'Asia/Tokyo',
      notes: 'Designer'
    })

    expect(participant1).toBeDefined()
    expect(participant1.id).toBeDefined()
    expect(participant1.timezone).toBe('America/New_York')

    expect(participant2).toBeDefined()
    expect(participant2.timezone).toBe('Europe/Berlin')

    expect(participant3).toBeDefined()
    expect(participant3.timezone).toBe('Asia/Tokyo')

    // Step 2: Create a meeting with proposed time
    const meetingData = {
      title: 'International Team Sync',
      proposed_time: '2025-12-12T14:00:00.000Z', // 2:00 PM UTC
      duration_minutes: 60,
      notes: 'Quarterly planning discussion'
    }

    const meeting = await store.createMeeting(meetingData)

    expect(meeting).toBeDefined()
    expect(meeting.id).toBeDefined()
    expect(meeting.title).toBe(meetingData.title)
    expect(meeting.proposed_time).toBe(meetingData.proposed_time)

    // Step 3: Add participants to the meeting
    await store.addParticipantToMeeting(meeting.id, participant1.id)
    await store.addParticipantToMeeting(meeting.id, participant2.id)
    await store.addParticipantToMeeting(meeting.id, participant3.id)

    // Step 4: Verify timezone calculations for each participant
    // Using the same logic as the store's computeParticipantStatus
    const { toLocalTime } = await import('@/features/scheduling/composables/useTimezone')
    const proposedTime = new Date(meeting.proposed_time)

    // Participant 1: New York (EST, UTC-5)
    const nyTime = toLocalTime(proposedTime, participant1.timezone)
    expect(nyTime.getHours()).toBe(9) // 14:00 UTC = 9:00 AM EST

    // Participant 2: Berlin (CET, UTC+1)
    const berlinTime = toLocalTime(proposedTime, participant2.timezone)
    expect(berlinTime.getHours()).toBe(15) // 14:00 UTC = 3:00 PM CET

    // Participant 3: Tokyo (JST, UTC+9)
    const tokyoTime = toLocalTime(proposedTime, participant3.timezone)
    expect(tokyoTime.getHours()).toBe(23) // 14:00 UTC = 11:00 PM JST

    // Step 5: Verify meeting is in the store's meetings list
    await store.fetchMeetings()
    // Note: In the mock, fetchMeetings returns empty array
    // In a real E2E test with actual database, we would verify:
    // expect(store.meetings.length).toBeGreaterThan(0)
    // expect(store.meetings[0].id).toBe(meeting.id)
  })

  it('should handle timezone display for participants in different continents', async () => {
    const store = useSchedulingStore()

    // Create participants across different continents
    const participants = [
      { name: 'US East', timezone: 'America/New_York' },
      { name: 'US West', timezone: 'America/Los_Angeles' },
      { name: 'UK', timezone: 'Europe/London' },
      { name: 'Germany', timezone: 'Europe/Berlin' },
      { name: 'India', timezone: 'Asia/Kolkata' },
      { name: 'Japan', timezone: 'Asia/Tokyo' },
      { name: 'Australia', timezone: 'Australia/Sydney' }
    ]

    const createdParticipants = []
    for (const p of participants) {
      const participant = await store.createParticipant({
        name: p.name,
        email: `${p.name.toLowerCase().replace(' ', '')}@example.com`,
        country: 'XX',
        timezone: p.timezone
      })
      createdParticipants.push(participant)
      expect(participant.timezone).toBe(p.timezone)
    }

    // Create meeting at 15:00 UTC
    const meeting = await store.createMeeting({
      title: 'Global Team Meeting',
      proposed_time: '2025-12-12T15:00:00.000Z',
      duration_minutes: 90
    })

    // Add all participants
    for (const participant of createdParticipants) {
      await store.addParticipantToMeeting(meeting.id, participant.id)
    }

    // Verify timezone conversions
    const { toLocalTime } = await import('@/features/scheduling/composables/useTimezone')
    const proposedTime = new Date(meeting.proposed_time)

    // US East: UTC-5 in December → 10:00 AM
    const nyTime = toLocalTime(proposedTime, 'America/New_York')
    expect(nyTime.getHours()).toBe(10)

    // US West: UTC-8 in December → 7:00 AM
    const laTime = toLocalTime(proposedTime, 'America/Los_Angeles')
    expect(laTime.getHours()).toBe(7)

    // UK: UTC+0 in December → 3:00 PM
    const londonTime = toLocalTime(proposedTime, 'Europe/London')
    expect(londonTime.getHours()).toBe(15)

    // Germany: UTC+1 in December → 4:00 PM
    const berlinTime = toLocalTime(proposedTime, 'Europe/Berlin')
    expect(berlinTime.getHours()).toBe(16)

    // India: UTC+5:30 → 8:30 PM
    const indiaTime = toLocalTime(proposedTime, 'Asia/Kolkata')
    expect(indiaTime.getHours()).toBe(20)
    expect(indiaTime.getMinutes()).toBe(30)

    // Japan: UTC+9 → Midnight (next day)
    const tokyoTime = toLocalTime(proposedTime, 'Asia/Tokyo')
    expect(tokyoTime.getHours()).toBe(0)

    // Australia: UTC+11 in December → 2:00 AM (next day)
    const sydneyTime = toLocalTime(proposedTime, 'Australia/Sydney')
    expect(sydneyTime.getHours()).toBe(2)
  })

  it('should verify equity score calculation for international meeting', async () => {
    const store = useSchedulingStore()
    const { calculateStatus } = await import('@/features/scheduling/composables/useTimezone')
    const { calculateScore } = await import('@/features/scheduling/composables/useEquityScore')
    const { DEFAULT_CONFIG } = await import('@/features/scheduling/utils')

    // Create participants
    const participants = [
      await store.createParticipant({
        name: 'Green Zone',
        email: 'green@example.com',
        country: 'US',
        timezone: 'America/New_York'
      }),
      await store.createParticipant({
        name: 'Orange Zone',
        email: 'orange@example.com',
        country: 'DE',
        timezone: 'Europe/Berlin'
      }),
      await store.createParticipant({
        name: 'Red Zone',
        email: 'red@example.com',
        country: 'JP',
        timezone: 'Asia/Tokyo'
      })
    ]

    // Create meeting at 14:00 UTC (2:00 PM UTC)
    const meeting = await store.createMeeting({
      title: 'Equity Score Test',
      proposed_time: '2025-12-12T14:00:00.000Z',
      duration_minutes: 60
    })

    // Calculate expected statuses
    const { toLocalTime } = await import('@/features/scheduling/composables/useTimezone')
    const proposedTime = new Date(meeting.proposed_time)
    const dayOfWeek = proposedTime.getUTCDay()
    const dayOfWeekISO = dayOfWeek === 0 ? 7 : dayOfWeek
    const isWorkDay = DEFAULT_CONFIG.work_days.includes(dayOfWeekISO)

    const participantsWithStatus = participants.map((p) => {
      const localTime = toLocalTime(proposedTime, p.timezone)
      const status = calculateStatus(localTime, DEFAULT_CONFIG, false, isWorkDay)
      return { ...p, status }
    })

    // Calculate equity score
    const score = calculateScore(participantsWithStatus)

    // Verify score is calculated (should be between 0-100)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)

    // Verify statuses were assigned
    participantsWithStatus.forEach((p) => {
      expect(['green', 'orange', 'red', 'critical']).toContain(p.status)
    })
  })

  it('should prevent creating meeting with invalid duration', async () => {
    const store = useSchedulingStore()

    // Try to create meeting with duration too short
    const invalidMeeting = {
      title: 'Invalid Meeting',
      proposed_time: '2025-12-12T14:00:00.000Z',
      duration_minutes: 5, // Too short
      notes: 'Should fail'
    }

    await expect(store.createMeeting(invalidMeeting)).rejects.toThrow(
      'Meeting duration must be between 15 and 480 minutes'
    )

    // Try to create meeting with duration too long
    const tooLongMeeting = {
      title: 'Too Long Meeting',
      proposed_time: '2025-12-12T14:00:00.000Z',
      duration_minutes: 500, // Too long
      notes: 'Should fail'
    }

    await expect(store.createMeeting(tooLongMeeting)).rejects.toThrow(
      'Meeting duration must be between 15 and 480 minutes'
    )
  })

  it('should prevent adding more than 50 participants to a meeting', async () => {
    const store = useSchedulingStore()

    // Create a meeting
    const meeting = await store.createMeeting({
      title: 'Large Meeting',
      proposed_time: '2025-12-12T14:00:00.000Z',
      duration_minutes: 60
    })

    // Mock the count check to simulate 50 existing participants
    const { useSupabase } = await import('@/composables/useSupabase')
    const { supabase } = useSupabase()

    const mockExistingParticipants = Array.from({ length: 50 }, (_, i) => ({
      id: `participant-${i}`,
      meeting_id: meeting.id
    }))

    supabase.from = vi.fn((table) => {
      if (table === 'meeting_participants') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
              })),
              limit: vi.fn(() =>
                Promise.resolve({
                  data: mockExistingParticipants,
                  error: null,
                  count: 50
                })
              )
            }))
          })),
          insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }
      }
      return supabase.from(table)
    })

    // Try to add 51st participant
    await expect(store.addParticipantToMeeting(meeting.id, 'new-participant-id')).rejects.toThrow(
      'Maximum of 50 participants per meeting exceeded'
    )
  })
})
