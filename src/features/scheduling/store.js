/**
 * Pinia store for Scheduling Assistant feature
 * Manages meetings, participants, and scheduling state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'
import { toLocalTime, calculateStatus } from './composables/useTimezone'
import { formatInTimeZone } from 'date-fns-tz'
import { calculateScore as calcEquityScore } from './composables/useEquityScore'
import { generateHeatmap, getTopSuggestions } from './composables/useHeatmap'
import { fetchHolidays, checkHoliday } from './composables/useHolidays'
import { DEFAULT_CONFIG } from './utils'

/**
 * Convert work_days array to work_week_pattern string
 * @param {number[]} workDays - Array of ISO day numbers (1=Monday, ..., 7=Sunday)
 * @returns {string} Pattern string (e.g., 'MTWTF' for Mon-Fri)
 */
function workDaysToPattern(workDays) {
  if (!workDays || workDays.length === 0) {
    return ''
  }

  const dayMap = {
    1: 'M', // Monday
    2: 'T', // Tuesday
    3: 'W', // Wednesday
    4: 'Th', // Thursday
    5: 'F', // Friday
    6: 'Sa', // Saturday
    7: 'Su' // Sunday
  }

  return workDays
    .sort((a, b) => a - b)
    .map((day) => dayMap[day])
    .filter(Boolean)
    .join('')
}

/**
 * Convert work_week_pattern string to work_days array
 * @param {string} pattern - Pattern string (e.g., 'MTWTF')
 * @returns {number[]} Array of ISO day numbers (1=Monday, ..., 7=Sunday)
 */
function patternToWorkDays(pattern) {
  if (!pattern) {
    return []
  }

  const days = []
  const remaining = pattern

  // Check for multi-character codes first (order matters!)
  if (remaining.includes('Su')) {
    days.push(7)
  } // Sunday
  if (remaining.includes('Th')) {
    days.push(4)
  } // Thursday
  if (remaining.includes('Sa')) {
    days.push(6)
  } // Saturday

  // Then single character codes
  // For 'M', 'T', 'W', 'F' - check they're not part of longer codes
  if (remaining.includes('M') && !remaining.match(/M[oO]/)) {
    days.push(1)
  } // Monday
  if (remaining.includes('T') && !remaining.includes('Th') && !remaining.match(/T[uU]/)) {
    days.push(2)
  } // Tuesday
  if (remaining.includes('W')) {
    days.push(3)
  } // Wednesday
  if (remaining.includes('F')) {
    days.push(5)
  } // Friday

  return days.sort((a, b) => a - b)
}

export const useSchedulingStore = defineStore('scheduling', () => {
  const { supabase } = useSupabase()
  const authStore = useAuthStore()

  // State
  const meetings = ref([])
  const currentMeeting = ref(null)
  const participants = ref([])
  const loading = ref(false)
  const error = ref(null)
  const holidaysCache = ref({}) // Map of 'countryCode_year' -> holidays array
  const holidaysFetchError = ref(false) // Track if holiday API failed (T100)
  const countryConfigurations = ref([]) // Custom working hours per country (US4)

  // Computed Properties (T094: Updated for US3 holiday support, T114: Updated for US4 custom configs)
  const participantsWithStatus = computed(() => {
    if (!currentMeeting.value || !currentMeeting.value.participants) {
      return []
    }

    const proposedTime = new Date(currentMeeting.value.proposed_time)
    const year = proposedTime.getFullYear()

    return currentMeeting.value.participants.map((participant) => {
      // Convert proposed UTC time to participant's local timezone
      const localTime = toLocalTime(proposedTime, participant.timezone)

      // T114: Get country-specific config (custom or default)
      const config = getCountryConfig(participant.country_code)

      // Get day of week in participant's timezone (0=Sunday, 1=Monday, ..., 6=Saturday)
      const dayOfWeek = localTime.getDay()

      // Convert JS day (0-6) to ISO day (1-7): Sunday=7, Monday=1, etc.
      const dayOfWeekISO = dayOfWeek === 0 ? 7 : dayOfWeek
      const isWorkDay = config.work_days.includes(dayOfWeekISO)

      // Get holidays for this participant's country (US3)
      const cacheKey = `${participant.country_code}_${year}`
      const countryHolidays = holidaysCache.value[cacheKey] || []

      // Check if meeting date is a holiday
      const holiday = checkHoliday(localTime, countryHolidays)

      // Calculate status with holiday check and custom config
      const statusResult = calculateStatus(localTime, config, holiday, isWorkDay)

      // Format time with timezone (h:mm a zzz format)
      const formattedTime = `${formatInTimeZone(
        proposedTime,
        participant.timezone,
        'h:mm a zzz'
      )} (${participant.timezone})`

      // Calculate UTC offset using the participant's timezone
      // Format: 'xxx' gives us '+05:30' or '-08:00'
      const offsetStr = formatInTimeZone(proposedTime, participant.timezone, 'xxx')
      const offset = `UTC${offsetStr}`

      return {
        ...participant,
        localTime,
        formattedTime,
        offset,
        status: statusResult.status,
        statusReason: statusResult.reason,
        config // Include config for UI display
      }
    })
  })

  const equityScore = computed(() => calcEquityScore(participantsWithStatus.value))

  // Heatmap data for optimal time discovery (US2, US3, US4)
  const heatmapData = computed(() => {
    if (
      !currentMeeting.value ||
      !currentMeeting.value.participants ||
      currentMeeting.value.participants.length === 0
    ) {
      return []
    }

    const meetingDate = new Date(currentMeeting.value.proposed_time)

    // T114: Build country configs map using custom configs where available
    const countryConfigs = {}
    currentMeeting.value.participants.forEach((participant) => {
      if (participant.country_code && !countryConfigs[participant.country_code]) {
        countryConfigs[participant.country_code] = getCountryConfig(participant.country_code)
      }
    })

    return generateHeatmap(
      currentMeeting.value.participants,
      meetingDate,
      countryConfigs,
      holidaysCache.value
    )
  })

  // Top 3 optimal time suggestions (US2)
  const topSuggestions = computed(() => getTopSuggestions(heatmapData.value, 3))

  // Actions - Participant Management
  async function createParticipant(participantData) {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await supabase
        .from('participants')
        .insert({
          user_id: authStore.user.id,
          name: participantData.name,
          timezone: participantData.timezone,
          country_code: participantData.country_code,
          notes: participantData.notes || null
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Add to local participants list
      participants.value.push(data)
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchParticipants() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      participants.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateParticipant(id, updates) {
    loading.value = true
    error.value = null
    try {
      const { data, error: updateError } = await supabase
        .from('participants')
        .update(updates)
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update in local participants list
      const index = participants.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        participants.value[index] = data
      }

      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteParticipant(id) {
    loading.value = true
    error.value = null
    try {
      // Check if participant is in any meetings (FR-013)
      const { data: meetingCount, error: countError } = await supabase
        .from('meeting_participants')
        .select('meeting_id', { count: 'exact', head: true })
        .eq('participant_id', id)

      if (countError) {
        throw countError
      }

      // Delete participant (cascades to meeting_participants)
      const { error: deleteError } = await supabase
        .from('participants')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id)

      if (deleteError) {
        throw deleteError
      }

      // Remove from local participants list
      const index = participants.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        participants.value.splice(index, 1)
      }

      return { deletedCount: meetingCount }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actions - Meeting Management
  async function createMeeting(meetingData) {
    loading.value = true
    error.value = null
    try {
      // Validate duration (FR-001a)
      if (meetingData.duration_minutes < 15 || meetingData.duration_minutes > 480) {
        throw new Error('Meeting duration must be between 15 and 480 minutes')
      }

      const { data, error: insertError } = await supabase
        .from('meetings')
        .insert({
          user_id: authStore.user.id,
          title: meetingData.title,
          proposed_time: meetingData.proposed_time, // Should already be UTC
          duration_minutes: meetingData.duration_minutes,
          notes: meetingData.notes || null
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Add to local meetings list
      meetings.value.unshift(data)
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMeeting(id) {
    loading.value = true
    error.value = null
    try {
      // Fetch meeting with participants join
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .single()

      if (meetingError) {
        throw meetingError
      }

      // Fetch associated participants
      const { data: meetingParticipants, error: participantsError } = await supabase
        .from('meeting_participants')
        .select('participant_id, participants(*)')
        .eq('meeting_id', id)

      if (participantsError) {
        throw participantsError
      }

      // Attach participants to meeting object
      meeting.participants = meetingParticipants.map((mp) => mp.participants)

      currentMeeting.value = meeting

      // US3: Fetch holidays for all participants' countries
      await fetchMeetingHolidays(meeting)

      return meeting
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch all meetings for the current user
  async function fetchMeetings() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('meetings')
        .select(
          `
          *,
          meeting_participants (
            participant_id,
            participants (*)
          )
        `
        )
        .eq('user_id', authStore.user.id)
        .order('proposed_time', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Transform the data to include participants directly on each meeting
      meetings.value = data.map((meeting) => ({
        ...meeting,
        participants: meeting.meeting_participants?.map((mp) => mp.participants) || [],
        participant_count: meeting.meeting_participants?.length || 0
      }))

      return meetings.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // US3: Fetch holidays for meeting participants (T094, T100)
  async function fetchMeetingHolidays(meeting) {
    if (!meeting || !meeting.participants || meeting.participants.length === 0) {
      return
    }

    const meetingDate = new Date(meeting.proposed_time)
    const year = meetingDate.getFullYear()

    // Reset error flag
    holidaysFetchError.value = false

    // Get unique country codes
    const countryCodes = [...new Set(meeting.participants.map((p) => p.country_code))].filter(
      Boolean
    )

    // Fetch holidays for each country
    const fetchPromises = countryCodes.map(async (countryCode) => {
      const cacheKey = `${countryCode}_${year}`

      // Skip if already cached
      if (holidaysCache.value[cacheKey]) {
        return { success: true, countryCode }
      }

      try {
        const holidays = await fetchHolidays(countryCode, year, supabase)
        holidaysCache.value[cacheKey] = holidays
        return { success: true, countryCode }
      } catch (error) {
        console.error(`Failed to fetch holidays for ${countryCode}:`, error)
        holidaysCache.value[cacheKey] = [] // Cache empty array on failure
        return { success: false, countryCode, error }
      }
    })

    const results = await Promise.all(fetchPromises)

    // Check if any fetches failed (T100)
    const failures = results.filter((r) => !r.success)
    if (failures.length > 0) {
      holidaysFetchError.value = true
      console.warn(
        `Holiday fetch failed for ${failures.length} countries:`,
        failures.map((f) => f.countryCode)
      )
    }
  }

  async function updateMeeting(id, updates) {
    loading.value = true
    error.value = null
    try {
      // Validate duration if changed (FR-001a)
      if (
        updates.duration_minutes &&
        (updates.duration_minutes < 15 || updates.duration_minutes > 480)
      ) {
        throw new Error('Meeting duration must be between 15 and 480 minutes')
      }

      const { data, error: updateError } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update in local meetings list
      const index = meetings.value.findIndex((m) => m.id === id)
      if (index !== -1) {
        meetings.value[index] = data
      }

      // Update currentMeeting if it's the same meeting
      if (currentMeeting.value && currentMeeting.value.id === id) {
        currentMeeting.value = { ...currentMeeting.value, ...data }
      }

      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteMeeting(id) {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id)

      if (deleteError) {
        throw deleteError
      }

      // Remove from local meetings list
      const index = meetings.value.findIndex((m) => m.id === id)
      if (index !== -1) {
        meetings.value.splice(index, 1)
      }

      // Clear currentMeeting if it's the deleted meeting
      if (currentMeeting.value && currentMeeting.value.id === id) {
        currentMeeting.value = null
      }

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actions - Meeting-Participant Association
  async function addParticipantToMeeting(meetingId, participantId) {
    loading.value = true
    error.value = null
    try {
      // Check current participant count (FR-010a)
      const { data: existingCount, error: countError } = await supabase
        .from('meeting_participants')
        .select('participant_id', { count: 'exact', head: true })
        .eq('meeting_id', meetingId)

      if (countError) {
        throw countError
      }

      if (existingCount && existingCount.length >= 50) {
        throw new Error('Maximum of 50 participants per meeting exceeded')
      }

      // Check for duplicates
      const { data: existing, error: checkError } = await supabase
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('participant_id', participantId)
        .maybeSingle()

      if (checkError) {
        throw checkError
      }

      if (existing) {
        throw new Error('Participant already added to this meeting')
      }

      // Insert into meeting_participants
      const { error: insertError } = await supabase.from('meeting_participants').insert({
        meeting_id: meetingId,
        participant_id: participantId
      })

      if (insertError) {
        throw insertError
      }

      // Refresh meeting if it's current
      if (currentMeeting.value && currentMeeting.value.id === meetingId) {
        await fetchMeeting(meetingId)
      }

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeParticipantFromMeeting(meetingId, participantId) {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await supabase
        .from('meeting_participants')
        .delete()
        .eq('meeting_id', meetingId)
        .eq('participant_id', participantId)

      if (deleteError) {
        throw deleteError
      }

      // Refresh meeting if it's current
      if (currentMeeting.value && currentMeeting.value.id === meetingId) {
        await fetchMeeting(meetingId)
      }

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actions - Country Configuration Management (US4)

  // T113: Helper function to get country config (custom or default)
  function getCountryConfig(countryCode) {
    if (!countryCode) {
      return DEFAULT_CONFIG
    }

    // Check if custom config exists for this country
    const customConfig = countryConfigurations.value.find(
      (config) => config.country_code === countryCode
    )

    if (customConfig) {
      return {
        green_start: customConfig.green_start,
        green_end: customConfig.green_end,
        orange_morning_start: customConfig.orange_start_morning,
        orange_morning_end: customConfig.orange_end_morning,
        orange_evening_start: customConfig.orange_start_evening,
        orange_evening_end: customConfig.orange_end_evening,
        work_days: patternToWorkDays(customConfig.work_week_pattern)
      }
    }

    // Fall back to default configuration
    return DEFAULT_CONFIG
  }

  // T109: Fetch all country configurations for current user
  async function fetchCountryConfigurations() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('country_configurations')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('country_code', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Map database column names to internal format for all configurations
      const mappedData = (data || []).map((config) => ({
        ...config,
        orange_morning_start: config.orange_start_morning,
        orange_morning_end: config.orange_end_morning,
        orange_evening_start: config.orange_start_evening,
        orange_evening_end: config.orange_end_evening,
        work_days: patternToWorkDays(config.work_week_pattern)
      }))

      // Remove database column names from mapped objects
      mappedData.forEach((config) => {
        delete config.orange_start_morning
        delete config.orange_end_morning
        delete config.orange_start_evening
        delete config.orange_end_evening
        delete config.work_week_pattern
      })

      countryConfigurations.value = mappedData
      return mappedData
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // T110: Create a new country configuration
  // UPDATED: Now converts work_days to work_week_pattern
  async function createCountryConfiguration(configData) {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await supabase
        .from('country_configurations')
        .insert({
          user_id: authStore.user.id,
          country_code: configData.country_code,
          green_start: configData.green_start,
          green_end: configData.green_end,
          orange_start_morning: configData.orange_morning_start,
          orange_end_morning: configData.orange_morning_end,
          orange_start_evening: configData.orange_evening_start,
          orange_end_evening: configData.orange_evening_end,
          work_week_pattern: workDaysToPattern(configData.work_days)
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Map database column names back to internal format
      const mappedData = {
        ...data,
        orange_morning_start: data.orange_start_morning,
        orange_morning_end: data.orange_end_morning,
        orange_evening_start: data.orange_start_evening,
        orange_evening_end: data.orange_end_evening,
        work_days: patternToWorkDays(data.work_week_pattern)
      }
      // Remove database column names from the mapped object
      delete mappedData.orange_start_morning
      delete mappedData.orange_end_morning
      delete mappedData.orange_start_evening
      delete mappedData.orange_end_evening
      delete mappedData.work_week_pattern

      // Add to local list
      countryConfigurations.value.push(mappedData)
      return mappedData
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // T111: Update an existing country configuration
  async function updateCountryConfiguration(id, updates) {
    loading.value = true
    error.value = null
    try {
      // Map internal column names to database column names
      const dbUpdates = { ...updates }
      if (updates.orange_morning_start !== undefined) {
        dbUpdates.orange_start_morning = updates.orange_morning_start
        delete dbUpdates.orange_morning_start
      }
      if (updates.orange_morning_end !== undefined) {
        dbUpdates.orange_end_morning = updates.orange_morning_end
        delete dbUpdates.orange_morning_end
      }
      if (updates.orange_evening_start !== undefined) {
        dbUpdates.orange_start_evening = updates.orange_evening_start
        delete dbUpdates.orange_evening_start
      }
      if (updates.orange_evening_end !== undefined) {
        dbUpdates.orange_end_evening = updates.orange_evening_end
        delete dbUpdates.orange_evening_end
      }
      if (updates.work_days !== undefined) {
        dbUpdates.work_week_pattern = workDaysToPattern(updates.work_days)
        delete dbUpdates.work_days
      }

      const { data, error: updateError } = await supabase
        .from('country_configurations')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Map database column names back to internal format
      const mappedData = {
        ...data,
        orange_morning_start: data.orange_start_morning,
        orange_morning_end: data.orange_end_morning,
        orange_evening_start: data.orange_start_evening,
        orange_evening_end: data.orange_end_evening,
        work_days: patternToWorkDays(data.work_week_pattern)
      }
      // Remove database column names from the mapped object
      delete mappedData.orange_start_morning
      delete mappedData.orange_end_morning
      delete mappedData.orange_start_evening
      delete mappedData.orange_end_evening
      delete mappedData.work_week_pattern

      // Update in local list
      const index = countryConfigurations.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        countryConfigurations.value[index] = mappedData
      }

      return mappedData
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // T112: Delete a country configuration (reverts to defaults)
  async function deleteCountryConfiguration(id) {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await supabase
        .from('country_configurations')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id)

      if (deleteError) {
        throw deleteError
      }

      // Remove from local list
      const index = countryConfigurations.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        countryConfigurations.value.splice(index, 1)
      }

      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    meetings,
    currentMeeting,
    participants,
    loading,
    error,
    holidaysFetchError,
    countryConfigurations,

    // Computed
    participantsWithStatus,
    equityScore,
    heatmapData,
    topSuggestions,

    // Actions
    createParticipant,
    fetchParticipants,
    updateParticipant,
    deleteParticipant,
    createMeeting,
    fetchMeeting,
    fetchMeetings,
    updateMeeting,
    deleteMeeting,
    addParticipantToMeeting,
    removeParticipantFromMeeting,
    getCountryConfig,
    fetchCountryConfigurations,
    createCountryConfiguration,
    updateCountryConfiguration,
    deleteCountryConfiguration
  }
})
