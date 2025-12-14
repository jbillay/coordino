# Feature Specification: Scheduling Assistant

**Feature Branch**: `001-scheduling-assistant`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "Phase 4: Scheduling Assistant - International meeting scheduler with timezone equity scoring, optimal time discovery, holiday detection, and custom working hours configuration"

## Clarifications

### Session 2025-12-10

- Q: How long should meeting data be retained? Should old meetings auto-delete or archive? → A: Permanent retention - meetings never auto-delete, users manually delete when needed
- Q: Can meetings be shared or collaboratively edited by multiple users? → A: Single-owner only - each meeting belongs to one user, no sharing or collaboration features
- Q: What are the minimum and maximum allowed meeting durations? → A: Practical range: 15 minutes to 8 hours
- Q: What is the maximum number of participants allowed per meeting? → A: Hard limit: 50 participants with validation error if exceeded
- Q: Should timezone display show abbreviation (EST), IANA identifier (America/New_York), or both? → A: Both formats (e.g., "EST (America/New_York)")

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Timezone Check (Priority: P1) 🎯 MVP

As a meeting organizer coordinating with international participants, I want to instantly see how a proposed meeting time affects each participant across timezones, so that I can make fair scheduling decisions without manual timezone calculations.

**Why this priority**: This is the core value proposition - eliminating the pain of manual timezone math and providing immediate visual feedback about scheduling conflicts. Without this, users cannot use the tool at all.

**Independent Test**: Can be fully tested by creating a meeting with 3+ participants in different timezones, selecting a time, and verifying that each participant's local time and comfort status (color-coded) is displayed correctly.

**Acceptance Scenarios**:

1. **Given** I am logged in and have created at least 3 participants in different timezones (e.g., Paris CET, New York EST, Tokyo JST), **When** I create a new meeting and select 5:00 PM as the proposed time in my timezone, **Then** the system displays each participant's local time with a color-coded status indicator (green for optimal hours, orange for acceptable, red for problematic).

2. **Given** I have a meeting with participants in Paris (CET), New York (EST), and Sydney (AEDT), **When** I select 10:00 AM CET as the meeting time, **Then** I see Paris at 10:00 AM (green), New York at 4:00 AM (red), and Sydney at 8:00 PM (orange) with their working hour ranges displayed.

3. **Given** I am viewing a meeting's timezone impact, **When** I change the proposed time from 2:00 PM to 6:00 PM, **Then** all participant local times and color statuses update instantly without page refresh.

4. **Given** I have selected a meeting time, **When** I view the participant list, **Then** I see each participant's name, location, local time, timezone offset, color status, and working hour window in an easy-to-scan table format.

---

### User Story 2 - Optimal Time Discovery (Priority: P2)

As a meeting organizer trying to find the fairest time for all participants, I want to visualize equity scores across a 24-hour period and receive optimal time suggestions, so that I can quickly identify the best meeting times without trial-and-error.

**Why this priority**: This transforms the tool from a passive checker into an active assistant. Users don't have to guess - the system tells them the optimal times. This is the "smart" part of the scheduling assistant.

**Independent Test**: Can be tested by creating a meeting with participants across 3+ timezones, generating the 24-hour heatmap, and verifying that suggested times minimize the number of red/critical participants and maximize the equity score.

**Acceptance Scenarios**:

1. **Given** I have a meeting with 4 participants across Paris, New York, Sydney, and Shanghai, **When** I request optimal time suggestions, **Then** the system displays a 24-hour heatmap showing equity scores for each hour and provides the top 3 time slots ranked by fairness score.

2. **Given** I am viewing the 24-hour heatmap, **When** I click on a time slot in the heatmap, **Then** the proposed meeting time updates to that hour and all participant statuses refresh to reflect the new time.

3. **Given** I am viewing optimal time suggestions, **When** the system presents the top 3 suggestions, **Then** each suggestion shows the equity score, time in my timezone, participant status breakdown (count of green/orange/red), and allows me to select that time with one click.

4. **Given** I have participants in timezones with minimal overlap of working hours, **When** I view the heatmap, **Then** I can clearly see "sweet spot" time windows highlighted in green where the equity score is highest, even if not perfect.

---

### User Story 3 - Critical Event Alerts (Priority: P3)

As a meeting organizer, I want the system to automatically warn me when a proposed time conflicts with national holidays or non-standard weekends, so that I avoid scheduling meetings when key participants are unavailable.

**Why this priority**: This prevents embarrassing professional mistakes and demonstrates cultural awareness. It's valuable but not essential for the MVP since users could manually check calendars.

**Independent Test**: Can be tested by selecting a date that is a known national holiday for one participant's country, verifying the system displays a critical alert and changes that participant's status to red/critical.

**Acceptance Scenarios**:

1. **Given** I have a participant located in the United States, **When** I select May 25th (Memorial Day) as the meeting date, **Then** the system displays a critical alert icon for that participant, changes their status to red/critical, and shows "National Holiday: Memorial Day" in their status description.

2. **Given** I have a participant in a country with a Sunday-Thursday work week, **When** I select a Friday or Saturday as the meeting date, **Then** their status automatically changes to red with "Non-working day" indicated.

3. **Given** I am selecting a meeting date several months in the future, **When** I choose a date, **Then** the system checks for daylight saving time transitions and displays an informative note if the selected time falls during a DST change period.

4. **Given** the holiday API is temporarily unavailable, **When** I create or view a meeting, **Then** the system gracefully degrades by showing participants without holiday checks and displays a notification that holiday detection is temporarily unavailable.

---

### User Story 4 - Custom Working Hours (Priority: P4)

As a meeting organizer working with clients in specific countries with different cultural norms, I want to customize the working hour windows (green/orange ranges) per country, so that the equity scoring reflects actual working patterns rather than generic defaults.

**Why this priority**: This adds flexibility for power users and organizations with specific scheduling needs. Lower priority because the default 9-5 working hours work for most use cases.

**Independent Test**: Can be tested by creating a custom country configuration with specific green and orange hour ranges, adding a participant from that country, and verifying their status is calculated using the custom hours instead of defaults.

**Acceptance Scenarios**:

1. **Given** I am on the settings or configuration page, **When** I select a country (e.g., Spain) and modify its green working hours from 9:00-17:00 to 10:00-18:00, **Then** the custom configuration is saved and applied to all Spanish participants in future equity calculations.

2. **Given** I have created a custom configuration for France with green hours 10:00-18:00, **When** I create a meeting with French participants, **Then** their green/orange status windows reflect the custom hours rather than the default 9:00-17:00 range.

3. **Given** I have both default and custom country configurations, **When** I add a participant from a country without custom configuration, **Then** they use the default working hours (9:00-17:00 green, 8:00-9:00 and 17:00-18:00 orange).

4. **Given** I want to reset a custom country configuration, **When** I delete the custom configuration for a specific country, **Then** participants from that country revert to using default working hour ranges.

---

### Edge Cases

- **What happens when a participant's timezone is invalid or unrecognized?** The system displays an error message for that participant and prompts the user to select a valid IANA timezone from a dropdown list.

- **What happens when the proposed meeting time is exactly at midnight in a participant's timezone?** The system calculates the day boundary correctly and checks for holidays/weekends on the correct date.

- **What happens when two participants are in the same timezone but different countries?** Each participant is evaluated independently based on their country's holiday calendar and custom working hours if configured.

- **What happens when the meeting duration spans across a daylight saving time change?** The system displays a warning notification about the time change and recalculates local times accounting for the DST transition.

- **What happens when there are more than 20 participants?** The system processes all participants (up to the 50-participant hard limit) but may display a performance warning for large groups. Calculations should still complete within 5 seconds for groups up to 50 participants.

- **What happens when a user tries to schedule a meeting in the past?** The system allows viewing past times for reference but displays a validation warning when attempting to save a meeting with a past timestamp.

- **What happens when the holiday API fails or returns incomplete data?** The system uses cached holiday data if available (up to 7 days old), otherwise gracefully degrades by skipping holiday checks and notifying the user.

- **What happens when a country has multiple timezones?** The participant must specify the exact IANA timezone (e.g., "America/New_York" vs "America/Los_Angeles"), not just the country.

## Requirements *(mandatory)*

### Functional Requirements

#### Meeting Management

- **FR-001**: System MUST allow users to create meetings with a title, proposed date/time, duration, and notes.

- **FR-001a**: System MUST validate meeting duration is between 15 minutes and 8 hours (inclusive), rejecting values outside this range with a clear error message.

- **FR-002**: System MUST allow users to select meeting date and time using separate date and time input components with 15-minute time slot intervals.

- **FR-003**: System MUST allow users to edit existing meeting details including title, time, duration, and notes.

- **FR-004**: System MUST allow users to delete meetings they have created.

- **FR-005**: System MUST persist all meeting data in the database with Row Level Security ensuring users can only access their own meetings.

- **FR-006**: System MUST display a searchable, filterable list of all meetings created by the user (search by title, filter by date range and participant).

- **FR-006a**: System MUST retain all meeting data permanently unless explicitly deleted by the user (no automatic deletion or archiving based on age).

- **FR-006b**: System MUST enforce single-owner model where each meeting belongs to exactly one user with no sharing, transfer, or collaborative editing capabilities.

#### Participant Management

- **FR-007**: System MUST allow users to create participants with name, timezone (IANA format), country (ISO 3166-1), and optional notes.

- **FR-008**: System MUST validate that timezone input is a valid IANA timezone identifier (e.g., "Europe/Paris", "America/New_York").

- **FR-009**: System MUST validate that country input is a valid ISO 3166-1 alpha-2 country code (e.g., "FR", "US", "JP").

- **FR-010**: System MUST allow users to add multiple participants to a single meeting.

- **FR-010a**: System MUST enforce a maximum limit of 50 participants per meeting, displaying a validation error if the user attempts to add more.

- **FR-011**: System MUST allow users to remove participants from a meeting.

- **FR-012**: System MUST allow users to edit participant details (name, timezone, country, notes).

- **FR-013**: System MUST allow users to delete participants (with confirmation if they are assigned to existing meetings).

- **FR-014**: System MUST maintain a reusable list of participants that can be added to multiple meetings.

#### Timezone Conversion & Display

- **FR-015**: System MUST convert the proposed meeting time from the organizer's timezone to each participant's local timezone accurately.

- **FR-016**: System MUST account for Daylight Saving Time (DST) transitions when converting times.

- **FR-017**: System MUST display each participant's local time with both timezone abbreviation and IANA identifier in a clear, readable format (e.g., "2:00 PM EST (America/New_York)" or "14:00 CET (Europe/Paris)").

- **FR-018**: System MUST display the timezone offset for each participant (e.g., "UTC+1", "UTC-5").

- **FR-019**: System MUST update all participant local times instantly when the proposed meeting time is changed.

#### Color Status & Equity Scoring

- **FR-020**: System MUST calculate and display a color status for each participant: green (optimal working hours), orange (acceptable buffer hours), red (outside acceptable hours), or critical (holiday/non-working day).

- **FR-021**: System MUST determine color status using this priority order: (1) Check for holiday/non-working day → critical red, (2) Check if outside orange range → red, (3) Check if within orange range → orange, (4) Check if within green range → green.

- **FR-022**: System MUST use default working hours of 9:00-17:00 (green) and 8:00-9:00, 17:00-18:00 (orange) unless a custom country configuration exists.

- **FR-023**: System MUST calculate a Global Equity Score (0-100) based on participant statuses: green +10 points, orange +5 points, red -15 points, critical -50 points.

- **FR-024**: System MUST normalize the equity score using the formula: `score = (totalPoints / maxPossible) × 100` where maxPossible = number of participants × 10.

- **FR-025**: System MUST display the equity score prominently with a visual indicator (progress circle, gauge, or similar).

- **FR-026**: System MUST display a breakdown of participant distribution by status (count of green, orange, red, critical).

#### Optimal Time Discovery

- **FR-027**: System MUST generate a 24-hour heatmap showing equity scores for each hour of the selected date.

- **FR-028**: System MUST visually distinguish optimal time slots (high equity score) from poor time slots (low equity score) using color gradients or height indicators.

- **FR-029**: System MUST provide the top 3 optimal time suggestions ranked by equity score.

- **FR-030**: System MUST allow users to click on a heatmap cell or suggestion to update the proposed meeting time.

- **FR-031**: System MUST complete heatmap generation within 5 seconds (p95 latency) for meetings with up to 20 participants.

#### Holiday & Calendar Detection

- **FR-032**: System MUST integrate with a public holiday API to fetch national holidays for each participant's country.

- **FR-033**: System MUST automatically detect when a proposed meeting time falls on a national holiday for any participant and change their status to critical red.

- **FR-034**: System MUST cache holiday data locally for up to 7 days to reduce API calls and improve performance.

- **FR-035**: System MUST gracefully handle holiday API failures by using cached data if available, otherwise skipping holiday checks with user notification.

- **FR-036**: System MUST implement retry logic (3 attempts with exponential backoff) for failed holiday API requests.

- **FR-037**: System MUST support configurable work week patterns per country (e.g., Monday-Friday, Sunday-Thursday).

- **FR-038**: System MUST automatically mark participants as critical red if the meeting falls on their country's non-working day.

#### Custom Country Configuration

- **FR-039**: System MUST allow users to create custom country configurations specifying green hours, orange buffer hours, and work week patterns.

- **FR-040**: System MUST use custom country configurations in preference to default hours when calculating participant status.

- **FR-041**: System MUST allow users to reset custom configurations to revert to default hours.

- **FR-042**: System MUST support multiple users each having their own custom country configurations (data isolation via RLS).

#### User Interface

- **FR-043**: System MUST display all participant information in a table format showing name, location, local time, status (color-coded), and working hour window.

- **FR-044**: System MUST provide clear visual alerts (icons, badges, or warnings) when critical conflicts are detected (holidays, non-working days).

- **FR-045**: System MUST allow keyboard navigation for all interactive elements (date picker, time selector, heatmap, buttons).

- **FR-046**: System MUST provide ARIA labels and screen reader support for all components.

- **FR-047**: System MUST respect the `prefers-reduced-motion` setting for animations and transitions.

- **FR-048**: System MUST maintain color contrast ratios of at least 4.5:1 for text and 3:1 for UI components (WCAG 2.1 AA).

### Key Entities

- **Meeting**: Represents a proposed meeting with title, proposed date/time (stored in UTC), duration in minutes, optional notes, and associated participants. Belongs to exactly one user (organizer) with no sharing or transfer capabilities.

- **Participant**: Represents an attendee with name, IANA timezone identifier, ISO country code, and optional notes. Reusable across multiple meetings. Belongs to a single user.

- **Country Configuration**: Represents working hour settings for a specific country including green hour range (start/end times), orange buffer ranges (morning and evening), and work week pattern. Can be default (system-provided) or custom (user-created).

- **Meeting-Participant Association**: Links participants to meetings in a many-to-many relationship. A participant can be in multiple meetings, and a meeting can have multiple participants.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a meeting with 5 international participants and view color-coded timezone impact within 10 seconds of selecting a time.

- **SC-002**: Equity score calculations complete within 2 seconds for meetings with up to 20 participants.

- **SC-003**: 24-hour heatmap generation completes within 5 seconds for meetings with up to 20 participants.

- **SC-004**: Holiday detection correctly identifies at least 95% of major national holidays for the top 20 most common countries.

- **SC-005**: System handles holiday API failures gracefully with zero user-facing errors (uses cache or degrades gracefully).

- **SC-006**: Users can complete the entire workflow (create meeting, add participants, find optimal time) in under 3 minutes on first use.

- **SC-007**: 90% of users successfully identify the optimal meeting time using the heatmap visualization without instructions.

- **SC-008**: Timezone conversion accuracy is 100% for all IANA timezones including DST transitions.

- **SC-009**: System maintains WCAG 2.1 Level AA compliance with all accessibility features functioning correctly (keyboard navigation, screen reader support, color contrast).

- **SC-010**: Custom country configurations persist correctly and are applied to equity calculations with 100% accuracy.

- **SC-011**: System supports at least 50 concurrent users scheduling meetings without performance degradation.

- **SC-012**: Meeting creation reduces scheduling errors (meetings scheduled at inappropriate times) by at least 60% compared to manual timezone calculation.
