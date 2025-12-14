# Tasks: Scheduling Assistant

**Input**: Design documents from `/specs/001-scheduling-assistant/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification. Test tasks are included as optional and can be skipped for faster MVP delivery.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Project uses feature-based organization per plan.md:
- Feature code: `src/features/scheduling/`
- Tests: `tests/unit/scheduling/`, `tests/integration/scheduling/`, `tests/e2e/scheduling/`
- Database: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 Install date-fns and date-fns-tz dependencies via npm install date-fns date-fns-tz
- [X] T002 [P] Create feature directory structure: src/features/scheduling/components/, src/features/scheduling/composables/
- [X] T003 [P] Create test directory structure: tests/unit/scheduling/, tests/integration/scheduling/, tests/e2e/scheduling/
- [X] T004 [P] Add scheduling routes to src/router/index.js for /scheduling path

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create database migration file supabase/migrations/20251211_scheduling_assistant.sql with all 5 tables (meetings, participants, meeting_participants, country_configurations, holiday_cache)
- [X] T006 Add CREATE TABLE statements for meetings table with RLS policies in supabase/migrations/20251211_scheduling_assistant.sql
- [X] T007 Add CREATE TABLE statements for participants table with RLS policies in supabase/migrations/20251211_scheduling_assistant.sql
- [X] T008 Add CREATE TABLE statements for meeting_participants join table with RLS policies in supabase/migrations/20251211_scheduling_assistant.sql
- [X] T009 Add CREATE TABLE statements for country_configurations table with RLS policies in supabase/migrations/20251211_scheduling_assistant.sql
- [X] T010 Add CREATE TABLE statements for holiday_cache table with RLS policies in supabase/migrations/20251211_scheduling_assistant.sql
- [X] T011 Add indexes for all tables (user_id, proposed_time, country_code, etc.) in supabase/migrations/20251211_scheduling_assistant.sql
- [X] T012 Add updated_at trigger function and triggers for meetings, participants, country_configurations in supabase/migrations/20251211_scheduling_assistant.sql
- [ ] T013 Run database migration using supabase db reset (dev) or supabase db push (prod) - MANUAL: Apply migration file through Supabase Dashboard SQL Editor
- [ ] T014 Verify all tables created and RLS enabled via Supabase SQL Editor - MANUAL: Verify after applying migration
- [X] T015 [P] Create useTimezone composable skeleton in src/features/scheduling/composables/useTimezone.js with toLocalTime, toUTC, formatWithTimezone functions
- [X] T016 [P] Create useEquityScore composable skeleton in src/features/scheduling/composables/useEquityScore.js with calculateScore, getBreakdown functions
- [X] T017 [P] Create useHolidays composable skeleton in src/features/scheduling/composables/useHolidays.js with fetchHolidays, retryWithBackoff functions
- [X] T018 [P] Create useHeatmap composable skeleton in src/features/scheduling/composables/useHeatmap.js with generateHeatmap function
- [X] T019 Create Pinia store skeleton in src/features/scheduling/store.js with state (meetings, currentMeeting, participants, loading, error)
- [X] T020 [P] Add IANA timezone list utility in src/features/scheduling/utils.js using Intl.supportedValuesOf('timeZone')
- [X] T021 [P] Add ISO country code list utility in src/features/scheduling/utils.js (install countries-list package if needed)
- [X] T021a [P] Add DEFAULT_CONFIG constant in src/features/scheduling/utils.js with default working hours (green 9:00-17:00, orange 8:00-9:00 & 17:00-18:00, work_days [1,2,3,4,5]) per FR-022

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Timezone Check (Priority: P1) 🎯 MVP

**Goal**: Enable users to create a meeting with international participants and instantly see color-coded timezone impact for each participant

**Independent Test**: Create a meeting with 3+ participants in different timezones (Paris CET, New York EST, Tokyo JST), select 5:00 PM as proposed time, verify each participant's local time and color status (green/orange/red) displays correctly

### Implementation for User Story 1

#### Core Composables

- [X] T022 [P] [US1] Implement toLocalTime function in src/features/scheduling/composables/useTimezone.js using utcToZonedTime from date-fns-tz
- [X] T023 [P] [US1] Implement toUTC function in src/features/scheduling/composables/useTimezone.js using zonedTimeToUtc from date-fns-tz
- [X] T024 [P] [US1] Implement formatWithTimezone function in src/features/scheduling/composables/useTimezone.js to show "2:00 PM EST (America/New_York)" format
- [X] T025 [P] [US1] Implement calculateStatus function in src/features/scheduling/composables/useTimezone.js with priority order: holiday check → outside orange → in orange → in green
- [X] T026 [P] [US1] Implement calculateScore function in src/features/scheduling/composables/useEquityScore.js using weights (green +10, orange +5, red -15, critical -50)
- [X] T027 [P] [US1] Implement getBreakdown function in src/features/scheduling/composables/useEquityScore.js to count participants by status

#### Pinia Store Actions

- [X] T028 [US1] Implement createParticipant action in src/features/scheduling/store.js with Supabase insert to participants table
- [X] T029 [US1] Implement fetchParticipants action in src/features/scheduling/store.js with Supabase select from participants table
- [X] T030 [US1] Implement updateParticipant action in src/features/scheduling/store.js with Supabase update to participants table
- [X] T031 [US1] Implement deleteParticipant action in src/features/scheduling/store.js with Supabase delete (check meeting_participants count first per FR-013)
- [X] T032 [US1] Implement createMeeting action in src/features/scheduling/store.js with Supabase insert to meetings table (validate duration 15-480 minutes per FR-001a)
- [X] T033 [US1] Implement fetchMeeting action in src/features/scheduling/store.js with Supabase select including meeting_participants join
- [X] T034 [US1] Implement updateMeeting action in src/features/scheduling/store.js with Supabase update to meetings table
- [X] T035 [US1] Implement deleteMeeting action in src/features/scheduling/store.js with Supabase delete (cascades to meeting_participants)
- [X] T036 [US1] Implement addParticipantToMeeting action in src/features/scheduling/store.js with validation (max 50 participants per FR-010a, no duplicates)
- [X] T037 [US1] Implement removeParticipantFromMeeting action in src/features/scheduling/store.js with Supabase delete from meeting_participants
- [X] T038 [US1] Add participantsWithStatus computed property in src/features/scheduling/store.js that calculates local time and status for all participants (uses default country config for US1, no holidays yet)
- [X] T039 [US1] Add equityScore computed property in src/features/scheduling/store.js using calculateScore on participantsWithStatus

#### UI Components

- [X] T040 [P] [US1] Create ParticipantForm.vue component in src/features/scheduling/components/ with fields: name, timezone (PrimeVue Dropdown with IANA list), country (PrimeVue Dropdown with ISO codes), notes
- [X] T041 [P] [US1] Add IANA timezone validation in ParticipantForm.vue using IANA_TIMEZONES list from utils.js (FR-008)
- [X] T042 [P] [US1] Add ISO country code validation in ParticipantForm.vue using ISO_COUNTRY_CODES list from utils.js (FR-009)
- [X] T043 [P] [US1] Create ParticipantList.vue component in src/features/scheduling/components/ using PrimeVue DataTable with columns: name, location (timezone), timezone offset (UTC±N per FR-018), local time, status (Badge with color), working hours (FR-043)
- [X] T044 [P] [US1] Add status Badge color mapping in ParticipantList.vue (green→success, orange→warning, red→danger, critical→danger)
- [X] T045 [P] [US1] Create MeetingForm.vue component in src/features/scheduling/components/ with fields: title, proposed time (PrimeVue Calendar configured for 15-minute intervals per FR-002), duration (PrimeVue Dropdown with 15-min intervals), notes
- [X] T046 [P] [US1] Add duration validation in MeetingForm.vue (15-480 minutes per FR-001a) with clear error message
- [X] T047 [P] [US1] Create TimezoneGrid.vue component in src/features/scheduling/components/ to display participant statuses in color-coded grid/table format
- [X] T048 [P] [US1] Create EquityScoreCard.vue component in src/features/scheduling/components/ using PrimeVue ProgressBar or Knob to show 0-100 score with breakdown (green/orange/red/critical counts per FR-025, FR-026)

#### Views and Routes

- [X] T049 [US1] Create ParticipantManagement.vue view in src/features/scheduling/views/ with ParticipantForm and list of all user's participants (CRUD operations)
- [X] T050 [US1] Create CreateMeeting.vue view in src/features/scheduling/views/ with MeetingForm, participant selection, and Add Participant button
- [X] T051 [US1] Create MeetingDetail.vue view in src/features/scheduling/views/ with ParticipantList, TimezoneGrid, EquityScoreCard, and time adjustment controls
- [X] T052 [US1] Add instant update behavior in MeetingDetail.vue: when proposed_time changes, recompute participantsWithStatus immediately (FR-019)
- [X] T053 [US1] Add route for /scheduling in src/router/index.js with SchedulingLayout.vue as parent
- [X] T054 [US1] Add child routes in src/router/index.js: /scheduling (MeetingList), /scheduling/participants (ParticipantManagement), /scheduling/create (CreateMeeting), /scheduling/:id (MeetingDetail)
- [X] T054a [US1] Create MeetingList.vue view in src/features/scheduling/views/ using PrimeVue DataTable with search by title and filters by date range, displaying all user meetings with Edit/Delete actions (FR-006)

#### Accessibility (WCAG 2.1 AA per FR-045 to FR-048)

- [X] T055 [P] [US1] Add keyboard navigation support to all interactive elements in scheduling components (Tab, Enter, Escape)
- [X] T056 [P] [US1] Add ARIA labels to DataTable columns in ParticipantList.vue (FR-046)
- [X] T057 [P] [US1] Add visible focus indicators (2px solid outline, 2px offset) to all buttons and form inputs in scheduling components
- [X] T058 [P] [US1] Verify color contrast ratios (4.5:1 text, 3:1 UI) for status badges and equity score display (FR-048)
- [X] T059 [P] [US1] Add prefers-reduced-motion support for any animations/transitions in scheduling components (FR-047)

#### Optional Tests for User Story 1

- [ ] T060 [P] [US1] Unit test for toLocalTime in tests/unit/scheduling/useTimezone.spec.js (verify UTC to timezone conversion)
- [ ] T061 [P] [US1] Unit test for calculateStatus in tests/unit/scheduling/useTimezone.spec.js (verify priority order: red → orange → green)
- [ ] T062 [P] [US1] Unit test for calculateScore in tests/unit/scheduling/useEquityScore.spec.js (verify all green = 100, all critical = 0, mixed scenarios)
- [ ] T063 [P] [US1] Integration test for createMeeting + addParticipant in tests/integration/scheduling/MeetingCRUD.spec.js (verify 50 participant limit, duration validation)
- [ ] T064 [P] [US1] E2E test for meeting creation flow in tests/e2e/scheduling/create-meeting.spec.js (create 3 participants, create meeting, verify timezone display)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can create participants, create meetings, add participants to meetings, and see color-coded timezone impact with equity scores.

---

## Phase 4: User Story 2 - Optimal Time Discovery (Priority: P2)

**Goal**: Enable users to visualize a 24-hour heatmap of equity scores and receive top 3 optimal time suggestions

**Independent Test**: Create a meeting with 4+ participants across Paris, New York, Sydney, Shanghai, generate heatmap, verify suggested times minimize red/critical participants and maximize equity score

### Implementation for User Story 2

#### Heatmap Composable

- [ ] T065 [P] [US2] Implement generateHeatmap function in src/features/scheduling/composables/useHeatmap.js that calculates equity score for all 24 hours of selected date
- [ ] T066 [P] [US2] Add memoization/caching to generateHeatmap in src/features/scheduling/composables/useHeatmap.js to avoid redundant calculations (cache key: date + participant list)
- [ ] T067 [P] [US2] Add getTopSuggestions function in src/features/scheduling/composables/useHeatmap.js that sorts heatmap by equity score and returns top 3 slots with breakdown

#### Pinia Store Updates

- [ ] T068 [US2] Add heatmapData computed property in src/features/scheduling/store.js that calls generateHeatmap for current meeting date
- [ ] T069 [US2] Add topSuggestions computed property in src/features/scheduling/store.js using getTopSuggestions on heatmapData

#### UI Components

- [ ] T070 [P] [US2] Create TimeHeatmap.vue component in src/features/scheduling/components/ using PrimeVue Chart or custom visualization with 24 hour slots
- [ ] T071 [P] [US2] Add color gradient to TimeHeatmap.vue cells based on equity score (high = green, medium = orange, low = red)
- [ ] T072 [P] [US2] Add click handler to TimeHeatmap.vue cells: clicking hour updates proposed_time in meeting (FR-030)
- [ ] T073 [P] [US2] Create OptimalTimeSuggestions.vue component in src/features/scheduling/components/ displaying top 3 suggestions with equity score, time, breakdown, and "Select This Time" button (FR-029)
- [ ] T074 [P] [US2] Add one-click selection in OptimalTimeSuggestions.vue: clicking button updates proposed_time and refreshes participant statuses

#### View Integration

- [ ] T075 [US2] Add TimeHeatmap.vue to MeetingDetail.vue below EquityScoreCard
- [ ] T076 [US2] Add OptimalTimeSuggestions.vue to MeetingDetail.vue below TimeHeatmap
- [ ] T077 [US2] Add loading indicator in MeetingDetail.vue while heatmap generates (target <5s for 20 participants per SC-003)

#### Accessibility

- [ ] T078 [P] [US2] Add keyboard navigation to heatmap cells (arrow keys to navigate, Enter to select hour)
- [ ] T079 [P] [US2] Add ARIA labels to heatmap cells announcing equity score and hour
- [ ] T080 [P] [US2] Add screen reader announcement when top suggestions update (aria-live="polite")

#### Optional Tests for User Story 2

- [ ] T081 [P] [US2] Unit test for generateHeatmap in tests/unit/scheduling/useHeatmap.spec.js (verify 24 slots, correct equity scores)
- [ ] T082 [P] [US2] Unit test for getTopSuggestions in tests/unit/scheduling/useHeatmap.spec.js (verify top 3 sorted by score)
- [ ] T083 [P] [US2] Integration test for heatmap interaction in tests/integration/scheduling/HeatmapInteraction.spec.js (click cell, verify time updates)
- [ ] T084 [P] [US2] E2E test for optimal time discovery in tests/e2e/scheduling/optimal-time.spec.js (generate heatmap, select suggestion, verify participant statuses)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can now discover optimal times using the heatmap visualization in addition to manually checking timezone impact.

---

## Phase 5: User Story 3 - Critical Event Alerts (Priority: P3)

**Goal**: Automatically warn users when proposed meeting time conflicts with national holidays or non-standard weekends

**Independent Test**: Select May 25th (US Memorial Day) as meeting date with US participant, verify critical alert displays and participant status changes to critical red with "National Holiday: Memorial Day" message

### Implementation for User Story 3

#### Holiday API Integration

- [ ] T085 [P] [US3] Implement fetchHolidays function in src/features/scheduling/composables/useHolidays.js to call Nager.Date API (https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode})
- [ ] T086 [P] [US3] Implement retryWithBackoff function in src/features/scheduling/composables/useHolidays.js with 3 attempts, exponential backoff (1s, 2s, 4s) per FR-036
- [ ] T087 [P] [US3] Add cache check in fetchHolidays to query holiday_cache table first, only fetch from API if cache older than 7 days per FR-034
- [ ] T088 [P] [US3] Add cache upsert in fetchHolidays to store holidays_json in holiday_cache table after successful API call
- [ ] T089 [P] [US3] Add graceful degradation in fetchHolidays: if API fails and cache stale, return empty array and set error flag per FR-035
- [ ] T090 [P] [US3] Add batch pre-fetching in fetchHolidays: fetch current year + next year on first meeting creation to populate cache

#### Status Calculation Updates

- [ ] T091 [US3] Update calculateStatus function in src/features/scheduling/composables/useTimezone.js to check holidays array first (priority #1 per FR-021)
- [ ] T092 [US3] Add isHoliday check in calculateStatus: if meeting date matches holiday.date, return { status: 'critical', reason: 'National Holiday: ' + holiday.localName }
- [ ] T093 [US3] Add isWorkingDay check in calculateStatus: if day not in countryConfig.work_days array, return { status: 'critical', reason: 'Non-working day' }
- [ ] T094 [US3] Update participantsWithStatus computed in src/features/scheduling/store.js to pass holidays array to calculateStatus (fetch holidays for each participant's country)

#### UI Components

- [ ] T095 [P] [US3] Create HolidayAlert.vue component in src/features/scheduling/components/ using PrimeVue Message component with severity="error"
- [ ] T096 [P] [US3] Add holiday detection logic in HolidayAlert.vue: display alert if any participant has critical status with holiday reason (FR-044)
- [ ] T097 [P] [US3] Add icon (exclamation triangle) to critical status badges in ParticipantList.vue
- [ ] T098 [P] [US3] Add status_reason display in ParticipantList.vue as tooltip or secondary text (e.g., "National Holiday: Memorial Day")

#### View Integration

- [ ] T099 [US3] Add HolidayAlert.vue to MeetingDetail.vue above ParticipantList (prominent placement for critical alerts)
- [ ] T100 [US3] Add API failure notification in MeetingDetail.vue if holiday fetch fails and cache unavailable (FR-035 graceful degradation message)

#### DST Warning (Edge Case FR-074)

- [ ] T101 [P] [US3] Add DST detection in MeetingDetail.vue: check if proposed_time falls within DST transition period (use date-fns-tz zonedTimeToUtc edge cases)
- [ ] T102 [P] [US3] Display informative note in MeetingDetail.vue if DST transition detected: "Note: Daylight Saving Time change occurs on this date"

#### Accessibility

- [ ] T103 [P] [US3] Add role="alert" to HolidayAlert.vue for immediate screen reader announcement
- [ ] T104 [P] [US3] Add aria-live="assertive" to critical status changes in ParticipantList.vue

#### Optional Tests for User Story 3

- [ ] T105 [P] [US3] Unit test for fetchHolidays in tests/unit/scheduling/useHolidays.spec.js (verify cache check, API call, retry logic)
- [ ] T106 [P] [US3] Unit test for isHoliday check in tests/unit/scheduling/useTimezone.spec.js (verify date match, critical status)
- [ ] T107 [P] [US3] Integration test for holiday detection in tests/integration/scheduling/HolidayDetection.spec.js (mock API, verify critical status for US Memorial Day)
- [ ] T108 [P] [US3] E2E test for holiday alert in tests/e2e/scheduling/holiday-alert.spec.js (select holiday date, verify alert displays)

**Checkpoint**: All three user stories (US1, US2, US3) should now be independently functional. Users get automatic holiday warnings and non-working day detection in addition to timezone checking and optimal time discovery.

---

## Phase 6: User Story 4 - Custom Working Hours (Priority: P4)

**Goal**: Allow users to customize green/orange working hour ranges per country for more accurate equity scoring

**Independent Test**: Create custom country configuration for Spain (10:00-18:00 green hours), add Spanish participant, verify their status uses custom hours instead of default 9:00-17:00

### Implementation for User Story 4

#### Pinia Store Actions for Country Configurations

- [ ] T109 [P] [US4] Implement fetchCountryConfigurations action in src/features/scheduling/store.js with Supabase select from country_configurations table
- [ ] T110 [P] [US4] Implement createCountryConfiguration action in src/features/scheduling/store.js with Supabase insert (unique constraint on user_id + country_code per FR-040)
- [ ] T111 [P] [US4] Implement updateCountryConfiguration action in src/features/scheduling/store.js with Supabase update to country_configurations table
- [ ] T112 [P] [US4] Implement deleteCountryConfiguration action in src/features/scheduling/store.js with Supabase delete (reverts to defaults per FR-041)
- [ ] T113 [US4] Add getCountryConfig helper function in src/features/scheduling/store.js that checks for custom config, falls back to DEFAULT_CONFIG (9:00-17:00 green, 8:00-9:00 & 17:00-18:00 orange, work_days [1,2,3,4,5])
- [ ] T114 [US4] Update participantsWithStatus computed in src/features/scheduling/store.js to use getCountryConfig for each participant's country instead of hard-coded defaults

#### UI Components

- [ ] T115 [P] [US4] Create CountryConfigForm.vue component in src/features/scheduling/components/ with fields: country (dropdown), green_start (time input), green_end (time input), orange_morning_start, orange_morning_end, orange_evening_start, orange_evening_end, work_days (multi-select: Mon-Sun)
- [ ] T116 [P] [US4] Add validation in CountryConfigForm.vue: green_start < green_end, orange ranges don't overlap green range, work_days contains valid integers 1-7
- [ ] T117 [P] [US4] Create CountryConfigList.vue component in src/features/scheduling/components/ displaying all custom configs with Edit and Delete buttons
- [ ] T118 [P] [US4] Add confirmation dialog in CountryConfigList.vue before deleting config: "Are you sure? Participants from [country] will revert to default working hours."

#### Views

- [ ] T119 [US4] Create CountryConfigManagement.vue view in src/features/scheduling/views/ with CountryConfigForm and CountryConfigList
- [ ] T120 [US4] Add route for /scheduling/config in src/router/index.js pointing to CountryConfigManagement.vue
- [ ] T121 [US4] Add "Settings" or "Configure Working Hours" button in scheduling layout to navigate to /scheduling/config

#### Accessibility

- [ ] T122 [P] [US4] Add keyboard navigation to CountryConfigForm time inputs and work_days multi-select
- [ ] T123 [P] [US4] Add ARIA labels to all form fields in CountryConfigForm.vue
- [ ] T124 [P] [US4] Add screen reader announcement when custom config saved: "Custom working hours saved for [country]"

#### Optional Tests for User Story 4

- [ ] T125 [P] [US4] Unit test for getCountryConfig in tests/unit/scheduling/store.spec.js (verify custom config used if exists, defaults otherwise)
- [ ] T126 [P] [US4] Integration test for country config CRUD in tests/integration/scheduling/CountryConfigCRUD.spec.js (create, read, update, delete)
- [ ] T127 [P] [US4] E2E test for custom hours in tests/e2e/scheduling/custom-hours.spec.js (create config for Spain 10-18, add Spanish participant, verify status uses custom hours)

**Checkpoint**: All four user stories are now complete and independently functional. Users have full control over timezone checking (US1), optimal time discovery (US2), holiday alerts (US3), and custom working hours (US4).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

- [ ] T128 [P] Add loading states to all async operations in scheduling store actions (show spinners during API calls)
- [ ] T129 [P] Add error handling to all Supabase operations with user-friendly error messages (never show raw errors per CLAUDE.md)
- [ ] T130 [P] Add optimistic updates for meeting time changes (update UI immediately, rollback on failure)
- [ ] T131 [P] Implement virtual scrolling in ParticipantList.vue if participant count > 100 (performance optimization per CLAUDE.md)
- [ ] T132 [P] Add debouncing (300ms) to heatmap regeneration on participant changes (avoid excessive recalculations)
- [ ] T133 [P] Verify all components are <300 lines per constitution Principle V (refactor if needed)
- [ ] T134 Run full accessibility audit using axe DevTools on all scheduling views
- [ ] T135 Test keyboard navigation (Tab, Enter, Escape) through entire scheduling workflow
- [ ] T136 Test with NVDA or VoiceOver screen reader on all scheduling views
- [ ] T137 Verify color contrast ratios with WebAIM Contrast Checker on all status badges and UI elements
- [ ] T138 Test with prefers-reduced-motion enabled (verify animations respect user preference)
- [ ] T139 Verify touch targets are ≥44×44px on mobile devices (test on actual mobile or Chrome DevTools)
- [ ] T140 Add performance monitoring: log equity calculation time, heatmap generation time (verify <2s and <5s targets per SC-002, SC-003)
- [ ] T141 Test with 50 participants (max limit) to verify performance is acceptable and validation error displays correctly
- [ ] T142 Test timezone conversion accuracy with DST transitions (e.g., spring forward, fall back dates)
- [ ] T143 Test past meeting validation (verify warning displays when attempting to save past timestamp per edge case)
- [ ] T144 Add JSDoc comments to complex functions (equity scoring algorithm, heatmap generation, status calculation)
- [ ] T145 Run quickstart.md validation: follow setup guide on fresh clone, verify all examples work
- [ ] T146 Code cleanup: remove console.logs, unused imports, commented code
- [ ] T147 Update CLAUDE.md with scheduling feature documentation (if needed based on new patterns)
- [ ] T148 Conduct usability testing with 10 users to validate SC-001 (view timezone impact within 10s), SC-006 (complete workflow in <3 min), SC-007 (90% identify optimal time without instructions), SC-012 (measure scheduling error reduction)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion - No dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion - No dependencies on other stories (can run in parallel with US1)
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion - Extends US1 (calculateStatus function) but can be developed independently
- **User Story 4 (Phase 6)**: Depends on Foundational phase completion - Extends US1 (getCountryConfig) but can be developed independently
- **Polish (Phase 7)**: Depends on desired user stories being complete (minimally US1 for MVP)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - ✅ INDEPENDENT
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - ✅ INDEPENDENT (uses equity score from US1 but doesn't modify US1 code)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - ⚠️ EXTENDS US1 (modifies calculateStatus in useTimezone.js)
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - ⚠️ EXTENDS US1 (modifies getCountryConfig in store.js)

**Recommendation**: Implement sequentially in priority order (P1→P2→P3→P4) to avoid merge conflicts when extending US1 functions. However, US2 can be developed in parallel with US1 as it only reads from shared composables.

### Within Each User Story

- Composables before Pinia store (store uses composables)
- Pinia store actions before components (components call store)
- Components before views (views compose components)
- Views before routes (routes reference views)
- Core implementation before accessibility enhancements
- Implementation before optional tests

### Parallel Opportunities

**Setup Phase** (all [P] tasks can run together):
- T002 (create feature dirs), T003 (create test dirs), T004 (add routes)

**Foundational Phase** (all [P] tasks within groups can run together):
- T006-T010 (all CREATE TABLE statements - different tables)
- T015-T018 (all composable skeletons - different files)
- T020-T021 (all utility functions - same file but independent)

**User Story 1** (all [P] tasks within groups can run together):
- T022-T027 (composable implementations - different files)
- T028-T037 (store actions - same file but independent functions)
- T040-T048 (UI components - different files)
- T049-T051 (views - different files)
- T055-T059 (accessibility tasks - different components)
- T060-T064 (optional tests - different files)

**User Story 2** (all [P] tasks within groups can run together):
- T065-T067 (heatmap composable - same file but independent functions)
- T070-T074 (UI components - different files)
- T078-T080 (accessibility - different components)
- T081-T084 (optional tests - different files)

**User Story 3** (all [P] tasks within groups can run together):
- T085-T090 (holiday API integration - same file but independent functions)
- T095-T098 (UI components - different files)
- T101-T102 (DST warning - same view but independent logic)
- T103-T104 (accessibility - different components)
- T105-T108 (optional tests - different files)

**User Story 4** (all [P] tasks within groups can run together):
- T109-T112 (store actions - same file but independent functions)
- T115-T118 (UI components - different files)
- T122-T124 (accessibility - different components)
- T125-T127 (optional tests - different files)

**Polish Phase** (most [P] tasks can run together):
- T128-T133 (performance and code quality - different concerns)
- T140-T143 (testing - independent scenarios)

---

## Parallel Example: User Story 1 Models & Components

```bash
# After Foundational phase completes, launch all US1 composable implementations together:
Task: "Implement toLocalTime function in src/features/scheduling/composables/useTimezone.js" (T022)
Task: "Implement toUTC function in src/features/scheduling/composables/useTimezone.js" (T023)
Task: "Implement formatWithTimezone function in src/features/scheduling/composables/useTimezone.js" (T024)
Task: "Implement calculateStatus function in src/features/scheduling/composables/useTimezone.js" (T025)
Task: "Implement calculateScore function in src/features/scheduling/composables/useEquityScore.js" (T026)
Task: "Implement getBreakdown function in src/features/scheduling/composables/useEquityScore.js" (T027)

# Once composables done, launch all US1 UI components together:
Task: "Create ParticipantForm.vue in src/features/scheduling/components/" (T040)
Task: "Create ParticipantList.vue in src/features/scheduling/components/" (T043)
Task: "Create MeetingForm.vue in src/features/scheduling/components/" (T045)
Task: "Create TimezoneGrid.vue in src/features/scheduling/components/" (T047)
Task: "Create EquityScoreCard.vue in src/features/scheduling/components/" (T048)
```

---

## Parallel Example: Multiple User Stories (Team Strategy)

```bash
# After Foundational phase completes:
# Developer A works on US1 (Quick Timezone Check) - T022 through T059
# Developer B works on US2 (Optimal Time Discovery) - T065 through T084
# Developer C works on US3 (Critical Event Alerts) - T085 through T108

# Note: US3 extends US1's calculateStatus, so coordinate merge or wait for US1 to complete T025 first
```

---

## Implementation Strategy

### MVP First (User Story 1 Only - Fastest Path to Value)

1. ✅ Complete Phase 1: Setup (T001-T004) - ~15 minutes
2. ✅ Complete Phase 2: Foundational (T005-T021) - ~2-3 hours (database migration + composable skeletons + store skeleton)
3. ✅ Complete Phase 3: User Story 1 (T022-T059, skip optional tests T060-T064) - ~4-6 hours
4. **STOP and VALIDATE**: Manual test user story 1 independently
   - Create 3+ participants in different timezones
   - Create meeting and add participants
   - Verify color-coded status displays correctly
   - Verify equity score calculates correctly
   - Test time adjustment updates all statuses instantly
5. Deploy/demo MVP (users can schedule international meetings with timezone awareness)

**Total MVP Time Estimate**: ~7-10 hours for functional scheduling assistant with core value proposition

### Incremental Delivery (Add Value Progressively)

1. Complete Setup + Foundational → Database and composables ready
2. Add US1 → Test independently → Deploy/Demo (MVP: timezone checking)
3. Add US2 → Test independently → Deploy/Demo (enhancement: optimal time discovery)
4. Add US3 → Test independently → Deploy/Demo (enhancement: holiday alerts)
5. Add US4 → Test independently → Deploy/Demo (power feature: custom working hours)
6. Polish phase → Final quality pass → Production release

Each story adds value without breaking previous functionality.

### Parallel Team Strategy (Multiple Developers)

With 2-3 developers:

1. **Together**: Complete Setup (Phase 1) + Foundational (Phase 2)
2. **Once Foundational done**:
   - Developer A: User Story 1 (T022-T059)
   - Developer B: User Story 2 (T065-T084) in parallel
   - Developer C: Database migration testing and documentation
3. **After US1 complete**:
   - Developer A: User Story 3 (T085-T108) - extends US1
   - Developer B: User Story 4 (T109-T127) - extends US1
4. **Together**: Polish phase (T128-T147)

Stories integrate independently with minimal merge conflicts.

---

## Task Summary

**Total Tasks**: 150 tasks
- **Setup**: 4 tasks (T001-T004)
- **Foundational**: 18 tasks (T005-T021a) - ⚠️ BLOCKS all user stories
- **User Story 1**: 45 tasks (T022-T064, includes 5 optional tests + T054a for MeetingList)
- **User Story 2**: 20 tasks (T065-T084, includes 4 optional tests)
- **User Story 3**: 24 tasks (T085-T108, includes 4 optional tests)
- **User Story 4**: 19 tasks (T109-T127, includes 3 optional tests)
- **Polish**: 21 tasks (T128-T148, includes usability testing)

**Parallel Opportunities**: 77 tasks marked [P] can run in parallel within their phase/story (includes T021a, updated T043)

**MVP Scope (Recommended)**: Setup + Foundational + User Story 1 = 67 tasks (41 tasks if skipping optional tests T060-T064)

**Independent Test Criteria**:
- **US1**: Create meeting with 3+ participants, verify color-coded timezone display
- **US2**: Generate heatmap with 4+ participants, verify top 3 suggestions
- **US3**: Select US Memorial Day, verify critical alert displays
- **US4**: Create custom Spain config (10-18), verify Spanish participant uses custom hours

**Format Validation**: ✅ All tasks follow checklist format with checkbox, Task ID, [P] marker (if parallel), [Story] label (for user story phases), and file paths

**Dependencies Validated**: ✅ All user stories can be independently tested after Foundational phase completion

---

## Notes

- [P] tasks = different files or independent functions, no dependencies within same phase
- [Story] label (US1, US2, US3, US4) maps task to specific user story for traceability
- Each user story is independently completable and testable after Foundational phase
- Optional test tasks (T060-T064, T081-T084, T105-T108, T125-T127) can be skipped for faster MVP delivery
- Database migration (T005-T014) must complete before any data operations
- Composables (T015-T018, T022-T027) must exist before store actions (T028-T039)
- Components (T040-T048) can be built in parallel once composables and store are ready
- Accessibility tasks (T055-T059, T078-T080, T103-T104, T122-T124) can run in parallel per user story
- Stop at any checkpoint to validate story independently before proceeding
- Commit after each task or logical group (e.g., all composable implementations together)
- Constitution compliance verified: all components will be <300 lines (enforced in T133), WCAG 2.1 AA (T134-T139), RLS on all tables (T006-T010)
