import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSchedulingStore } from '../store'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'

// Mock dependencies
vi.mock('@/composables/useSupabase')
vi.mock('@/stores/auth')

// Mock global fetch for holiday API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Scheduling Store', () => {
  let mockSupabaseClient
  let mockChain
  let mockAuthStore
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Mock Supabase client with proper method chaining
    // Create a thenable mock that can be both chained and awaited
    const defaultResponse = { data: null, error: null }

    mockChain = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      // Make the chain itself thenable so it can be awaited
      then: vi.fn((resolve) => Promise.resolve(defaultResponse).then(resolve)),
      catch: vi.fn((reject) => Promise.resolve(defaultResponse).catch(reject))
    }

    // Make all methods return the chain object for chaining
    mockChain.select.mockReturnValue(mockChain)
    mockChain.insert.mockReturnValue(mockChain)
    mockChain.update.mockReturnValue(mockChain)
    mockChain.delete.mockReturnValue(mockChain)
    mockChain.eq.mockReturnValue(mockChain)
    mockChain.order.mockReturnValue(mockChain)

    // Terminal methods also return promises (but for single/maybeSingle, they're truly terminal)
    mockChain.single.mockResolvedValue(defaultResponse)
    mockChain.maybeSingle.mockResolvedValue(defaultResponse)

    mockSupabaseClient = {
      from: vi.fn().mockReturnValue(mockChain)
    }

    vi.mocked(useSupabase).mockReturnValue({ supabase: mockSupabaseClient })

    // Mock auth store
    mockAuthStore = {
      user: { id: 'test-user-id' }
    }
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)

    store = useSchedulingStore()
  })

  // --- Helper Functions Tests ---
  describe('Helper Functions', () => {
    it('should exist and be accessible', () => {
      // These are internal helper functions, tested indirectly through store actions
      expect(store).toBeDefined()
    })
  })

  // --- Participant CRUD Tests ---
  describe('Participant Management', () => {
    describe('createParticipant', () => {
      it('should create a new participant successfully', async () => {
        const newParticipant = {
          name: 'John Doe',
          country_code: 'US',
          timezone: 'America/New_York',
          notes: 'Test notes'
        }

        const createdParticipant = {
          id: 'participant-1',
          user_id: 'test-user-id',
          ...newParticipant,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        mockChain.single.mockResolvedValue({
          data: createdParticipant,
          error: null
        })

        const result = await store.createParticipant(newParticipant)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('participants')
        expect(mockChain.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'test-user-id',
            name: newParticipant.name,
            timezone: newParticipant.timezone,
            country_code: newParticipant.country_code,
            notes: newParticipant.notes
          })
        )
        expect(result).toEqual(createdParticipant)
      })

      it('should throw error when creation fails', async () => {
        const newParticipant = {
          name: 'John Doe',
          country_code: 'US',
          timezone: 'America/New_York'
        }

        mockChain.single.mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })

        await expect(store.createParticipant(newParticipant)).rejects.toThrow('Database error')
      })
    })

    describe('fetchParticipants', () => {
      it('should fetch all participants for current user', async () => {
        const participants = [
          { id: '1', name: 'John', country_code: 'US', timezone: 'America/New_York' },
          { id: '2', name: 'Jane', country_code: 'GB', timezone: 'Europe/London' }
        ]

        mockChain.order.mockResolvedValue({
          data: participants,
          error: null
        })

        await store.fetchParticipants()

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('participants')
        expect(mockChain.select).toHaveBeenCalledWith('*')
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
        expect(store.participants).toEqual(participants)
      })

      it('should handle fetch errors', async () => {
        mockChain.order.mockResolvedValue({
          data: null,
          error: { message: 'Fetch error' }
        })

        await expect(store.fetchParticipants()).rejects.toThrow('Fetch error')
      })
    })

    describe('updateParticipant', () => {
      it('should update a participant successfully', async () => {
        const participantId = 'participant-1'
        const updates = {
          name: 'Updated Name',
          timezone: 'America/Chicago'
        }

        const updatedParticipant = {
          id: participantId,
          ...updates,
          updated_at: new Date().toISOString()
        }

        mockChain.single.mockResolvedValue({
          data: updatedParticipant,
          error: null
        })

        const result = await store.updateParticipant(participantId, updates)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('participants')
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining(updates))
        expect(mockChain.eq).toHaveBeenCalledWith('id', participantId)
        expect(result).toEqual(updatedParticipant)
      })

      it('should throw error when update fails', async () => {
        mockChain.single.mockResolvedValue({
          data: null,
          error: { message: 'Update error' }
        })

        await expect(store.updateParticipant('1', { name: 'New' })).rejects.toThrow('Update error')
      })
    })

    describe('deleteParticipant', () => {
      it('should delete a participant successfully', async () => {
        const participantId = 'participant-1'

        mockChain.then.mockImplementation((resolve) =>
          Promise.resolve({ data: null, error: null }).then(resolve)
        )

        await store.deleteParticipant(participantId)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('participants')
        expect(mockChain.delete).toHaveBeenCalled()
        expect(mockChain.eq).toHaveBeenCalledWith('id', participantId)
      })

      it('should throw error when deletion fails', async () => {
        mockChain.then.mockImplementation((resolve) =>
          Promise.resolve({ data: null, error: { message: 'Delete error' } }).then(resolve)
        )

        await expect(store.deleteParticipant('1')).rejects.toThrow('Delete error')
      })
    })
  })

  // --- Meeting CRUD Tests ---
  describe('Meeting Management', () => {
    describe('createMeeting', () => {
      it('should create a new meeting successfully', async () => {
        const newMeeting = {
          title: 'Team Meeting',
          proposed_time: '2025-12-25T10:00:00Z',
          duration_minutes: 60
        }

        const createdMeeting = {
          id: 'meeting-1',
          user_id: 'test-user-id',
          ...newMeeting,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        mockChain.single.mockResolvedValueOnce({
          data: createdMeeting,
          error: null
        })

        const result = await store.createMeeting(newMeeting)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('meetings')
        expect(mockChain.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'test-user-id',
            ...newMeeting
          })
        )
        expect(result).toEqual(createdMeeting)
      })

      it('should throw error when creation fails', async () => {
        mockChain.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Creation error' }
        })

        await expect(store.createMeeting({})).rejects.toThrow('Creation error')
      })
    })

    describe('fetchMeeting', () => {
      it('should fetch a single meeting with participants', async () => {
        const meetingId = 'meeting-1'
        const meeting = {
          id: meetingId,
          title: 'Team Meeting',
          proposed_time: new Date().toISOString()
        }
        const meetingParticipants = [
          {
            participant_id: '1',
            participants: {
              id: '1',
              name: 'John',
              country_code: 'US',
              timezone: 'America/New_York'
            }
          }
        ]

        // Mock first call: fetch meeting
        mockChain.single.mockResolvedValueOnce({
          data: meeting,
          error: null
        })

        // Mock second call: fetch meeting_participants - need to return data directly
        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: meetingParticipants, error: null }).then(resolve)
        )

        const result = await store.fetchMeeting(meetingId)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('meetings')
        expect(result.participants).toEqual([meetingParticipants[0].participants])
      })

      it('should throw error when fetch fails', async () => {
        mockChain.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Fetch error' }
        })

        await expect(store.fetchMeeting('1')).rejects.toThrow('Fetch error')
      })
    })

    describe('fetchMeetings', () => {
      it('should fetch all meetings for current user', async () => {
        const meetings = [
          { id: '1', title: 'Meeting 1', meeting_participants: [] },
          { id: '2', title: 'Meeting 2', meeting_participants: [] }
        ]

        mockChain.order.mockResolvedValueOnce({
          data: meetings,
          error: null
        })

        await store.fetchMeetings()

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('meetings')
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
        expect(store.meetings).toEqual([
          {
            id: '1',
            title: 'Meeting 1',
            meeting_participants: [],
            participants: [],
            participant_count: 0
          },
          {
            id: '2',
            title: 'Meeting 2',
            meeting_participants: [],
            participants: [],
            participant_count: 0
          }
        ])
      })

      it('should handle fetch errors', async () => {
        mockChain.order.mockResolvedValueOnce({
          data: null,
          error: { message: 'Fetch error' }
        })

        await expect(store.fetchMeetings()).rejects.toThrow('Fetch error')
      })
    })

    describe('updateMeeting', () => {
      it('should update a meeting successfully', async () => {
        const meetingId = 'meeting-1'
        const updates = { title: 'Updated Meeting' }

        const updatedMeeting = {
          id: meetingId,
          ...updates,
          updated_at: new Date().toISOString()
        }

        mockChain.single.mockResolvedValueOnce({
          data: updatedMeeting,
          error: null
        })

        const result = await store.updateMeeting(meetingId, updates)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('meetings')
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining(updates))
        expect(result).toEqual(updatedMeeting)
      })

      it('should throw error when update fails', async () => {
        mockChain.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Update error' }
        })

        await expect(store.updateMeeting('1', {})).rejects.toThrow('Update error')
      })
    })

    describe('deleteMeeting', () => {
      it('should delete a meeting successfully', async () => {
        const meetingId = 'meeting-1'

        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: null }).then(resolve)
        )

        await store.deleteMeeting(meetingId)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('meetings')
        expect(mockChain.delete).toHaveBeenCalled()
        expect(mockChain.eq).toHaveBeenCalledWith('id', meetingId)
      })

      it('should throw error when deletion fails', async () => {
        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: { message: 'Delete error' } }).then(resolve)
        )

        await expect(store.deleteMeeting('1')).rejects.toThrow('Delete error')
      })
    })
  })

  // --- Meeting Participants Tests ---
  describe('Meeting Participants', () => {
    describe('addParticipantToMeeting', () => {
      it('should add a participant to a meeting successfully', async () => {
        const meetingId = 'meeting-1'
        const participantId = 'participant-1'

        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: null }).then(resolve)
        )

        await store.addParticipantToMeeting(meetingId, participantId)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('meeting_participants')
        expect(mockChain.insert).toHaveBeenCalledWith({
          meeting_id: meetingId,
          participant_id: participantId
        })
      })

      it('should throw error when adding fails', async () => {
        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: { message: 'Insert error' } }).then(resolve)
        )

        await expect(store.addParticipantToMeeting('1', '2')).rejects.toThrow('Insert error')
      })
    })

    describe('removeParticipantFromMeeting', () => {
      it('should remove a participant from a meeting successfully', async () => {
        const meetingId = 'meeting-1'
        const participantId = 'participant-1'

        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: null }).then(resolve)
        )

        await store.removeParticipantFromMeeting(meetingId, participantId)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('meeting_participants')
        expect(mockChain.delete).toHaveBeenCalled()
      })

      it('should throw error when removal fails', async () => {
        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: { message: 'Delete error' } }).then(resolve)
        )

        await expect(store.removeParticipantFromMeeting('1', '2')).rejects.toThrow('Delete error')
      })
    })
  })

  // --- Country Configuration Tests ---
  describe('Country Configuration', () => {
    describe('getCountryConfig', () => {
      it('should return custom config when it exists in store', () => {
        const customConfig = {
          country_code: 'US',
          green_start: '08:00',
          green_end: '16:00',
          orange_start_morning: '07:00',
          orange_end_morning: '08:00',
          orange_start_evening: '16:00',
          orange_end_evening: '17:00',
          work_week_pattern: 'MWF'
        }

        // Set custom config in store
        store.countryConfigurations = [customConfig]

        const result = store.getCountryConfig('US')

        expect(result).toEqual({
          green_start: '08:00',
          green_end: '16:00',
          orange_morning_start: '07:00',
          orange_morning_end: '08:00',
          orange_evening_start: '16:00',
          orange_evening_end: '17:00',
          work_days: [1, 3, 5]
        })
      })

      it('should return default config when no custom config exists', () => {
        // Ensure no custom configs in store
        store.countryConfigurations = []

        const result = store.getCountryConfig('US')

        expect(result).toEqual(
          expect.objectContaining({
            green_start: '09:00',
            green_end: '17:00',
            work_days: [1, 2, 3, 4, 5]
          })
        )
      })

      it('should return default config when country code is empty', () => {
        const result = store.getCountryConfig('')

        expect(result).toEqual(
          expect.objectContaining({
            green_start: '09:00',
            green_end: '17:00',
            work_days: [1, 2, 3, 4, 5]
          })
        )
      })
    })

    describe('fetchCountryConfigurations', () => {
      it('should fetch all country configurations for current user', async () => {
        const configs = [
          { id: '1', country_code: 'US', work_days_pattern: 'MTWTF' },
          { id: '2', country_code: 'GB', work_days_pattern: 'MTWTF' }
        ]

        mockChain.order.mockResolvedValueOnce({
          data: configs,
          error: null
        })

        await store.fetchCountryConfigurations()

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('country_configurations')
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
        expect(store.countryConfigurations).toHaveLength(2)
      })

      it('should handle fetch errors', async () => {
        mockChain.order.mockResolvedValueOnce({
          data: null,
          error: { message: 'Fetch error' }
        })

        await expect(store.fetchCountryConfigurations()).rejects.toThrow('Fetch error')
      })
    })

    describe('createCountryConfiguration', () => {
      it('should create a new country configuration successfully', async () => {
        const newConfig = {
          country_code: 'US',
          green_start: '09:00',
          green_end: '17:00',
          orange_morning_start: '08:00',
          orange_morning_end: '09:00',
          orange_evening_start: '17:00',
          orange_evening_end: '18:00',
          work_days: [1, 2, 3, 4, 5]
        }

        const createdConfig = {
          id: 'config-1',
          user_id: 'test-user-id',
          country_code: 'US',
          green_start: '09:00',
          green_end: '17:00',
          orange_start_morning: '08:00',
          orange_end_morning: '09:00',
          orange_start_evening: '17:00',
          orange_end_evening: '18:00',
          work_week_pattern: 'MTWTF'
        }

        mockChain.single.mockResolvedValueOnce({
          data: createdConfig,
          error: null
        })

        const result = await store.createCountryConfiguration(newConfig)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('country_configurations')
        expect(mockChain.insert).toHaveBeenCalled()
        expect(result).toBeDefined()
        expect(result.country_code).toBe('US')
      })

      it('should throw error when creation fails', async () => {
        mockChain.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Creation error' }
        })

        await expect(store.createCountryConfiguration({})).rejects.toThrow('Creation error')
      })
    })

    describe('updateCountryConfiguration', () => {
      it('should update a country configuration successfully', async () => {
        const configId = 'config-1'
        const updates = {
          green_start: '08:00',
          work_days: [1, 2, 3, 4, 5, 6]
        }

        const updatedConfig = {
          id: configId,
          ...updates,
          work_days_pattern: 'MTWTFS'
        }

        mockChain.single.mockResolvedValueOnce({
          data: updatedConfig,
          error: null
        })

        const result = await store.updateCountryConfiguration(configId, updates)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('country_configurations')
        expect(mockChain.update).toHaveBeenCalled()
        expect(result).toBeDefined()
      })

      it('should throw error when update fails', async () => {
        mockChain.single.mockResolvedValueOnce({
          data: null,
          error: { message: 'Update error' }
        })

        await expect(store.updateCountryConfiguration('1', {})).rejects.toThrow('Update error')
      })
    })

    describe('deleteCountryConfiguration', () => {
      it('should delete a country configuration successfully', async () => {
        const configId = 'config-1'

        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: null }).then(resolve)
        )

        await store.deleteCountryConfiguration(configId)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('country_configurations')
        expect(mockChain.delete).toHaveBeenCalled()
        expect(mockChain.eq).toHaveBeenCalledWith('id', configId)
      })

      it('should throw error when deletion fails', async () => {
        mockChain.then.mockImplementationOnce((resolve) =>
          Promise.resolve({ data: null, error: { message: 'Delete error' } }).then(resolve)
        )

        await expect(store.deleteCountryConfiguration('1')).rejects.toThrow('Delete error')
      })
    })
  })

  // --- State Management Tests ---
  describe('State Management', () => {
    it('should initialize with default state', () => {
      expect(store.participants).toEqual([])
      expect(store.meetings).toEqual([])
      expect(store.currentMeeting).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should update loading state', () => {
      store.loading = true
      expect(store.loading).toBe(true)
    })

    it('should update isDirty state', () => {
      store.isDirty = true
      expect(store.isDirty).toBe(true)
    })

    it('should set current meeting', () => {
      const meeting = { id: '1', title: 'Test Meeting' }
      store.currentMeeting = meeting
      expect(store.currentMeeting).toEqual(meeting)
    })
  })

  // --- Computed Properties Tests ---
  describe('Computed Properties', () => {
    it('should have participantsWithStatus computed property', () => {
      expect(store.participantsWithStatus).toBeDefined()
      expect(Array.isArray(store.participantsWithStatus)).toBe(true)
    })

    it('should have equityScore computed property', () => {
      expect(store.equityScore).toBeDefined()
    })

    it('should have heatmapData computed property', () => {
      expect(store.heatmapData).toBeDefined()
      expect(Array.isArray(store.heatmapData)).toBe(true)
    })
  })
})
