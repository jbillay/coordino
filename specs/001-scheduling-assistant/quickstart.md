# Quickstart: Scheduling Assistant

**For**: Developers implementing the Scheduling Assistant feature
**Branch**: `001-scheduling-assistant`
**Prerequisites**: Node.js 18+, Supabase CLI, Vue 3 project setup

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install date-fns date-fns-tz
```

**Why these?**
- `date-fns`: Lightweight date utilities (already in project)
- `date-fns-tz`: Timezone conversion with DST support

**Note**: PrimeVue, Pinia, Supabase are already installed.

### 2. Run Database Migration

```bash
# From project root
supabase migration new scheduling_assistant
```

Copy the schema from `supabase/migrations/20251211_scheduling_assistant.sql` (generated from data-model.md).

Apply migration:
```bash
supabase db reset  # Dev environment
# OR
supabase db push   # Production
```

**Verify tables created**:
```sql
-- In Supabase SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('meetings', 'participants', 'meeting_participants', 'country_configurations', 'holiday_cache');
```

### 3. Create Feature Structure

```bash
# From project root
mkdir -p src/features/scheduling/components
mkdir -p src/features/scheduling/composables
mkdir -p tests/unit/scheduling
mkdir -p tests/integration/scheduling
mkdir -p tests/e2e/scheduling
```

### 4. Verify RLS Policies

```sql
-- In Supabase SQL Editor, verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('meetings', 'participants', 'country_configurations');
-- All should show rowsecurity = true
```

## Core Concepts

### Timezone Conversion Pattern

```javascript
// src/features/scheduling/composables/useTimezone.js
import { utcToZonedTime, zonedTimeToUtc, format } from 'date-fns-tz'

export function useTimezone() {
  // Convert UTC (from database) to participant's local time
  const toLocalTime = (utcDate, timezone) => {
    return utcToZonedTime(utcDate, timezone)
  }

  // Convert user's local time selection to UTC (for database)
  const toUTC = (localDate, timezone) => {
    return zonedTimeToUtc(localDate, timezone)
  }

  // Format with timezone abbreviation: "2:00 PM EST (America/New_York)"
  const formatWithTimezone = (date, timezone) => {
    const abbr = format(date, 'zzz', { timeZone: timezone })
    const time = format(date, 'h:mm a', { timeZone: timezone })
    return `${time} ${abbr} (${timezone})`
  }

  return { toLocalTime, toUTC, formatWithTimezone }
}
```

**Usage in component**:
```vue
<script setup>
import { useTimezone } from '../composables/useTimezone'

const { formatWithTimezone } = useTimezone()

const meeting = { proposed_time: '2025-12-15T14:00:00Z' } // UTC from DB
const participant = { timezone: 'America/New_York' }

// Display: "9:00 AM EST (America/New_York)"
const displayTime = formatWithTimezone(new Date(meeting.proposed_time), participant.timezone)
</script>
```

### Equity Scoring Algorithm

```javascript
// src/features/scheduling/composables/useEquityScore.js
export function useEquityScore() {
  const weights = {
    green: 10,
    orange: 5,
    red: -15,
    critical: -50
  }

  const calculateScore = (participants) => {
    let totalPoints = 0

    for (const p of participants) {
      totalPoints += weights[p.status]
    }

    // Normalize to 0-100
    const maxPossible = participants.length * 10
    const score = (totalPoints / maxPossible) * 100

    return Math.max(0, Math.min(100, score))
  }

  const getBreakdown = (participants) => ({
    green_count: participants.filter(p => p.status === 'green').length,
    orange_count: participants.filter(p => p.status === 'orange').length,
    red_count: participants.filter(p => p.status === 'red').length,
    critical_count: participants.filter(p => p.status === 'critical').length
  })

  return { calculateScore, getBreakdown }
}
```

### Status Calculation (Priority Order)

```javascript
// src/features/scheduling/composables/useTimezone.js (extended)
export function useTimezone() {
  // ... previous functions

  const calculateStatus = (localTime, countryConfig, holidays) => {
    // 1. Check holiday/non-working day → CRITICAL
    const dateStr = format(localTime, 'yyyy-MM-dd')
    if (holidays.some(h => h.date === dateStr)) {
      return { status: 'critical', reason: 'National Holiday' }
    }

    const dayOfWeek = localTime.getDay() // 0=Sunday
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek // 1=Monday, 7=Sunday
    if (!countryConfig.work_days.includes(adjustedDay)) {
      return { status: 'critical', reason: 'Non-working day' }
    }

    // 2. Get time components
    const hour = localTime.getHours()
    const minute = localTime.getMinutes()
    const timeInMinutes = hour * 60 + minute

    // Parse config times to minutes
    const parseTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const greenStart = parseTime(countryConfig.green_start)
    const greenEnd = parseTime(countryConfig.green_end)
    const orangeMorningStart = parseTime(countryConfig.orange_morning_start)
    const orangeMorningEnd = parseTime(countryConfig.orange_morning_end)
    const orangeEveningStart = parseTime(countryConfig.orange_evening_start)
    const orangeEveningEnd = parseTime(countryConfig.orange_evening_end)

    // 3. Check ranges (priority order)
    if (timeInMinutes < orangeMorningStart || timeInMinutes >= orangeEveningEnd) {
      return { status: 'red', reason: 'Outside working hours' }
    }

    if (timeInMinutes >= greenStart && timeInMinutes < greenEnd) {
      return { status: 'green', reason: 'Optimal working hours' }
    }

    if ((timeInMinutes >= orangeMorningStart && timeInMinutes < orangeMorningEnd) ||
        (timeInMinutes >= orangeEveningStart && timeInMinutes < orangeEveningEnd)) {
      return { status: 'orange', reason: 'Buffer hours' }
    }

    return { status: 'red', reason: 'Outside working hours' }
  }

  return { toLocalTime, toUTC, formatWithTimezone, calculateStatus }
}
```

### Holiday API Integration

```javascript
// src/features/scheduling/composables/useHolidays.js
import { ref } from 'vue'
import { useSupabase } from '@/composables/useSupabase'

export function useHolidays() {
  const { supabase } = useSupabase()
  const loading = ref(false)
  const error = ref(null)

  const fetchHolidays = async (countryCode, year) => {
    loading.value = true
    error.value = null

    try {
      // 1. Check cache (< 7 days old)
      const { data: cached } = await supabase
        .from('holiday_cache')
        .select('*')
        .eq('country_code', countryCode)
        .eq('year', year)
        .maybeSingle()

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      if (cached && new Date(cached.fetched_at) > sevenDaysAgo) {
        return cached.holidays_json
      }

      // 2. Fetch from Nager.Date API with retry
      const holidays = await retryWithBackoff(
        () => fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
          .then(res => {
            if (!res.ok) throw new Error('Holiday API failed')
            return res.json()
          }),
        3, // max attempts
        1000 // initial delay (ms)
      )

      // 3. Update cache
      await supabase
        .from('holiday_cache')
        .upsert({
          country_code: countryCode,
          year,
          holidays_json: holidays,
          fetched_at: new Date().toISOString()
        })

      return holidays
    } catch (err) {
      console.error('Holiday fetch failed:', err)
      error.value = err

      // Fallback to stale cache if available
      if (cached) {
        console.warn('Using stale holiday cache')
        return cached.holidays_json
      }

      return []
    } finally {
      loading.value = false
    }
  }

  const retryWithBackoff = async (fn, maxAttempts, initialDelay) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (err) {
        if (attempt === maxAttempts - 1) throw err
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return { fetchHolidays, loading, error }
}
```

## Pinia Store Pattern

```javascript
// src/features/scheduling/store.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useTimezone } from './composables/useTimezone'
import { useEquityScore } from './composables/useEquityScore'
import { useHolidays } from './composables/useHolidays'

export const useSchedulingStore = defineStore('scheduling', () => {
  const { supabase } = useSupabase()
  const { toLocalTime, calculateStatus } = useTimezone()
  const { calculateScore, getBreakdown } = useEquityScore()
  const { fetchHolidays } = useHolidays()

  // State
  const meetings = ref([])
  const currentMeeting = ref(null)
  const participants = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const participantsWithStatus = computed(async () => {
    if (!currentMeeting.value) return []

    const results = []
    for (const mp of currentMeeting.value.meeting_participants) {
      const p = mp.participant
      const localTime = toLocalTime(currentMeeting.value.proposed_time, p.timezone)
      const holidays = await fetchHolidays(p.country_code, localTime.getFullYear())
      const countryConfig = await getCountryConfig(p.country_code)
      const { status, reason } = calculateStatus(localTime, countryConfig, holidays)

      results.push({
        ...p,
        local_time: localTime,
        status,
        status_reason: reason
      })
    }

    return results
  })

  const equityScore = computed(() => {
    return calculateScore(participantsWithStatus.value)
  })

  // Actions
  const fetchMeetings = async () => {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('meetings')
        .select('*')
        .order('proposed_time', { ascending: false })

      if (err) throw err
      meetings.value = data
    } catch (err) {
      error.value = err
      console.error('Failed to fetch meetings:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchMeeting = async (id) => {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_participants(
            participant:participants(*)
          )
        `)
        .eq('id', id)
        .single()

      if (err) throw err
      currentMeeting.value = data
      return data
    } catch (err) {
      error.value = err
      console.error('Failed to fetch meeting:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ... more actions (createMeeting, updateMeeting, deleteMeeting, etc.)

  return {
    meetings,
    currentMeeting,
    participants,
    participantsWithStatus,
    equityScore,
    loading,
    error,
    fetchMeetings,
    fetchMeeting
  }
})
```

## Component Example: Participant List

```vue
<!-- src/features/scheduling/components/ParticipantList.vue -->
<template>
  <DataTable :value="participantsWithStatus" responsiveLayout="scroll">
    <Column field="name" header="Name" />

    <Column header="Location">
      <template #body="{ data }">
        {{ data.timezone.replace(/_/g, ' ') }}
      </template>
    </Column>

    <Column header="Local Time">
      <template #body="{ data }">
        {{ formatTime(data.local_time, data.timezone) }}
      </template>
    </Column>

    <Column header="Status">
      <template #body="{ data }">
        <Badge
          :value="data.status"
          :severity="getStatusSeverity(data.status)"
        />
        <span class="ml-2 text-sm text-gray-600">
          {{ data.status_reason }}
        </span>
      </template>
    </Column>

    <Column header="Working Hours">
      <template #body="{ data }">
        {{ data.working_hours || '9:00 AM - 5:00 PM' }}
      </template>
    </Column>
  </DataTable>
</template>

<script setup>
import { DataTable } from 'primevue/datatable'
import { Column } from 'primevue/column'
import { Badge } from 'primevue/badge'
import { format } from 'date-fns-tz'

const props = defineProps({
  participantsWithStatus: {
    type: Array,
    required: true
  }
})

const formatTime = (date, timezone) => {
  const abbr = format(date, 'zzz', { timeZone: timezone })
  const time = format(date, 'h:mm a', { timeZone: timezone })
  return `${time} ${abbr}`
}

const getStatusSeverity = (status) => {
  const map = {
    green: 'success',
    orange: 'warning',
    red: 'danger',
    critical: 'danger'
  }
  return map[status] || 'info'
}
</script>
```

## Testing Examples

### Unit Test: Equity Score

```javascript
// tests/unit/scheduling/useEquityScore.spec.js
import { describe, it, expect } from 'vitest'
import { useEquityScore } from '@/features/scheduling/composables/useEquityScore'

describe('useEquityScore', () => {
  const { calculateScore } = useEquityScore()

  it('calculates perfect score for all green participants', () => {
    const participants = [
      { status: 'green' },
      { status: 'green' },
      { status: 'green' }
    ]
    expect(calculateScore(participants)).toBe(100)
  })

  it('calculates zero score for all critical participants', () => {
    const participants = [
      { status: 'critical' },
      { status: 'critical' }
    ]
    expect(calculateScore(participants)).toBe(0) // Clamped at 0
  })

  it('calculates mixed score correctly', () => {
    const participants = [
      { status: 'green' },   // +10
      { status: 'orange' },  // +5
      { status: 'red' }      // -15
    ]
    // Total: 0, Max: 30, Score: 0
    expect(calculateScore(participants)).toBe(0)
  })
})
```

### Integration Test: Meeting CRUD

```javascript
// tests/integration/scheduling/MeetingCRUD.spec.js
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulingStore } from '@/features/scheduling/store'

describe('Meeting CRUD Operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates meeting with valid data', async () => {
    const store = useSchedulingStore()

    const meetingData = {
      title: 'Test Meeting',
      proposed_time: new Date('2025-12-15T14:00:00Z'),
      duration_minutes: 60,
      notes: 'Test notes'
    }

    await store.createMeeting(meetingData)

    expect(store.error).toBeNull()
    expect(store.meetings).toHaveLength(1)
    expect(store.meetings[0].title).toBe('Test Meeting')
  })

  it('enforces duration constraints', async () => {
    const store = useSchedulingStore()

    const invalidData = {
      title: 'Invalid Meeting',
      proposed_time: new Date(),
      duration_minutes: 10 // Below 15-minute minimum
    }

    await expect(store.createMeeting(invalidData)).rejects.toThrow()
  })
})
```

## Common Pitfalls

### ❌ Storing local times in database
```javascript
// WRONG
await supabase.from('meetings').insert({
  proposed_time: '2025-12-15 14:00:00' // Ambiguous timezone
})
```

### ✅ Always store UTC
```javascript
// CORRECT
import { zonedTimeToUtc } from 'date-fns-tz'

const localTime = new Date('2025-12-15T14:00:00')
const utcTime = zonedTimeToUtc(localTime, userTimezone)

await supabase.from('meetings').insert({
  proposed_time: utcTime.toISOString() // UTC ISO string
})
```

### ❌ Forgetting to check participant limit
```javascript
// WRONG - allows >50 participants
await supabase.from('meeting_participants').insert({
  meeting_id: id,
  participant_id: participantId
})
```

### ✅ Validate before inserting
```javascript
// CORRECT
const { count } = await supabase
  .from('meeting_participants')
  .select('*', { count: 'exact', head: true })
  .eq('meeting_id', id)

if (count >= 50) {
  throw new Error('Cannot add more than 50 participants')
}

await supabase.from('meeting_participants').insert({
  meeting_id: id,
  participant_id: participantId
})
```

## Next Steps

1. **Implement Phase 1 (P1: Quick Timezone Check)**:
   - Create `MeetingForm.vue`, `ParticipantList.vue`, `TimezoneGrid.vue`
   - Implement `useTimezone.js` composable
   - Create Pinia store actions for CRUD
   - Write unit tests for timezone conversion

2. **Add routes**:
```javascript
// src/router/index.js
{
  path: '/scheduling',
  component: () => import('@/features/scheduling/SchedulingLayout.vue'),
  children: [
    { path: '', name: 'meetings', component: () => import('@/features/scheduling/views/MeetingList.vue') },
    { path: 'create', name: 'create-meeting', component: () => import('@/features/scheduling/views/CreateMeeting.vue') },
    { path: ':id', name: 'meeting-detail', component: () => import('@/features/scheduling/views/MeetingDetail.vue') }
  ]
}
```

3. **Implement subsequent phases** (P2-P4 per spec priorities)

4. **Run accessibility audit** before deployment

## Getting Help

- **Spec**: `specs/001-scheduling-assistant/spec.md`
- **Data Model**: `specs/001-scheduling-assistant/data-model.md`
- **API Contracts**: `specs/001-scheduling-assistant/contracts/`
- **Research**: `specs/001-scheduling-assistant/research.md`
- **Constitution**: `.specify/memory/constitution.md`
