# Data Model: Scheduling Assistant

**Phase**: 1 (Design & Contracts)
**Date**: 2025-12-11
**Status**: Complete

## Entity-Relationship Overview

```
┌─────────────┐         ┌──────────────────────┐         ┌──────────────┐
│   Meeting   │────────▶│ meeting_participants │◀────────│ Participant  │
│             │  1:N    │    (join table)      │  N:1    │              │
│  - id       │         │  - meeting_id (FK)   │         │  - id        │
│  - user_id  │         │  - participant_id    │         │  - user_id   │
│  - title    │         └──────────────────────┘         │  - name      │
│  - time     │                                          │  - timezone  │
│  - duration │                                          │  - country   │
└─────────────┘                                          └──────────────┘
      │                                                         │
      │ 1:1                                                     │ N:1
      ▼                                                         ▼
┌──────────────────────┐                           ┌────────────────────────┐
│ country_configuration│                           │ country_configuration  │
│  - user_id + country │                           │  - user_id + country   │
│  - working hours     │                           │  - working hours       │
└──────────────────────┘                           └────────────────────────┘
```

## Entities

### Meeting

**Purpose**: Represents a proposed meeting with international participants

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique meeting identifier |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Meeting organizer (single owner per FR-006b) |
| `title` | TEXT | NOT NULL | Meeting title (e.g., "Q4 Planning Call") |
| `proposed_time` | TIMESTAMPTZ | NOT NULL | Proposed meeting start time in UTC |
| `duration_minutes` | INTEGER | NOT NULL, CHECK >= 15 AND <= 480 | Meeting duration in minutes (FR-001a) |
| `notes` | TEXT | NULL | Optional meeting notes or agenda |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_proposed_time ON meetings(proposed_time);
```

**Validation Rules**:
- Duration must be between 15 minutes and 8 hours (480 minutes) per FR-001a
- Proposed time stored in UTC, converted to local in application per FR-015
- Title cannot be empty (NOT NULL constraint)
- Maximum 50 participants per meeting (enforced at application level per FR-010a)

**Lifecycle**:
1. **Creation**: User creates meeting with title, date/time, duration
2. **Participants Added**: User adds 1-50 participants via meeting_participants join table
3. **Time Adjustment**: User modifies proposed_time, triggers equity score recalculation
4. **Deletion**: User deletes meeting, cascades to meeting_participants

**Relationships**:
- **One-to-Many** with `meeting_participants` (one meeting has many participant associations)
- **Many-to-One** with `auth.users` (many meetings belong to one user)

### Participant

**Purpose**: Represents a reusable attendee with timezone and country information

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique participant identifier |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Participant owner |
| `name` | TEXT | NOT NULL | Participant display name (e.g., "Alice Chen") |
| `timezone` | TEXT | NOT NULL | IANA timezone identifier (e.g., "Asia/Shanghai") |
| `country_code` | CHAR(2) | NOT NULL | ISO 3166-1 alpha-2 code (e.g., "CN") |
| `notes` | TEXT | NULL | Optional notes about participant (e.g., "Prefers mornings") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_country_code ON participants(country_code);
```

**Validation Rules**:
- Timezone must be valid IANA identifier per FR-008 (validated at application level)
- Country code must be valid ISO 3166-1 alpha-2 per FR-009 (validated at application level)
- Name cannot be empty (NOT NULL constraint)

**Lifecycle**:
1. **Creation**: User creates reusable participant with name, timezone, country
2. **Assignment**: Participant can be added to multiple meetings via meeting_participants
3. **Update**: User edits participant details, affects all meetings they're in
4. **Deletion**: User deletes participant (with confirmation if assigned to meetings per FR-013)

**Relationships**:
- **One-to-Many** with `meeting_participants` (one participant can be in many meetings)
- **Many-to-One** with `auth.users` (many participants belong to one user)
- **Many-to-One** with `country_configurations` (many participants from one country use same config)

### MeetingParticipant

**Purpose**: Join table linking meetings to participants (many-to-many relationship)

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `meeting_id` | UUID | NOT NULL, REFERENCES meetings(id) ON DELETE CASCADE | Meeting reference |
| `participant_id` | UUID | NOT NULL, REFERENCES participants(id) ON DELETE CASCADE | Participant reference |

**Primary Key**: Composite key `(meeting_id, participant_id)`

**Indexes**:
```sql
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_participant ON meeting_participants(participant_id);
```

**Validation Rules**:
- Maximum 50 rows per meeting_id (enforced at application level per FR-010a)
- Cannot add same participant twice to same meeting (PRIMARY KEY prevents duplicates)

**Lifecycle**:
1. **Addition**: User adds participant to meeting, creates join record
2. **Removal**: User removes participant from meeting, deletes join record
3. **Cascade**: Meeting deletion removes all associated join records
4. **Cascade**: Participant deletion removes all associated join records

**Relationships**:
- **Many-to-One** with `meetings` (many join records for one meeting)
- **Many-to-One** with `participants` (many join records for one participant)

### CountryConfiguration

**Purpose**: Stores custom working hour settings per country for each user

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique configuration identifier |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Configuration owner |
| `country_code` | CHAR(2) | NOT NULL | ISO 3166-1 alpha-2 code (e.g., "ES") |
| `green_start` | TIME | NOT NULL, DEFAULT '09:00' | Green zone start time (optimal hours) |
| `green_end` | TIME | NOT NULL, DEFAULT '17:00' | Green zone end time (optimal hours) |
| `orange_morning_start` | TIME | NOT NULL, DEFAULT '08:00' | Orange morning buffer start |
| `orange_morning_end` | TIME | NOT NULL, DEFAULT '09:00' | Orange morning buffer end |
| `orange_evening_start` | TIME | NOT NULL, DEFAULT '17:00' | Orange evening buffer start |
| `orange_evening_end` | TIME | NOT NULL, DEFAULT '18:00' | Orange evening buffer end |
| `work_days` | INTEGER[] | NOT NULL, DEFAULT ARRAY[1,2,3,4,5] | Working days (1=Monday, 7=Sunday) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Unique Constraint**:
```sql
UNIQUE (user_id, country_code)
```

**Indexes**:
```sql
CREATE INDEX idx_country_config_user_country ON country_configurations(user_id, country_code);
```

**Validation Rules**:
- Times stored as TIME (hour:minute), no timezone
- green_start must be < green_end (validated at application level)
- orange ranges must not overlap green range (validated at application level)
- work_days must contain integers 1-7 (validated at application level)
- One configuration per (user_id, country_code) pair (UNIQUE constraint)

**Default Behavior** (FR-022):
```javascript
// If no custom config exists for country, use these defaults:
const DEFAULT_CONFIG = {
  green_start: '09:00',
  green_end: '17:00',
  orange_morning_start: '08:00',
  orange_morning_end: '09:00',
  orange_evening_start: '17:00',
  orange_evening_end: '18:00',
  work_days: [1, 2, 3, 4, 5] // Monday-Friday
}
```

**Lifecycle**:
1. **Creation**: User creates custom config for specific country
2. **Usage**: Equity scoring checks for custom config, falls back to defaults
3. **Update**: User modifies working hours for country
4. **Deletion**: User resets to defaults by deleting custom config

**Relationships**:
- **Many-to-One** with `auth.users` (many configs belong to one user)
- **Implicit relationship** with `participants` via country_code (not a foreign key)

### HolidayCache

**Purpose**: Shared cache of national holidays fetched from Nager.Date API

**Attributes**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `country_code` | CHAR(2) | NOT NULL | ISO 3166-1 alpha-2 code (e.g., "US") |
| `year` | INTEGER | NOT NULL | Calendar year (e.g., 2025) |
| `holidays_json` | JSONB | NOT NULL | Array of holiday objects from API |
| `fetched_at` | TIMESTAMPTZ | DEFAULT NOW() | When data was cached |

**Primary Key**: Composite key `(country_code, year)`

**Indexes**:
```sql
CREATE INDEX idx_holiday_cache_fetched ON holiday_cache(fetched_at);
```

**JSONB Structure**:
```json
[
  {
    "date": "2025-12-25",
    "localName": "Christmas Day",
    "name": "Christmas Day",
    "countryCode": "US",
    "global": true,
    "types": ["Public"]
  }
]
```

**Validation Rules**:
- Cache duration: 7 days per FR-034
- Stale cache (>7 days) triggers re-fetch with retry logic per FR-036
- API failure falls back to stale cache or skips holiday check per FR-035

**Lifecycle**:
1. **Population**: First meeting with country X in year Y fetches holidays from API
2. **Cache Hit**: Subsequent meetings check cache, use if <7 days old
3. **Refresh**: Cache >7 days triggers background re-fetch
4. **Expiration**: No hard expiration, stale cache used as fallback

**Relationships**:
- **None**: Shared read-only table, no foreign keys
- **Implicit relationship** with `participants` via country_code (not a foreign key)

## State Transitions

### Meeting Status

Meetings don't have explicit status field, but have lifecycle states:

```
┌──────────┐    Add participants     ┌────────────┐    Adjust time    ┌──────────┐
│  Draft   │ ────────────────────▶ │ Configured │ ◀──────────────▶ │ Adjusted │
└──────────┘                        └────────────┘                   └──────────┘
     │                                     │                               │
     │                                     │                               │
     └─────────────────────────────────────┴───────────────────────────────┘
                                           │
                                           ▼
                                     ┌──────────┐
                                     │ Deleted  │
                                     └──────────┘
```

**States**:
1. **Draft**: Meeting created but no participants added yet
2. **Configured**: Meeting has 1+ participants, equity score can be calculated
3. **Adjusted**: Proposed time changed, equity score recalculated
4. **Deleted**: Soft delete not implemented (permanent deletion per FR-006a allows manual deletion only)

### Participant Status (per meeting time)

Calculated dynamically, not stored:

```
                    Check holiday/non-working day
                              │
                              ▼
                       ┌──────────────┐
                       │  Is holiday? │
                       └──────────────┘
                         │           │
                    Yes  │           │  No
                         ▼           ▼
                   ┌──────────┐  Check time range
                   │ CRITICAL │      │
                   └──────────┘      ▼
                           ┌──────────────────┐
                           │ Outside orange?  │
                           └──────────────────┘
                              │             │
                         Yes  │             │  No
                              ▼             ▼
                         ┌──────┐   ┌──────────────┐
                         │ RED  │   │ In orange?   │
                         └──────┘   └──────────────┘
                                       │         │
                                  Yes  │         │  No
                                       ▼         ▼
                                 ┌────────┐  ┌───────┐
                                 │ ORANGE │  │ GREEN │
                                 └────────┘  └───────┘
```

**Status Values** (FR-020, FR-021):
- **GREEN**: Time is within green working hours (default 9:00-17:00)
- **ORANGE**: Time is within orange buffer hours (default 8:00-9:00, 17:00-18:00)
- **RED**: Time is outside acceptable hours (before 8:00 or after 18:00)
- **CRITICAL**: Date is a national holiday or non-working day

## Computed Fields

These are calculated at runtime, not stored in database:

### Meeting

| Field | Type | Calculation | Used For |
|-------|------|-------------|----------|
| `participant_count` | INTEGER | COUNT of meeting_participants | FR-010a validation (max 50) |
| `equity_score` | NUMBER (0-100) | calculateEquityScore(participants) | FR-023, FR-024 display |
| `green_count` | INTEGER | COUNT of participants with status=green | FR-026 breakdown |
| `orange_count` | INTEGER | COUNT of participants with status=orange | FR-026 breakdown |
| `red_count` | INTEGER | COUNT of participants with status=red | FR-026 breakdown |
| `critical_count` | INTEGER | COUNT of participants with status=critical | FR-026 breakdown |

### Participant (per meeting)

| Field | Type | Calculation | Used For |
|-------|------|-------------|----------|
| `local_time` | DATETIME | utcToZonedTime(proposed_time, timezone) | FR-015, FR-017 display |
| `local_time_formatted` | STRING | format(local_time, 'h:mm a zzz') | FR-017 display with abbreviation |
| `timezone_offset` | STRING | getTimezoneOffset(timezone) | FR-018 display (e.g., "UTC-5") |
| `status` | ENUM | calculateStatus(local_time, country_config, holidays) | FR-020 color-coded display |
| `status_reason` | STRING | Explanation for status (e.g., "National Holiday: Memorial Day") | FR-044 alert display |
| `working_hours` | STRING | Format green range (e.g., "9:00 AM - 5:00 PM") | FR-043 table display |

### Heatmap (24-hour array)

| Field | Type | Calculation | Used For |
|-------|------|-------------|----------|
| `hour` | INTEGER | 0-23 | FR-027 x-axis |
| `equity_score` | NUMBER (0-100) | calculateEquityScore for this hour | FR-027 y-axis / color |
| `participant_statuses` | ARRAY | Array of {participant, status} objects | FR-030 detail on click |

## Row Level Security Policies

### Meetings

```sql
-- SELECT: Users see only their own meetings
CREATE POLICY meetings_select ON meetings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can create meetings for themselves
CREATE POLICY meetings_insert ON meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own meetings
CREATE POLICY meetings_update ON meetings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own meetings
CREATE POLICY meetings_delete ON meetings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Participants

```sql
-- Same pattern as meetings (4 policies with user_id check)
CREATE POLICY participants_select ON participants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY participants_insert ON participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY participants_update ON participants FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY participants_delete ON participants FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### MeetingParticipants

```sql
-- All operations allowed if user owns the meeting
CREATE POLICY meeting_participants_all ON meeting_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );
```

### CountryConfigurations

```sql
-- Same pattern as meetings (4 policies with user_id check)
CREATE POLICY country_config_select ON country_configurations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY country_config_insert ON country_configurations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY country_config_update ON country_configurations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY country_config_delete ON country_configurations FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### HolidayCache

```sql
-- Read-only for all authenticated users (shared cache)
CREATE POLICY holiday_cache_select ON holiday_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies (populated by Edge Function or admin)
```

## Database Migration

**Migration File**: `supabase/migrations/20251211_scheduling_assistant.sql`

**Execution Order**:
1. Create tables (meetings, participants, meeting_participants, country_configurations, holiday_cache)
2. Create indexes
3. Enable RLS on all tables
4. Create RLS policies
5. Create updated_at triggers (auto-update timestamp on UPDATE)

**Triggers**:
```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_config_updated_at BEFORE UPDATE ON country_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Query Patterns

### Get meeting with participants and calculated statuses

```javascript
// Fetch meeting
const { data: meeting } = await supabase
  .from('meetings')
  .select(`
    *,
    meeting_participants(
      participant:participants(*)
    )
  `)
  .eq('id', meetingId)
  .single()

// Calculate statuses client-side
const participantsWithStatus = await Promise.all(
  meeting.meeting_participants.map(async ({ participant }) => {
    const localTime = utcToZonedTime(meeting.proposed_time, participant.timezone)
    const holidays = await getHolidays(participant.country_code, localTime.getFullYear())
    const countryConfig = await getCountryConfig(participant.country_code)
    const status = calculateStatus(localTime, countryConfig, holidays)

    return {
      ...participant,
      local_time: localTime,
      status,
      status_reason: getStatusReason(status, localTime, holidays)
    }
  })
)

// Calculate equity score
const equityScore = calculateEquityScore(participantsWithStatus)
```

### Check participant limit before adding

```javascript
const { count } = await supabase
  .from('meeting_participants')
  .select('*', { count: 'exact', head: true })
  .eq('meeting_id', meetingId)

if (count >= 50) {
  throw new Error('Cannot add more than 50 participants to a meeting')
}
```

### Get custom country config with fallback to defaults

```javascript
const { data: customConfig } = await supabase
  .from('country_configurations')
  .select('*')
  .eq('country_code', countryCode)
  .eq('user_id', userId)
  .maybeSingle()

const config = customConfig || DEFAULT_CONFIG
```

## Next Steps

- Generate API contracts in `/contracts/` directory (OpenAPI spec)
- Generate quickstart.md (developer onboarding guide)
- Update agent context with new technologies
