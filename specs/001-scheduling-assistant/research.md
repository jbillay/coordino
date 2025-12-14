# Research: Scheduling Assistant

**Phase**: 0 (Outline & Research)
**Date**: 2025-12-11
**Status**: Complete

## Overview

This document resolves all technical unknowns identified during planning and documents library choices, best practices, and integration patterns for the Scheduling Assistant feature.

## Research Areas

### 1. Timezone Conversion Library

**Decision**: Use `date-fns` and `date-fns-tz` for all timezone operations

**Rationale**:
- **Lightweight**: date-fns is modular and tree-shakeable, only bundle what you use (~15KB for core timezone functions vs 200KB+ for Moment.js with timezones)
- **Modern**: Uses native Date objects, no custom date types or wrappers
- **DST Support**: date-fns-tz handles Daylight Saving Time transitions automatically via IANA timezone database
- **Composition API Compatible**: Pure functions work seamlessly with Vue 3 composables
- **Active Maintenance**: Actively maintained with regular IANA timezone data updates
- **Existing Usage**: Project already uses date-fns for date formatting (verified in package.json)

**Alternatives Considered**:
- **Moment.js + moment-timezone**: Deprecated, large bundle size, mutable API
- **Luxon**: Good alternative but larger bundle, less widespread adoption
- **Day.js + dayjs-timezone**: Smaller but less comprehensive DST handling

**Key APIs**:
```javascript
import { utcToZonedTime, zonedTimeToUtc, format } from 'date-fns-tz'
import { parseISO } from 'date-fns'

// Convert UTC to participant's timezone
const localTime = utcToZonedTime(utcDate, 'America/New_York')

// Convert local time selection to UTC for storage
const utcTime = zonedTimeToUtc(localTime, 'America/New_York')

// Format with timezone abbreviation
const formatted = format(localTime, 'h:mm a zzz', { timeZone: 'America/New_York' })
// => "2:00 PM EST"
```

**Implementation Notes**:
- Store all meeting times in UTC in database (proposed_time column)
- Convert to participant timezones on-demand in UI
- Use `getTimezoneOffset()` for displaying UTC offsets (e.g., "UTC-5")
- Cache timezone conversions within component render cycle to avoid redundant calculations

### 2. Holiday Detection API

**Decision**: Use Nager.Date Public API (https://date.nager.at)

**Rationale**:
- **Free**: No API key required, public endpoint with reasonable rate limits
- **Coverage**: 100+ countries with national and regional holidays
- **Data Quality**: Maintained by community, includes holiday names and types (public, bank, school)
- **REST API**: Simple GET requests, JSON responses
- **No Authentication**: Reduces security surface area (no API keys to manage)
- **SLA**: Suitable for non-critical feature (graceful degradation if unavailable)

**Alternatives Considered**:
- **Calendarific**: More comprehensive but requires API key and has usage limits on free tier
- **Abstract API Holidays**: Requires authentication, paid tiers only for commercial use
- **Manual CSV**: Labor-intensive to maintain, no automatic updates

**API Endpoints**:
```javascript
// Get public holidays for a country and year
GET https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}

// Response example
[
  {
    "date": "2025-01-01",
    "localName": "New Year's Day",
    "name": "New Year's Day",
    "countryCode": "US",
    "global": true,
    "counties": null,
    "launchYear": null,
    "types": ["Public"]
  }
]

// Check if a specific date is a public holiday
GET https://date.nager.at/api/v3/IsTodayPublicHoliday/{countryCode}
// Returns 200 if holiday, 204 if not
```

**Implementation Strategy**:
1. **Caching**: Cache holiday data in Supabase table `holiday_cache` with columns: country_code, year, holidays_json, fetched_at
2. **Cache Duration**: 7 days per FR-034 (holidays don't change frequently within a year)
3. **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s) per FR-036
4. **Graceful Degradation**: If API fails and cache expired, skip holiday checks and notify user per FR-035
5. **Batch Fetching**: Pre-fetch current year + next year on first meeting creation

**Error Handling**:
```javascript
// useHolidays.js composable
const fetchHolidays = async (countryCode, year) => {
  try {
    const cached = await checkCache(countryCode, year)
    if (cached && isWithin7Days(cached.fetched_at)) {
      return cached.holidays_json
    }

    const response = await retryWithBackoff(() =>
      fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
    )

    if (!response.ok) throw new Error('Holiday API failed')

    const holidays = await response.json()
    await cacheHolidays(countryCode, year, holidays)
    return holidays
  } catch (error) {
    console.error('Holiday fetch failed:', error)
    return checkCache(countryCode, year)?.holidays_json || null
  }
}
```

### 3. Equity Scoring Algorithm

**Decision**: Implement weighted scoring system with normalization

**Algorithm Specification**:
```javascript
/**
 * Calculate global equity score for proposed meeting time
 * @param {Array} participants - Array of participant status objects
 * @returns {number} Score from 0-100
 */
function calculateEquityScore(participants) {
  const weights = {
    green: 10,      // Optimal working hours
    orange: 5,      // Acceptable buffer hours
    red: -15,       // Outside acceptable hours
    critical: -50   // Holiday or non-working day
  }

  let totalPoints = 0

  for (const participant of participants) {
    totalPoints += weights[participant.status]
  }

  // Normalize: (totalPoints / maxPossible) × 100
  // maxPossible = participants.length × 10 (all green)
  const maxPossible = participants.length * 10
  const score = (totalPoints / maxPossible) * 100

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score))
}
```

**Status Determination Priority** (FR-021):
1. Check if meeting date is holiday or non-working day → `critical` (red)
2. Check if time is outside orange range (8:00-18:00 default) → `red`
3. Check if time is in orange buffer (8:00-9:00, 17:00-18:00 default) → `orange`
4. Otherwise time is in green range (9:00-17:00 default) → `green`

**Rationale**:
- **Negative Weights for Red/Critical**: Penalizes poor times more than rewarding good times, encouraging fairness
- **Critical Heavily Penalized**: -50 ensures holidays are avoided unless absolutely unavoidable
- **Normalization to 0-100**: Makes score intuitive (100 = perfect for everyone, 0 = terrible)
- **Deterministic**: Same inputs always produce same score (important for testing)

**Performance Considerations**:
- Algorithm is O(n) where n = participant count
- For 50 participants (max), ~50 operations = <1ms execution time
- Cache score on proposed_time change to avoid recalculation during render

### 4. Heatmap Generation Strategy

**Decision**: Generate 24-hour equity score array client-side on demand

**Algorithm**:
```javascript
/**
 * Generate 24-hour heatmap data for a specific date
 * @param {Date} date - The target date (time ignored)
 * @param {Array} participants - Array of participant objects with timezone/country
 * @returns {Array<Object>} Array of 24 objects with hour and equity score
 */
function generateHeatmap(date, participants) {
  const heatmap = []

  for (let hour = 0; hour < 24; hour++) {
    const proposedTime = new Date(date)
    proposedTime.setHours(hour, 0, 0, 0)

    // Calculate status for each participant at this hour
    const participantStatuses = participants.map(p => ({
      ...p,
      status: calculateStatus(proposedTime, p)
    }))

    const equityScore = calculateEquityScore(participantStatuses)

    heatmap.push({
      hour,
      equityScore,
      participantStatuses
    })
  }

  return heatmap
}
```

**Optimization Strategy**:
- **Memoization**: Cache heatmap for current date + participant list combination
- **Debouncing**: Only regenerate after 300ms of no participant changes
- **Web Workers** (if needed): Offload calculation to worker thread for 20+ participants
- **Target**: <5s generation for 20 participants per SC-003

**Performance Analysis**:
- 24 hours × 50 participants = 1,200 status calculations
- Each status calculation: ~10 operations (timezone conversion, range checks)
- Estimated: ~12,000 operations = 10-20ms on modern browsers
- Well within 5s target, no optimization needed for phase 1

**Top 3 Suggestions** (FR-029):
```javascript
// Sort heatmap by equity score descending, take top 3
const topSuggestions = heatmap
  .slice()
  .sort((a, b) => b.equityScore - a.equityScore)
  .slice(0, 3)
  .map(slot => ({
    hour: slot.hour,
    equityScore: slot.equityScore,
    greenCount: slot.participantStatuses.filter(p => p.status === 'green').length,
    orangeCount: slot.participantStatuses.filter(p => p.status === 'orange').length,
    redCount: slot.participantStatuses.filter(p => p.status === 'red').length,
    criticalCount: slot.participantStatuses.filter(p => p.status === 'critical').length
  }))
```

### 5. IANA Timezone Validation

**Decision**: Use hardcoded IANA timezone list from Intl.supportedValuesOf

**Implementation**:
```javascript
// utils/timezones.js
export const IANA_TIMEZONES = Intl.supportedValuesOf('timeZone')
// Returns: ['Africa/Abidjan', 'Africa/Accra', ..., 'Pacific/Wake', ...]

export function isValidTimezone(tz) {
  return IANA_TIMEZONES.includes(tz)
}

// For UI dropdown
export const TIMEZONE_OPTIONS = IANA_TIMEZONES.map(tz => ({
  label: tz.replace(/_/g, ' '), // "America/New_York" → "America/New York"
  value: tz
}))
```

**Rationale**:
- **Standards-Based**: Uses browser's built-in IANA timezone list
- **No External Dependency**: No need to bundle timezone list
- **Always Current**: Browser maintains up-to-date list
- **Validation**: Simple array lookup for FR-008 validation

**UI Pattern**:
- PrimeVue Dropdown with autocomplete for 400+ timezones
- Group by region (Africa/, America/, Asia/, Europe/, Pacific/)
- Search/filter by city name

### 6. Country Code Validation

**Decision**: Use ISO 3166-1 alpha-2 country code list

**Implementation**:
```javascript
// utils/countries.js
export const ISO_COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
  // ... all 249 ISO 3166-1 alpha-2 codes
  'ZA', 'ZM', 'ZW'
]

export function isValidCountryCode(code) {
  return ISO_COUNTRY_CODES.includes(code)
}

// For UI dropdown (map to display names)
import { countryCodes } from 'countries-list'
export const COUNTRY_OPTIONS = Object.entries(countryCodes).map(([code, name]) => ({
  label: name,
  value: code
}))
```

**Library**: Use `countries-list` npm package (~8KB) for country code → name mapping

**Rationale**:
- **Standard Compliance**: FR-009 requires ISO 3166-1 alpha-2
- **Small Bundle**: Minimal overhead for country name display
- **Nager.Date Compatibility**: Holiday API uses same ISO codes

### 7. Database Schema Design

**Decision**: Four tables with many-to-many relationship for meetings/participants

**Schema**:
```sql
-- Meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  proposed_time TIMESTAMPTZ NOT NULL, -- UTC storage
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants table (reusable across meetings)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL, -- IANA format: 'America/New_York'
  country_code CHAR(2) NOT NULL, -- ISO 3166-1 alpha-2: 'US'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many join table
CREATE TABLE meeting_participants (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, participant_id)
);

-- Custom country configurations
CREATE TABLE country_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code CHAR(2) NOT NULL,
  green_start TIME NOT NULL DEFAULT '09:00',
  green_end TIME NOT NULL DEFAULT '17:00',
  orange_morning_start TIME NOT NULL DEFAULT '08:00',
  orange_morning_end TIME NOT NULL DEFAULT '09:00',
  orange_evening_start TIME NOT NULL DEFAULT '17:00',
  orange_evening_end TIME NOT NULL DEFAULT '18:00',
  work_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, country_code)
);

-- Holiday cache (shared across users)
CREATE TABLE holiday_cache (
  country_code CHAR(2) NOT NULL,
  year INTEGER NOT NULL,
  holidays_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (country_code, year)
);
```

**RLS Policies**:
```sql
-- Meetings RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Participants RLS (similar pattern)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
-- ... (same 4 policies with user_id check)

-- Meeting participants RLS (join table)
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meeting participants"
  ON meeting_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- Country configurations RLS
ALTER TABLE country_configurations ENABLE ROW LEVEL SECURITY;
-- ... (same 4 policies with user_id check)

-- Holiday cache: public read, no write (populated by Edge Function)
ALTER TABLE holiday_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read holiday cache"
  ON holiday_cache FOR SELECT
  TO authenticated
  USING (true);
```

**Rationale**:
- **Normalization**: Participants are reusable (FR-014), avoiding duplication
- **UTC Storage**: proposed_time in UTC, convert to local in application
- **Cascading Deletes**: ON DELETE CASCADE removes orphaned meeting_participants
- **Check Constraints**: Enforce duration limits (FR-001a) at database level
- **JSONB for Holidays**: Flexible structure, supports querying within JSON
- **Indexes**: Add indexes on user_id, proposed_time, country_code for query performance

### 8. PrimeVue Components Selection

**Decision**: Use the following PrimeVue components

**Components Map**:
- **DataTable**: Participant list with timezone display (FR-043)
- **Calendar**: Date picker for meeting date (FR-002)
- **Dropdown**: Time slot selection (15-minute intervals), timezone selection, country selection
- **InputText**: Meeting title, participant name
- **Textarea**: Meeting notes, participant notes
- **Button**: Action buttons (Save, Delete, Add Participant)
- **Dialog**: Confirmation dialogs, forms
- **Card**: Equity score display, heatmap container
- **Badge**: Status indicators (green/orange/red/critical)
- **Message**: Holiday alerts, validation errors
- **ProgressBar** or **Knob**: Equity score visualization (0-100)

**Rationale**:
- **Accessibility**: PrimeVue components include ARIA labels and keyboard navigation
- **Consistency**: Using component library ensures visual consistency
- **Theming**: PrimeVue themes integrate with Tailwind CSS
- **Existing Usage**: Project already uses PrimeVue (verified in package.json)

**Context7 Lookup Required**:
- DataTable column configuration and sorting
- Calendar date/time picker customization
- Dropdown autocomplete and grouping patterns

### 9. Work Week Patterns

**Decision**: Store work days as integer array (1=Monday, 7=Sunday)

**Default Patterns**:
```javascript
const WORK_WEEK_PATTERNS = {
  'Monday-Friday': [1, 2, 3, 4, 5],      // Most countries
  'Sunday-Thursday': [7, 1, 2, 3, 4],    // Middle East (UAE, Saudi Arabia)
  'Saturday-Wednesday': [6, 7, 1, 2, 3], // Some regions
}

// Check if date is a working day for country
function isWorkingDay(date, countryConfig) {
  const dayOfWeek = date.getDay() // 0=Sunday, 6=Saturday
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek // Convert to 1=Monday, 7=Sunday
  return countryConfig.work_days.includes(adjustedDay)
}
```

**Rationale**:
- **Flexibility**: Supports any work week pattern (FR-037)
- **Database Storage**: PostgreSQL integer array column
- **Simple Logic**: Array.includes() check for working day validation
- **Default**: Monday-Friday [1,2,3,4,5] for most countries

### 10. Accessibility Testing Strategy

**Decision**: Multi-tool approach for WCAG 2.1 AA compliance

**Tools**:
1. **axe DevTools** (browser extension): Automated accessibility audits
2. **Keyboard Testing**: Manual Tab/Enter/Escape navigation
3. **Screen Reader Testing**: NVDA (Windows) or VoiceOver (Mac)
4. **Color Contrast Analyzer**: WebAIM Contrast Checker

**Checklist** (per SC-009):
- [ ] All interactive elements keyboard accessible (FR-045)
- [ ] Focus indicators visible (2px solid outline, 2px offset per constitution)
- [ ] ARIA labels on all components (FR-046)
- [ ] Color contrast 4.5:1 text, 3:1 UI (FR-048)
- [ ] Respects prefers-reduced-motion (FR-047)
- [ ] Screen reader announces status changes
- [ ] Form validation errors announced
- [ ] Touch targets ≥44×44px on mobile

**Implementation Notes**:
- Add `aria-label` to DataTable columns
- Add `role="status"` to equity score display for screen reader announcements
- Add `aria-live="polite"` to holiday alerts
- Ensure color is not sole indicator (use icons + color for status)

## Technology Summary

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| Timezone | date-fns-tz | 3.x | Lightweight, DST support, modular |
| Date Utils | date-fns | 3.x | Existing dependency, pure functions |
| Holiday API | Nager.Date | v3 | Free, no auth, 100+ countries |
| UI Components | PrimeVue | 3.x | Existing, accessible, themeable |
| State | Pinia | 2.x | Existing, Composition API compatible |
| Database | Supabase PostgreSQL | 15+ | Existing, RLS support |
| Testing | Vitest | 1.x | Vue 3 compatible, fast |
| E2E Testing | Playwright | 1.x | Existing, cross-browser |

## Open Questions

None. All technical decisions resolved.

## Next Steps

Proceed to Phase 1: Design & Contracts
- Generate data-model.md (detailed schema with relationships)
- Generate API contracts in /contracts/ directory
- Generate quickstart.md (developer onboarding guide)
- Update agent context with new technologies
