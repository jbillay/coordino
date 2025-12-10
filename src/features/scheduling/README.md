# Scheduling Assistant Feature

## Overview

The Scheduling Assistant helps meeting organizers coordinate international meetings across multiple timezones with visual equity scoring. It provides instant timezone conversion, optimal time discovery, holiday detection, and custom working hours configuration.

## Architecture

### Feature Organization

```
src/features/scheduling/
├── components/          # Vue components
│   ├── MeetingEditor.vue           # Main editor with 3 sections
│   ├── MeetingForm.vue             # Title, time, notes form
│   ├── MeetingList.vue             # List with search/filter
│   ├── ParticipantSelector.vue     # Add participant dropdown
│   ├── ParticipantList.vue         # Participant display list
│   ├── ParticipantCard.vue         # Single participant card
│   ├── ParticipantDialog.vue       # Create/edit participant
│   ├── EquityScoreDisplay.vue      # Score visualization
│   ├── TimeSlotHeatmap.vue         # 24-hour analysis grid
│   ├── OptimalTimeSuggestions.vue  # Top 3 times
│   └── __tests__/                  # Component tests
├── store.js             # Pinia store for state management
├── utils/               # Business logic utilities
│   ├── timezoneConverter.js        # IANA timezone conversion
│   ├── equityScorer.js             # Equity calculation
│   ├── workingHoursValidator.js    # Status determination
│   └── holidayService.js           # Holiday API integration
└── types.js             # JSDoc type definitions
```

### Database Schema

**Tables:**

- `meetings` - Meeting proposals with organizer reference
- `participants` - Attendees with timezone and country
- `country_configurations` - Working hours per country (default + custom)
- `meeting_participants` - Many-to-many junction table

**Security:**

- Row Level Security (RLS) enabled on all tables
- User data isolation enforced at database level
- Single-owner model (no sharing/permissions)

### State Management

**Pinia Store** (`store.js`):

- **State:** meetings, participants, country configs, equity scores, loading states
- **Getters:** filtered meetings, current equity score, has unsaved changes
- **Actions:** CRUD operations, equity calculation, holiday fetching (40+ actions)

**Data Flow:**

1. Components dispatch actions
2. Store calls Supabase client
3. Store updates local state
4. Computed properties react to changes
5. Components re-render

### Key Components

#### MeetingEditor.vue

Main editing interface combining:

- Meeting details form (left column)
- Participant list with statuses (middle column)
- Equity score and analytics (right column)

#### TimeSlotHeatmap.vue

24-hour grid visualization:

- Each cell represents one hour
- Color-coded by equity score (green/yellow/orange/red)
- Click cell to update proposed time
- Keyboard accessible (Tab + Enter/Space)

#### EquityScoreDisplay.vue

Circular progress indicator:

- 0-100 normalized score
- Breakdown of green/orange/red/critical counts
- Quality badge (Excellent/Good/Fair/Poor)
- ARIA live announcements for screen readers

### Utility Functions

#### timezoneConverter.js

- `convertToTimezone()` - Convert date to specific IANA timezone
- `formatLocalTime()` - Format date in timezone with custom format
- `getTimezoneOffset()` - Get UTC offset with DST detection
- `getTimezonesForCountry()` - Get IANA timezones for country code

Uses `date-fns-tz` for accurate DST handling.

#### equityScorer.js

- `calculateEquityScore()` - Calculate 0-100 score with breakdown
- Point system: Green +10, Orange +5, Red -15, Critical -50
- Normalized formula: `(totalPoints / maxPossible) × 100`

#### workingHoursValidator.js

- `determineColorStatus()` - Evaluate participant status
- Priority rules: Holiday/weekend → Green hours → Orange buffer → Red
- Work week patterns support international schedules (e.g., Su-Th)

#### holidayService.js

- `fetchHolidays()` - Fetch from Nager.Date API with retry logic
- 3 automatic retries with exponential backoff (1s, 2s, 4s)
- 7-day localStorage caching
- 10-second request timeout
- Graceful degradation (returns empty array on failure)

## User Stories

### P1: Quick Time Check (MVP)

Instantly see timezone conflicts with color-coded status indicators:

- **Green:** Optimal working hours
- **Orange:** Acceptable buffer hours
- **Red:** Outside acceptable hours
- **Critical:** Holiday or non-working day

### P2: Optimal Time Discovery

Generate 24-hour heatmap showing equity scores for each hour.
Get top 3 time suggestions ranked by score.

### P3: Critical Event Alerts

Automatic holiday detection via Nager.Date API.
Red override for holidays and non-standard weekends.

### P4: Custom Working Hours

Country-specific configuration:

- Green hours (optimal)
- Orange buffer (morning + evening)
- Work week pattern (MTWTF, SuMTWTh, etc.)
- Custom configs override defaults

## Data Model

### Meeting Entity

```javascript
{
  id: UUID,
  user_id: UUID (FK),
  title: string,
  proposed_time: TIMESTAMPTZ,
  notes: string,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
}
```

### Participant Entity

```javascript
{
  id: UUID,
  user_id: UUID (FK),
  name: string,
  timezone: string (IANA),
  country: string (ISO 3166-1),
  notes: string,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
}
```

### Country Configuration

```javascript
{
  id: UUID,
  user_id: UUID | null,
  country_code: string,
  green_start: TIME,
  green_end: TIME,
  orange_start_morning: TIME,
  orange_end_morning: TIME,
  orange_start_evening: TIME,
  orange_end_evening: TIME,
  work_week_pattern: string,
  is_default: boolean
}
```

## Equity Scoring Algorithm

**Formula:** `score = (totalPoints / maxPossible) × 100`

**Point Values:**

- Green participant: +10 points
- Orange participant: +5 points
- Red participant: -15 points
- Critical conflict: -50 points

**Example:**

- 2 green (20 pts)
- 1 orange (5 pts)
- 1 critical (-50 pts)
- Total: -25 pts
- Max possible: 40 pts
- Score: (-25 / 40) × 100 = -62.5 → clamped to 0

**Quality Categories:**

- Excellent: 71-100
- Good: 41-70
- Fair: 1-40
- Poor: 0

## Performance Targets

- **Timezone conversion:** <100ms for 20 participants
- **Equity calculation:** <2s for 20 participants
- **Heatmap generation:** <3s for 24-hour analysis
- **Search filtering:** <500ms response time

## Accessibility

**WCAG 2.1 Level AA Compliance:**

- Keyboard navigation for all interactive elements
- ARIA labels and roles on all components
- Focus indicators (3px teal outline with 2px offset)
- Screen reader announcements (aria-live for score changes)
- Color + text labels (not color-only)
- Respects `prefers-reduced-motion`

## Testing

**Component Tests:**

- MeetingForm.test.js - Form validation and rendering
- ParticipantCard.test.js - Status display logic
- EquityScoreDisplay.test.js - Score visualization

**Unit Tests:**

- equityScorer.test.js - Equity algorithm validation

**Test Coverage:** Targeting 80%+ for business logic

## External Dependencies

- **Vue 3** - Component framework
- **Pinia** - State management
- **PrimeVue** - UI components
- **Supabase** - Backend (database, auth, real-time)
- **date-fns** - Date manipulation
- **date-fns-tz** - Timezone handling with DST
- **Nager.Date API** - Holiday data (free, no API key)

## Future Enhancements

- Email notifications for meeting participants
- Calendar integration (Google Calendar, Outlook)
- Recurring meeting support
- Meeting templates
- Timezone heatmap by participant
- Weather data integration
- CSV export for meeting reports

## Contributing

### Adding a New Component

1. Create component in `components/` directory
2. Add JSDoc comments for props and events
3. Include ARIA labels for accessibility
4. Write component tests in `__tests__/`
5. Update this README if it's a major component

### Adding a New Utility

1. Create utility in `utils/` directory
2. Add comprehensive JSDoc with examples
3. Export all public functions
4. Write unit tests
5. Document in this README

### Modifying Database Schema

1. Create new migration in `supabase/migrations/`
2. Include RLS policies
3. Add indexes for performance
4. Test locally with `supabase db reset`
5. Update `types.js` with new type definitions
6. Update this README's data model section

## Troubleshooting

### Holiday API Not Working

- Check network connectivity
- Verify country code is ISO 3166-1 alpha-2 format
- Check browser console for retry attempts
- Holiday service returns empty array on failure (graceful degradation)

### Timezone Conversion Issues

- Ensure timezone is valid IANA identifier (e.g., 'America/New_York')
- Check if DST transition is involved
- Verify date is valid Date object or ISO string

### Equity Score Seems Wrong

- Check participant statuses are calculated correctly
- Verify country configuration is applied
- Ensure holiday data is loaded
- Check console for calculation errors

## License

Proprietary - Coordino Application
