/**
 * Scheduling Assistant Pinia Store
 * Manages state for meetings, participants, country configurations, and equity scoring
 */

import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { convertToTimezone, formatLocalTime } from './utils/timezoneConverter'
import { calculateEquityScore } from './utils/equityScorer'
import { determineColorStatus } from './utils/workingHoursValidator'
import { fetchHolidays, isHoliday } from './utils/holidayService'

export const useSchedulingStore = defineStore('scheduling', {
  state: () => ({
    // Meeting Management
    meetings: [],
    currentMeeting: null,
    isDirty: false,

    // Participant Management
    participants: [],
    availableParticipants: [],

    // Country Configurations
    countryConfigs: [],
    defaultConfigs: [],
    customConfigs: [],

    // Equity Scoring
    equityScore: null,
    participantStatuses: [],
    optimalTimeSlots: [],
    heatmapData: [],

    // Holiday Data
    holidayCache: new Map(),

    // UI State
    loading: false,
    loadingMeetings: false,
    loadingSuggestions: false,
    savingMeeting: false,
    error: null,

    // Search/Filter State
    searchQuery: '',
    filterDate: null
  }),

  getters: {
    /**
     * Filtered meetings based on search query and date filter
     */
    filteredMeetings(state) {
      let filtered = [...state.meetings]

      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter((meeting) => {
          const titleMatch = meeting.title?.toLowerCase().includes(query)
          const participantMatch = meeting.participants?.some((p) =>
            p.name.toLowerCase().includes(query)
          )
          return titleMatch || participantMatch
        })
      }

      // Apply date filter
      if (state.filterDate) {
        filtered = filtered.filter((meeting) => {
          const meetingDate = new Date(meeting.proposed_time)
          const filterDate = new Date(state.filterDate)
          return (
            meetingDate.getFullYear() === filterDate.getFullYear() &&
            meetingDate.getMonth() === filterDate.getMonth() &&
            meetingDate.getDate() === filterDate.getDate()
          )
        })
      }

      return filtered
    },

    /**
     * Current equity score breakdown
     */
    currentEquityScore(state) {
      if (!state.participantStatuses || state.participantStatuses.length === 0) {
        return null
      }

      return calculateEquityScore(state.participantStatuses)
    },

    /**
     * Check if current meeting has unsaved changes
     */
    hasUnsavedChanges(state) {
      return state.isDirty
    },

    /**
     * Participants grouped by country
     */
    participantsByCountry(state) {
      const grouped = {}
      state.participants.forEach((p) => {
        if (!grouped[p.country]) {
          grouped[p.country] = []
        }
        grouped[p.country].push(p)
      })
      return grouped
    },

    /**
     * Get config for country (custom takes precedence over default)
     */
    getConfigForCountry: (state) => (countryCode) => {
      // Try custom config first
      const custom = state.customConfigs.find((c) => c.country_code === countryCode)
      if (custom) {
        return custom
      }

      // Fall back to default
      const defaultConfig = state.defaultConfigs.find((c) => c.country_code === countryCode)
      return defaultConfig || null
    }
  },

  actions: {
    // ========================================================================
    // MEETING MANAGEMENT
    // ========================================================================

    /**
     * Fetch all meetings for current user
     */
    async fetchMeetings() {
      this.loadingMeetings = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()
        const authStore = useAuthStore()

        if (!authStore.user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('meetings')
          .select(
            `
            *,
            meeting_participants (
              participant:participants (*)
            )
          `
          )
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        // Transform data to include participants array
        this.meetings = data.map((meeting) => ({
          ...meeting,
          participants: meeting.meeting_participants?.map((mp) => mp.participant) || []
        }))
      } catch (error) {
        console.error('Failed to fetch meetings:', error)
        this.error = 'Failed to load meetings. Please try again.'
        this.meetings = []
      } finally {
        this.loadingMeetings = false
      }
    },

    /**
     * Fetch meeting by ID with participants
     */
    async fetchMeetingById(id) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()
        const authStore = useAuthStore()

        if (!authStore.user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('meetings')
          .select(
            `
            *,
            meeting_participants (
              participant:participants (*)
            )
          `
          )
          .eq('id', id)
          .eq('user_id', authStore.user.id)
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          this.error = 'Meeting not found'
          return null
        }

        // Transform participants
        const meeting = {
          ...data,
          participants: data.meeting_participants?.map((mp) => mp.participant) || []
        }

        this.currentMeeting = meeting
        this.isDirty = false

        // Calculate equity score if we have participants
        if (meeting.participants.length > 0) {
          await this.calculateEquityForCurrent()
        }

        return meeting
      } catch (error) {
        console.error('Failed to fetch meeting:', error)
        this.error = 'Failed to load meeting. Please try again.'
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Create new meeting
     */
    async createMeeting(meetingData) {
      this.savingMeeting = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()
        const authStore = useAuthStore()

        if (!authStore.user) {
          throw new Error('User not authenticated')
        }

        // Validate input
        if (!meetingData.title || meetingData.title.trim().length === 0) {
          throw new Error('Meeting title is required')
        }

        if (!meetingData.proposed_time) {
          throw new Error('Proposed time is required')
        }

        // Insert meeting
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .insert({
            user_id: authStore.user.id,
            title: meetingData.title.trim(),
            proposed_time: meetingData.proposed_time,
            notes: meetingData.notes || null
          })
          .select()
          .single()

        if (meetingError) {
          throw meetingError
        }

        // Insert participant associations if provided
        if (meetingData.participant_ids && meetingData.participant_ids.length > 0) {
          const associations = meetingData.participant_ids.map((participantId) => ({
            meeting_id: meeting.id,
            participant_id: participantId
          }))

          const { error: junctionError } = await supabase
            .from('meeting_participants')
            .insert(associations)

          if (junctionError) {
            throw junctionError
          }
        }

        // Fetch complete meeting with participants
        const createdMeeting = await this.fetchMeetingById(meeting.id)

        // Add to meetings list
        this.meetings.unshift(createdMeeting)
        this.isDirty = false

        return createdMeeting
      } catch (error) {
        console.error('Failed to create meeting:', error)
        this.error = error.message || 'Failed to create meeting. Please try again.'
        throw error
      } finally {
        this.savingMeeting = false
      }
    },

    /**
     * Save current meeting changes
     */
    async saveMeeting() {
      if (!this.currentMeeting) {
        throw new Error('No current meeting to save')
      }

      this.savingMeeting = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        // Update meeting record
        const { error: updateError } = await supabase
          .from('meetings')
          .update({
            title: this.currentMeeting.title,
            proposed_time: this.currentMeeting.proposed_time,
            notes: this.currentMeeting.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.currentMeeting.id)

        if (updateError) {
          throw updateError
        }

        // Refresh from database to get updated timestamps
        await this.fetchMeetingById(this.currentMeeting.id)

        // Update in meetings list
        const index = this.meetings.findIndex((m) => m.id === this.currentMeeting.id)
        if (index !== -1) {
          this.meetings[index] = { ...this.currentMeeting }
        }

        this.isDirty = false
      } catch (error) {
        console.error('Failed to save meeting:', error)
        this.error = 'Failed to save meeting. Please try again.'
        throw error
      } finally {
        this.savingMeeting = false
      }
    },

    /**
     * Delete meeting by ID
     */
    async deleteMeeting(id) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        const { error } = await supabase.from('meetings').delete().eq('id', id)

        if (error) {
          throw error
        }

        // Remove from state
        this.meetings = this.meetings.filter((m) => m.id !== id)

        // Clear current meeting if deleted
        if (this.currentMeeting?.id === id) {
          this.currentMeeting = null
          this.isDirty = false
        }
      } catch (error) {
        console.error('Failed to delete meeting:', error)
        this.error = 'Failed to delete meeting. Please try again.'
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // PARTICIPANT MANAGEMENT
    // ========================================================================

    /**
     * Fetch all participants for current user
     */
    async fetchParticipants() {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()
        const authStore = useAuthStore()

        if (!authStore.user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('name')

        if (error) {
          throw error
        }

        this.participants = data || []
        this.availableParticipants = data || []
      } catch (error) {
        console.error('Failed to fetch participants:', error)
        this.error = 'Failed to load participants. Please try again.'
        this.participants = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Add new participant
     */
    async addParticipant(participantData) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()
        const authStore = useAuthStore()

        if (!authStore.user) {
          throw new Error('User not authenticated')
        }

        // Validate input
        if (!participantData.name || participantData.name.trim().length === 0) {
          throw new Error('Participant name is required')
        }

        if (!participantData.timezone) {
          throw new Error('Timezone is required')
        }

        if (!participantData.country || participantData.country.length !== 2) {
          throw new Error('Valid country code is required')
        }

        const { data, error } = await supabase
          .from('participants')
          .insert({
            user_id: authStore.user.id,
            name: participantData.name.trim(),
            timezone: participantData.timezone,
            country: participantData.country.toUpperCase(),
            notes: participantData.notes || null
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            // Unique constraint violation
            throw new Error('A participant with this name already exists')
          }
          throw error
        }

        // Add to state
        this.participants.push(data)
        this.participants.sort((a, b) => a.name.localeCompare(b.name))
        this.availableParticipants = [...this.participants]

        return data
      } catch (error) {
        console.error('Failed to add participant:', error)
        this.error = error.message || 'Failed to add participant. Please try again.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Update participant
     */
    async updateParticipant(id, updates) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        const { data, error } = await supabase
          .from('participants')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            throw new Error('A participant with this name already exists')
          }
          throw error
        }

        // Update in state
        const index = this.participants.findIndex((p) => p.id === id)
        if (index !== -1) {
          this.participants[index] = data
        }

        this.availableParticipants = [...this.participants]

        return data
      } catch (error) {
        console.error('Failed to update participant:', error)
        this.error = error.message || 'Failed to update participant. Please try again.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove participant
     */
    async removeParticipant(id) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        const { error } = await supabase.from('participants').delete().eq('id', id)

        if (error) {
          throw error
        }

        // Remove from state
        this.participants = this.participants.filter((p) => p.id !== id)
        this.availableParticipants = [...this.participants]
      } catch (error) {
        console.error('Failed to remove participant:', error)
        this.error = 'Failed to remove participant. Please try again.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Add participant to meeting
     */
    async addParticipantToMeeting(meetingId, participantId) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        const { error } = await supabase.from('meeting_participants').insert({
          meeting_id: meetingId,
          participant_id: participantId
        })

        if (error) {
          if (error.code === '23505') {
            throw new Error('Participant already added to this meeting')
          }
          throw error
        }

        // Refresh current meeting if applicable
        if (this.currentMeeting?.id === meetingId) {
          await this.fetchMeetingById(meetingId)
          await this.calculateEquityForCurrent()
        }

        this.isDirty = true
      } catch (error) {
        console.error('Failed to add participant to meeting:', error)
        this.error = error.message || 'Failed to add participant to meeting.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Remove participant from meeting
     */
    async removeParticipantFromMeeting(meetingId, participantId) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        const { error } = await supabase
          .from('meeting_participants')
          .delete()
          .eq('meeting_id', meetingId)
          .eq('participant_id', participantId)

        if (error) {
          throw error
        }

        // Refresh current meeting if applicable
        if (this.currentMeeting?.id === meetingId) {
          await this.fetchMeetingById(meetingId)
          await this.calculateEquityForCurrent()
        }

        this.isDirty = true
      } catch (error) {
        console.error('Failed to remove participant from meeting:', error)
        this.error = 'Failed to remove participant from meeting.'
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // COUNTRY CONFIGURATION MANAGEMENT
    // ========================================================================

    /**
     * Fetch all country configurations
     */
    async fetchCountryConfigs() {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        const { data, error } = await supabase
          .from('country_configurations')
          .select('*')
          .order('country_code')

        if (error) {
          throw error
        }

        this.countryConfigs = data || []
        this.defaultConfigs = data?.filter((c) => c.is_default) || []
        this.customConfigs = data?.filter((c) => !c.is_default) || []
      } catch (error) {
        console.error('Failed to fetch country configs:', error)
        this.error = 'Failed to load country configurations.'
        this.countryConfigs = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Save country config (create or update custom)
     */
    async saveCountryConfig(configData) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()
        const authStore = useAuthStore()

        if (!authStore.user) {
          throw new Error('User not authenticated')
        }

        // Check if custom config already exists
        const existing = this.customConfigs.find((c) => c.country_code === configData.country_code)

        let data
        if (existing) {
          // Update existing
          const { data: updated, error } = await supabase
            .from('country_configurations')
            .update({
              ...configData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) {
            throw error
          }
          data = updated
        } else {
          // Create new
          const { data: created, error } = await supabase
            .from('country_configurations')
            .insert({
              ...configData,
              user_id: authStore.user.id,
              is_default: false
            })
            .select()
            .single()

          if (error) {
            throw error
          }
          data = created
        }

        // Refresh configs
        await this.fetchCountryConfigs()

        return data
      } catch (error) {
        console.error('Failed to save country config:', error)
        this.error = 'Failed to save country configuration.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete country config
     */
    async deleteCountryConfig(id) {
      this.loading = true
      this.error = null

      try {
        const { useSupabase } = await import('@/composables/useSupabase')
        const { supabase } = useSupabase()

        const { error } = await supabase.from('country_configurations').delete().eq('id', id)

        if (error) {
          throw error
        }

        // Remove from state
        this.customConfigs = this.customConfigs.filter((c) => c.id !== id)
        this.countryConfigs = [...this.defaultConfigs, ...this.customConfigs]
      } catch (error) {
        console.error('Failed to delete country config:', error)
        this.error = 'Failed to delete country configuration.'
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================================================
    // EQUITY SCORING
    // ========================================================================

    /**
     * Calculate equity score for current meeting
     */
    async calculateEquityForCurrent() {
      if (!this.currentMeeting || !this.currentMeeting.participants?.length) {
        this.participantStatuses = []
        this.equityScore = null
        return
      }

      try {
        const statuses = await this.calculateParticipantStatuses(
          this.currentMeeting.participants,
          this.currentMeeting.proposed_time
        )

        this.participantStatuses = statuses
        const scoreResult = calculateEquityScore(statuses)
        this.equityScore = scoreResult.score
      } catch (error) {
        console.error('Failed to calculate equity score:', error)
        this.error = 'Failed to calculate equity score.'
      }
    },

    /**
     * Calculate participant statuses for a given time
     */
    async calculateParticipantStatuses(participants, proposedTime) {
      const statuses = []

      for (const participant of participants) {
        // Get country config
        const config = this.getConfigForCountry(participant.country)
        if (!config) {
          console.warn(`No config found for country: ${participant.country}`)
          continue
        }

        // Convert to participant's local time
        const localTime = convertToTimezone(proposedTime, participant.timezone)

        // Check for holidays
        const holidays = await this.getHolidaysForCountry(
          participant.country,
          localTime.getFullYear()
        )
        const holidayCheck = isHoliday(localTime, holidays)

        // Determine color status
        const statusResult = determineColorStatus(localTime, config, !!holidayCheck)

        statuses.push({
          participant_id: participant.id,
          participant_name: participant.name,
          local_time: formatLocalTime(proposedTime, participant.timezone, 'PPpp'),
          timezone: participant.timezone,
          country: participant.country,
          status: statusResult.status,
          is_critical: statusResult.is_critical,
          reason: statusResult.reason,
          holiday: holidayCheck ? holidayCheck.name : null,
          config
        })
      }

      return statuses
    },

    /**
     * Generate optimal time slots (heatmap data)
     */
    async generateOptimalTimeSlots(date, participants = null) {
      // Use provided participants or fall back to currentMeeting participants
      const participantsToAnalyze = participants || this.currentMeeting?.participants

      if (!participantsToAnalyze || participantsToAnalyze.length === 0) {
        this.optimalTimeSlots = []
        this.heatmapData = []
        return
      }

      this.loadingSuggestions = true

      try {
        const slots = []

        // Analyze each hour of the day
        for (let hour = 0; hour < 24; hour++) {
          const testTime = new Date(date)
          testTime.setHours(hour, 0, 0, 0)

          const statuses = await this.calculateParticipantStatuses(participantsToAnalyze, testTime)

          const scoreResult = calculateEquityScore(statuses)

          slots.push({
            hour,
            datetime: testTime,
            score: scoreResult.score,
            green_count: scoreResult.green_count,
            orange_count: scoreResult.orange_count,
            red_count: scoreResult.red_count,
            critical_count: scoreResult.critical_count,
            participant_statuses: statuses
          })
        }

        // Sort by score descending
        const sorted = [...slots].sort((a, b) => b.score - a.score)

        this.heatmapData = slots
        this.optimalTimeSlots = sorted.slice(0, 3) // Top 3 suggestions
      } catch (error) {
        console.error('Failed to generate optimal time slots:', error)
        this.error = 'Failed to analyze optimal times.'
      } finally {
        this.loadingSuggestions = false
      }
    },

    // ========================================================================
    // HOLIDAY MANAGEMENT
    // ========================================================================

    /**
     * Get holidays for country (with caching)
     */
    async getHolidaysForCountry(countryCode, year) {
      const cacheKey = `${countryCode}_${year}`

      // Check cache
      if (this.holidayCache.has(cacheKey)) {
        return this.holidayCache.get(cacheKey)
      }

      // Fetch from API
      const holidays = await fetchHolidays(countryCode, year)

      // Store in cache
      this.holidayCache.set(cacheKey, holidays)

      return holidays
    },

    // ========================================================================
    // UTILITY ACTIONS
    // ========================================================================

    /**
     * Set current meeting
     */
    setCurrentMeeting(meeting) {
      this.currentMeeting = meeting
      this.isDirty = false
    },

    /**
     * Mark as dirty
     */
    markDirty() {
      this.isDirty = true
    },

    /**
     * Clear error
     */
    clearError() {
      this.error = null
    },

    /**
     * Set search query
     */
    setSearchQuery(query) {
      this.searchQuery = query
    },

    /**
     * Reset store
     */
    $reset() {
      this.meetings = []
      this.currentMeeting = null
      this.isDirty = false
      this.participants = []
      this.availableParticipants = []
      this.countryConfigs = []
      this.defaultConfigs = []
      this.customConfigs = []
      this.equityScore = null
      this.participantStatuses = []
      this.optimalTimeSlots = []
      this.heatmapData = []
      this.holidayCache = new Map()
      this.loading = false
      this.loadingMeetings = false
      this.loadingSuggestions = false
      this.savingMeeting = false
      this.error = null
      this.searchQuery = ''
      this.filterDate = null
    }
  }
})
