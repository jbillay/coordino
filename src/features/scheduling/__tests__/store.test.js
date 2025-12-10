import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSchedulingStore } from '../store'
import { useAuthStore } from '@/stores/auth'

// Create a mock supabase client that will be reconfigured in tests
const mockSupabaseClient = {
  from: vi.fn()
}

// Mock modules
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: mockSupabaseClient
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

vi.mock('../utils/timezoneConverter', () => ({
  convertToTimezone: vi.fn((date) => new Date(date)),
  formatLocalTime: vi.fn((date) => date.toISOString())
}))

vi.mock('../utils/equityScorer', () => ({
  calculateEquityScore: vi.fn((statuses) => ({
    score: 75,
    green_count: statuses.filter((s) => s.status === 'green').length,
    orange_count: statuses.filter((s) => s.status === 'orange').length,
    red_count: statuses.filter((s) => s.status === 'red').length,
    critical_count: statuses.filter((s) => s.is_critical).length,
    total_points: 150,
    max_possible: 200
  }))
}))

vi.mock('../utils/workingHoursValidator', () => ({
  determineColorStatus: vi.fn(() => ({
    status: 'green',
    is_critical: false,
    reason: 'Within working hours'
  }))
}))

vi.mock('../utils/holidayService', () => ({
  fetchHolidays: vi.fn(() => Promise.resolve([])),
  isHoliday: vi.fn(() => null)
}))

describe('Scheduling Store', () => {
  let store
  let mockAuthStore

  beforeEach(() => {
    // Create fresh pinia instance
    const pinia = createPinia()
    setActivePinia(pinia)

    // Setup mock auth store
    mockAuthStore = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    }
    useAuthStore.mockReturnValue(mockAuthStore)

    // Clear the mock supabase client
    mockSupabaseClient.from.mockClear()

    // Get store instance
    store = useSchedulingStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      expect(store.meetings).toEqual([])
      expect(store.currentMeeting).toBeNull()
      expect(store.isDirty).toBe(false)
      expect(store.participants).toEqual([])
      expect(store.availableParticipants).toEqual([])
      expect(store.countryConfigs).toEqual([])
      expect(store.defaultConfigs).toEqual([])
      expect(store.customConfigs).toEqual([])
      expect(store.equityScore).toBeNull()
      expect(store.participantStatuses).toEqual([])
      expect(store.optimalTimeSlots).toEqual([])
      expect(store.heatmapData).toEqual([])
      expect(store.holidayCache).toBeInstanceOf(Map)
      expect(store.loading).toBe(false)
      expect(store.loadingMeetings).toBe(false)
      expect(store.loadingSuggestions).toBe(false)
      expect(store.savingMeeting).toBe(false)
      expect(store.error).toBeNull()
      expect(store.searchQuery).toBe('')
      expect(store.filterDate).toBeNull()
    })
  })

  describe('Getters', () => {
    describe('filteredMeetings', () => {
      beforeEach(() => {
        store.meetings = [
          {
            id: 'm1',
            title: 'Team Standup',
            proposed_time: '2024-01-15T10:00:00Z',
            participants: [{ name: 'John Doe' }]
          },
          {
            id: 'm2',
            title: 'Client Review',
            proposed_time: '2024-01-16T14:00:00Z',
            participants: [{ name: 'Jane Smith' }]
          },
          {
            id: 'm3',
            title: 'Planning Session',
            proposed_time: '2024-01-15T16:00:00Z',
            participants: [{ name: 'Bob Johnson' }]
          }
        ]
      })

      it('should return all meetings when no filters applied', () => {
        expect(store.filteredMeetings).toHaveLength(3)
      })

      it('should filter meetings by search query (title)', () => {
        store.searchQuery = 'standup'
        const filtered = store.filteredMeetings
        expect(filtered).toHaveLength(1)
        expect(filtered[0].id).toBe('m1')
      })

      it('should filter meetings by search query (participant name)', () => {
        store.searchQuery = 'jane'
        const filtered = store.filteredMeetings
        expect(filtered).toHaveLength(1)
        expect(filtered[0].id).toBe('m2')
      })

      it('should filter meetings by date', () => {
        store.filterDate = '2024-01-15'
        const filtered = store.filteredMeetings
        expect(filtered).toHaveLength(2)
        expect(filtered.map((m) => m.id)).toEqual(['m1', 'm3'])
      })

      it('should apply both search and date filters', () => {
        store.searchQuery = 'team'
        store.filterDate = '2024-01-15'
        const filtered = store.filteredMeetings
        expect(filtered).toHaveLength(1)
        expect(filtered[0].id).toBe('m1')
      })

      it('should handle search query case-insensitively', () => {
        store.searchQuery = 'TEAM'
        expect(store.filteredMeetings).toHaveLength(1)
      })
    })

    describe('currentEquityScore', () => {
      it('should return null when no participant statuses', () => {
        store.participantStatuses = []
        expect(store.currentEquityScore).toBeNull()
      })

      it('should calculate equity score from participant statuses', () => {
        store.participantStatuses = [
          { status: 'green', is_critical: false },
          { status: 'green', is_critical: false },
          { status: 'orange', is_critical: false }
        ]
        const score = store.currentEquityScore
        expect(score).toBeDefined()
        expect(score.score).toBe(75)
        expect(score.green_count).toBe(2)
        expect(score.orange_count).toBe(1)
      })
    })

    describe('hasUnsavedChanges', () => {
      it('should return false initially', () => {
        expect(store.hasUnsavedChanges).toBe(false)
      })

      it('should return true when dirty flag is set', () => {
        store.isDirty = true
        expect(store.hasUnsavedChanges).toBe(true)
      })
    })

    describe('participantsByCountry', () => {
      it('should group participants by country', () => {
        store.participants = [
          { id: 'p1', name: 'John', country: 'US' },
          { id: 'p2', name: 'Jane', country: 'GB' },
          { id: 'p3', name: 'Bob', country: 'US' }
        ]
        const grouped = store.participantsByCountry
        expect(grouped.US).toHaveLength(2)
        expect(grouped.GB).toHaveLength(1)
        expect(grouped.US.map((p) => p.name)).toEqual(['John', 'Bob'])
      })

      it('should handle empty participants array', () => {
        store.participants = []
        expect(store.participantsByCountry).toEqual({})
      })
    })

    describe('getConfigForCountry', () => {
      beforeEach(() => {
        store.defaultConfigs = [
          { country_code: 'US', green_start: '09:00:00', is_default: true },
          { country_code: 'GB', green_start: '08:00:00', is_default: true }
        ]
        store.customConfigs = [{ country_code: 'US', green_start: '10:00:00', is_default: false }]
      })

      it('should return custom config when available', () => {
        const config = store.getConfigForCountry('US')
        expect(config.green_start).toBe('10:00:00')
        expect(config.is_default).toBe(false)
      })

      it('should fall back to default config when no custom exists', () => {
        const config = store.getConfigForCountry('GB')
        expect(config.green_start).toBe('08:00:00')
        expect(config.is_default).toBe(true)
      })

      it('should return null when no config exists', () => {
        const config = store.getConfigForCountry('FR')
        expect(config).toBeNull()
      })
    })
  })

  describe('Actions - Meeting Management', () => {
    describe('fetchMeetings', () => {
      it('should fetch meetings successfully', async () => {
        const mockMeetings = [
          {
            id: 'm1',
            title: 'Test Meeting',
            meeting_participants: [{ participant: { id: 'p1', name: 'John' } }]
          }
        ]

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockMeetings,
                error: null
              })
            })
          })
        })

        await store.fetchMeetings()

        expect(store.meetings).toHaveLength(1)
        expect(store.meetings[0].participants).toHaveLength(1)
        expect(store.meetings[0].participants[0].name).toBe('John')
        expect(store.loadingMeetings).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should handle fetch error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error')
              })
            })
          })
        })

        await store.fetchMeetings()

        expect(store.meetings).toEqual([])
        expect(store.error).toBe('Failed to load meetings. Please try again.')
        expect(consoleSpy).toHaveBeenCalled()

        consoleSpy.mockRestore()
      })

      it('should handle unauthenticated user', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockAuthStore.user = null

        await store.fetchMeetings()

        expect(store.error).toBe('Failed to load meetings. Please try again.')
        expect(consoleSpy).toHaveBeenCalled()

        consoleSpy.mockRestore()
      })
    })

    describe('createMeeting', () => {
      it('should create meeting successfully', async () => {
        const newMeeting = {
          title: 'New Meeting',
          proposed_time: '2024-01-15T10:00:00Z',
          notes: 'Test notes',
          participant_ids: ['p1', 'p2']
        }

        const createdMeeting = {
          id: 'm-new',
          ...newMeeting,
          user_id: 'test-user-id'
        }

        // Mock insert chain for meeting
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: createdMeeting,
                error: null
              })
            })
          })
        })

        // Mock insert chain for participants
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            error: null
          })
        })

        // Mock fetchMeetingById select chain
        mockSupabaseClient.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    ...createdMeeting,
                    meeting_participants: []
                  },
                  error: null
                })
              })
            })
          })
        })

        const result = await store.createMeeting(newMeeting)

        expect(result).toBeDefined()
        expect(store.savingMeeting).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should validate required title', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        await expect(
          store.createMeeting({ proposed_time: '2024-01-15T10:00:00Z' })
        ).rejects.toThrow('Meeting title is required')

        consoleSpy.mockRestore()
      })

      it('should validate required proposed_time', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        await expect(store.createMeeting({ title: 'Test Meeting' })).rejects.toThrow(
          'Proposed time is required'
        )

        consoleSpy.mockRestore()
      })
    })

    describe('deleteMeeting', () => {
      it('should delete meeting successfully', async () => {
        store.meetings = [
          { id: 'm1', title: 'Meeting 1' },
          { id: 'm2', title: 'Meeting 2' }
        ]

        mockSupabaseClient.from.mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          })
        })

        await store.deleteMeeting('m1')

        expect(store.meetings).toHaveLength(1)
        expect(store.meetings[0].id).toBe('m2')
        expect(store.loading).toBe(false)
      })

      it('should clear current meeting if deleted', async () => {
        store.currentMeeting = { id: 'm1', title: 'Meeting 1' }
        store.meetings = [{ id: 'm1', title: 'Meeting 1' }]

        mockSupabaseClient.from.mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          })
        })

        await store.deleteMeeting('m1')

        expect(store.currentMeeting).toBeNull()
        expect(store.isDirty).toBe(false)
      })
    })
  })

  describe('Actions - Participant Management', () => {
    describe('fetchParticipants', () => {
      it('should fetch participants successfully', async () => {
        const mockParticipants = [
          { id: 'p1', name: 'John', country: 'US', timezone: 'America/New_York' },
          { id: 'p2', name: 'Jane', country: 'GB', timezone: 'Europe/London' }
        ]

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockParticipants,
                error: null
              })
            })
          })
        })

        await store.fetchParticipants()

        expect(store.participants).toHaveLength(2)
        expect(store.availableParticipants).toHaveLength(2)
        expect(store.loading).toBe(false)
      })

      it('should handle fetch error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error')
              })
            })
          })
        })

        await store.fetchParticipants()

        expect(store.participants).toEqual([])
        expect(store.error).toBe('Failed to load participants. Please try again.')

        consoleSpy.mockRestore()
      })
    })

    describe('addParticipant', () => {
      it('should add participant successfully', async () => {
        const newParticipant = {
          name: 'John Doe',
          timezone: 'America/New_York',
          country: 'US',
          notes: 'Test notes'
        }

        const createdParticipant = {
          id: 'p-new',
          ...newParticipant,
          country: 'US',
          user_id: 'test-user-id'
        }

        mockSupabaseClient.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: createdParticipant,
                error: null
              })
            })
          })
        })

        const result = await store.addParticipant(newParticipant)

        expect(result).toEqual(createdParticipant)
        expect(store.participants).toHaveLength(1)
        expect(store.participants[0]).toEqual(createdParticipant)
        expect(store.loading).toBe(false)
      })

      it('should validate required name', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        await expect(
          store.addParticipant({ timezone: 'America/New_York', country: 'US' })
        ).rejects.toThrow('Participant name is required')

        consoleSpy.mockRestore()
      })

      it('should validate required timezone', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        await expect(store.addParticipant({ name: 'John', country: 'US' })).rejects.toThrow(
          'Timezone is required'
        )

        consoleSpy.mockRestore()
      })

      it('should handle duplicate name error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        mockSupabaseClient.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505' }
              })
            })
          })
        })

        await expect(
          store.addParticipant({
            name: 'John',
            timezone: 'America/New_York',
            country: 'US'
          })
        ).rejects.toThrow('A participant with this name already exists')

        consoleSpy.mockRestore()
      })
    })

    describe('removeParticipant', () => {
      it('should remove participant successfully', async () => {
        store.participants = [
          { id: 'p1', name: 'John' },
          { id: 'p2', name: 'Jane' }
        ]

        mockSupabaseClient.from.mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          })
        })

        await store.removeParticipant('p1')

        expect(store.participants).toHaveLength(1)
        expect(store.participants[0].id).toBe('p2')
        expect(store.availableParticipants).toHaveLength(1)
      })
    })
  })

  describe('Actions - Country Configuration', () => {
    describe('fetchCountryConfigs', () => {
      it('should fetch and categorize configs', async () => {
        const mockConfigs = [
          { id: 'c1', country_code: 'US', is_default: true },
          { id: 'c2', country_code: 'GB', is_default: true },
          { id: 'c3', country_code: 'US', is_default: false }
        ]

        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockConfigs,
              error: null
            })
          })
        })

        await store.fetchCountryConfigs()

        expect(store.countryConfigs).toHaveLength(3)
        expect(store.defaultConfigs).toHaveLength(2)
        expect(store.customConfigs).toHaveLength(1)
        expect(store.loading).toBe(false)
      })
    })
  })

  describe('Actions - Equity Scoring', () => {
    describe('calculateParticipantStatuses', () => {
      it('should calculate statuses for all participants', async () => {
        store.defaultConfigs = [
          {
            country_code: 'US',
            green_start: '09:00:00',
            green_end: '17:00:00'
          }
        ]

        const participants = [
          { id: 'p1', name: 'John', country: 'US', timezone: 'America/New_York' }
        ]

        const proposedTime = new Date('2024-01-15T14:00:00Z')

        const statuses = await store.calculateParticipantStatuses(participants, proposedTime)

        expect(statuses).toHaveLength(1)
        expect(statuses[0].participant_id).toBe('p1')
        expect(statuses[0].participant_name).toBe('John')
        expect(statuses[0].status).toBe('green')
      })

      it('should skip participants without config', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const participants = [
          { id: 'p1', name: 'John', country: 'XX', timezone: 'America/New_York' }
        ]

        const proposedTime = new Date('2024-01-15T14:00:00Z')

        const statuses = await store.calculateParticipantStatuses(participants, proposedTime)

        expect(statuses).toHaveLength(0)
        expect(consoleSpy).toHaveBeenCalledWith('No config found for country: XX')

        consoleSpy.mockRestore()
      })
    })

    describe('generateOptimalTimeSlots', () => {
      it('should generate time slots for a full day', async () => {
        store.currentMeeting = {
          participants: [{ id: 'p1', name: 'John', country: 'US', timezone: 'America/New_York' }]
        }

        store.defaultConfigs = [
          {
            country_code: 'US',
            green_start: '09:00:00',
            green_end: '17:00:00'
          }
        ]

        const testDate = new Date('2024-01-15T00:00:00Z')

        await store.generateOptimalTimeSlots(testDate)

        expect(store.heatmapData).toHaveLength(24)
        expect(store.optimalTimeSlots).toHaveLength(3)
        expect(store.loadingSuggestions).toBe(false)
      })

      it('should handle empty participants', async () => {
        store.currentMeeting = { participants: [] }

        const testDate = new Date('2024-01-15T00:00:00Z')

        await store.generateOptimalTimeSlots(testDate)

        expect(store.heatmapData).toEqual([])
        expect(store.optimalTimeSlots).toEqual([])
      })
    })
  })

  describe('Actions - Utility', () => {
    describe('setCurrentMeeting', () => {
      it('should set current meeting and clear dirty flag', () => {
        const meeting = { id: 'm1', title: 'Test' }
        store.isDirty = true

        store.setCurrentMeeting(meeting)

        expect(store.currentMeeting).toEqual(meeting)
        expect(store.isDirty).toBe(false)
      })
    })

    describe('markDirty', () => {
      it('should set dirty flag to true', () => {
        store.isDirty = false

        store.markDirty()

        expect(store.isDirty).toBe(true)
      })
    })

    describe('clearError', () => {
      it('should clear error message', () => {
        store.error = 'Some error'

        store.clearError()

        expect(store.error).toBeNull()
      })
    })

    describe('setSearchQuery', () => {
      it('should update search query', () => {
        store.setSearchQuery('test query')

        expect(store.searchQuery).toBe('test query')
      })
    })

    describe('$reset', () => {
      it('should reset all state to initial values', () => {
        // Modify state
        store.meetings = [{ id: 'm1' }]
        store.participants = [{ id: 'p1' }]
        store.loading = true
        store.error = 'Some error'
        store.searchQuery = 'test'

        store.$reset()

        expect(store.meetings).toEqual([])
        expect(store.participants).toEqual([])
        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
        expect(store.searchQuery).toBe('')
      })
    })
  })

  describe('Holiday Management', () => {
    describe('getHolidaysForCountry', () => {
      it('should fetch and cache holidays', async () => {
        const mockHolidays = [{ date: '2024-12-25', name: 'Christmas' }]

        const { fetchHolidays } = await import('../utils/holidayService')
        fetchHolidays.mockResolvedValue(mockHolidays)

        const holidays = await store.getHolidaysForCountry('US', 2024)

        expect(holidays).toEqual(mockHolidays)
        expect(store.holidayCache.has('US_2024')).toBe(true)
      })

      it('should return cached holidays on subsequent calls', async () => {
        const mockHolidays = [{ date: '2024-12-25', name: 'Christmas' }]

        store.holidayCache.set('US_2024', mockHolidays)

        const { fetchHolidays } = await import('../utils/holidayService')
        fetchHolidays.mockClear()

        const holidays = await store.getHolidaysForCountry('US', 2024)

        expect(holidays).toEqual(mockHolidays)
        expect(fetchHolidays).not.toHaveBeenCalled()
      })
    })
  })
})
