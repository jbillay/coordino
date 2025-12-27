# Tasks: User & Application Configuration

**Input**: Design documents from `/specs/001-user-config/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The specification explicitly requires 80% test coverage (FR Testing Strategy, SC-015, SC-016). All test tasks below are REQUIRED and follow test-first approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `src/`, `tests/` at repository root
- All paths follow Coordino's structure: `src/views/`, `src/components/`, `src/composables/`, `src/stores/`, `src/utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database migrations, and dependency installation

- [ ] T001 Install new NPM dependencies: vue-virtual-scroller@^2.0.0-beta.8, jszip@^3.10.1, papaparse@^5.4.1
- [ ] T002 Create Supabase migration file: supabase/migrations/YYYYMMDDHHMMSS_add_completed_tours_to_users_extended.sql
- [ ] T003 Apply database migration to add completed_tours TEXT[] column to users_extended table
- [ ] T004 Verify migration: Query users_extended schema to confirm completed_tours column exists with default '{}'
- [ ] T005 [P] Customize Supabase Auth email template for password reset (Dashboard > Authentication > Email Templates)
- [ ] T006 [P] Create src/components/settings/ directory for settings-specific components
- [ ] T007 [P] Create src/components/common/ subdirectories if not exist
- [ ] T008 [P] Create tests/unit/utils/, tests/unit/composables/ directories
- [ ] T009 [P] Create tests/integration/settings/, tests/integration/export/ directories
- [ ] T010 [P] Create tests/e2e/ directory if not exist

**Checkpoint**: Foundation ready - dependencies installed, database migrated, directories created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and composables that multiple user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Utilities (Required by multiple stories)

- [ ] T011 [P] Create src/utils/validation.js with validateEmail() and validatePassword() functions
- [ ] T012 [P] Create src/utils/sanitization.js with sanitizeContent() for user-generated content
- [ ] T013 Create tests/unit/utils/validation.test.js - test email/password validation (WRITE FIRST, ENSURE FAILS)
- [ ] T014 Create tests/unit/utils/sanitization.test.js - test content sanitization (WRITE FIRST, ENSURE FAILS)

### Router Configuration

- [ ] T015 Add /settings route to src/router/index.js with lazy-loaded SettingsView component

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Password Reset (Priority: P1) 🎯 MVP Candidate

**Goal**: Enable users to securely reset forgotten passwords via email link without contacting support

**Independent Test**: User clicks "Forgot Password" on login page, receives email within 2 minutes, clicks reset link, sets new password meeting strength requirements, logs in successfully with new credentials, and all existing sessions are invalidated

### Tests for User Story 1 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T016 [P] [US1] Create tests/unit/composables/usePasswordReset.test.js - test password reset flow state machine
- [ ] T017 [P] [US1] Create tests/e2e/password-reset.spec.js - test complete password reset journey (SC-001: <3 min completion)

### Implementation for User Story 1

- [ ] T018 [US1] Create src/composables/usePasswordReset.js - implement password reset flow (resetPassword, updatePassword, error handling)
- [ ] T019 [US1] Add "Forgot Password" link to login view (modify existing LoginView.vue)
- [ ] T020 [US1] Create src/views/ResetPasswordView.vue - password reset form with validation
- [ ] T021 [US1] Add /reset-password route to src/router/index.js
- [ ] T022 [US1] Integrate usePasswordReset composable in ResetPasswordView with email delivery and token verification
- [ ] T023 [US1] Add client-side password strength validation UI with real-time feedback
- [ ] T024 [US1] Implement session invalidation after password reset (modify src/stores/auth.js)
- [ ] T025 [US1] Add error handling for expired/invalid tokens with retry option

**Checkpoint**: Password reset fully functional - users can reset forgotten passwords independently (SC-001, SC-002)

---

## Phase 4: User Story 2 - Profile & Preferences Management (Priority: P1) 🎯 MVP Candidate

**Goal**: Enable users to update personal information (name, email, password) and preferences (timezone, theme, date format) with real-time synchronization

**Independent Test**: User navigates to Settings, updates display name/timezone/theme, saves changes, and sees updates reflected throughout application within 5 seconds

### Tests for User Story 2 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T026 [P] [US2] Create tests/integration/settings/profile-update.test.js - test profile update + store + RLS policy
- [ ] T027 [P] [US2] Create tests/integration/settings/theme-persistence.test.js - test theme toggle + localStorage persistence
- [ ] T028 [P] [US2] Create tests/e2e/profile-update.spec.js - test profile update journey (SC-003: <5 sec reflection)

### Implementation for User Story 2

- [ ] T029 [P] [US2] Create src/views/SettingsView.vue - main settings container with tab navigation (Profile, Preferences, Account, Data Export)
- [ ] T030 [P] [US2] Create src/components/settings/ProfileSettings.vue - profile editing (display name, email change with re-auth)
- [ ] T031 [P] [US2] Create src/components/settings/PreferencesSettings.vue - preferences editing (timezone, theme, date format)
- [ ] T032 [US2] Create src/utils/timezone.js - timezone conversion and validation utilities
- [ ] T033 [US2] Create tests/unit/utils/timezone.test.js - test timezone conversion (WRITE FIRST, ENSURE FAILS)
- [ ] T034 [US2] Extend src/stores/auth.js with updateProfile(), changeEmail(), changePassword() methods
- [ ] T035 [US2] Extend src/stores/config.js to load/save completed_tours array
- [ ] T036 [US2] Implement real-time profile sync (Supabase realtime subscription in config store)
- [ ] T037 [US2] Implement localStorage persistence for theme preference
- [ ] T038 [US2] Add validation for email format, timezone (IANA), and theme enum
- [ ] T039 [US2] Add re-authentication flow for email/password changes (current password required)

**Checkpoint**: Profile & preferences fully functional - users can customize their account and preferences (SC-003, FR-006 to FR-009)

---

## Phase 5: User Story 5 - Accessibility Compliance (Priority: P1) 🎯 MVP Candidate

**Goal**: Ensure WCAG 2.1 Level AA compliance throughout application for users with disabilities and assistive technology users

**Independent Test**: Screen reader user navigates entire application with keyboard only, completes key tasks (create task, write note, schedule meeting) with proper audio feedback and visible focus indicators

### Tests for User Story 5 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T040 [US5] Create automated accessibility test script using axe-core in tests/e2e/accessibility.spec.js
- [ ] T041 [US5] Document manual keyboard navigation test checklist in tests/e2e/accessibility-manual.md

### Implementation for User Story 5

- [ ] T042 [P] [US5] Add ARIA labels to all form inputs in ProfileSettings.vue (FR-020)
- [ ] T043 [P] [US5] Add ARIA labels to all form inputs in PreferencesSettings.vue (FR-020)
- [ ] T044 [P] [US5] Add autocomplete attributes to email/password fields (FR-021)
- [ ] T045 [P] [US5] Ensure logical tab order in SettingsView tab navigation (FR-022)
- [ ] T046 [P] [US5] Add visible focus indicators (2px solid outline, 2px offset) to all interactive elements (FR-023)
- [ ] T047 [US5] Verify color contrast ratios in dark mode meet WCAG 2.1 AA (4.5:1 normal, 3:1 large) (FR-027)
- [ ] T048 [US5] Add ARIA live region for search results in NotesView (FR-025)
- [ ] T049 [US5] Implement arrow key navigation for NoteList component (FR-026)
- [ ] T050 [US5] Implement focus trap for mobile menu (FR-024)
- [ ] T051 [US5] Ensure touch targets are minimum 44x44 pixels on mobile (FR-028)
- [ ] T052 [US5] Run axe-core automated accessibility scan and fix all critical violations (SC-006)

**Checkpoint**: WCAG 2.1 AA compliance achieved - application fully accessible (SC-006, SC-007, FR-020 to FR-028)

---

## Phase 6: User Story 3 - Account Deletion (Priority: P2)

**Goal**: Enable users to permanently delete their account and all associated data with multi-step confirmation

**Independent Test**: User navigates to Settings > Account Management, clicks "Delete Account", types "DELETE" in confirmation field, completes deletion, gets logged out, redirected to login, and cannot log in with previous credentials

### Tests for User Story 3 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T053 [P] [US3] Create tests/integration/settings/account-deletion.test.js - test deletion flow + confirmation
- [ ] T054 [P] [US3] Create tests/e2e/account-deletion.spec.js - test account deletion workflow (SC-004: <10 sec completion)

### Implementation for User Story 3

- [ ] T055 [P] [US3] Create src/components/common/ConfirmDialog.vue - reusable confirmation dialog component
- [ ] T056 [US3] Create src/components/settings/AccountManagement.vue - password change and account deletion interface
- [ ] T057 [US3] Implement multi-step confirmation (warning dialog → type "DELETE" → final confirm) (FR-011)
- [ ] T058 [US3] Add deleteAccount() method to src/stores/auth.js with Supabase Auth admin.deleteUser()
- [ ] T059 [US3] Verify CASCADE delete removes all user data (tasks, notes, topics, meetings, users_extended) (FR-012)
- [ ] T060 [US3] Implement logout and redirect to login page after successful deletion (FR-013)
- [ ] T061 [US3] Add error handling for deletion failures with retry option

**Checkpoint**: Account deletion fully functional - users can permanently delete accounts with data removal verification (SC-004, FR-010 to FR-013)

---

## Phase 7: User Story 4 - Data Export (Priority: P2)

**Goal**: Enable users to export all their data in dual formats (JSON for backup, CSV for analysis) in a downloadable ZIP archive

**Independent Test**: User clicks "Export All My Data" in Settings, receives .zip download within 30 seconds containing JSON and CSV files for all entity types (tasks, notes, topics, meetings)

### Tests for User Story 4 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T062 [P] [US4] Create tests/unit/utils/export.test.js - test JSON/CSV formatting and flattening logic
- [ ] T063 [P] [US4] Create tests/unit/composables/useDataExport.test.js - test export orchestration
- [ ] T064 [P] [US4] Create tests/integration/export/data-export-flow.test.js - test export trigger + archive generation
- [ ] T065 [P] [US4] Create tests/e2e/data-export.spec.js - test data export end-to-end (SC-005: <30 sec for 1000 records)

### Implementation for User Story 4

- [ ] T066 [P] [US4] Create src/utils/export.js - JSON/CSV formatting, flattening, and ZIP archive generation
- [ ] T067 [P] [US4] Create src/composables/useDataExport.js - export orchestration with progress tracking
- [ ] T068 [P] [US4] Create src/stores/export.js - data export state management
- [ ] T069 [US4] Create src/components/settings/DataExport.vue - export interface with loading state
- [ ] T070 [US4] Implement fetchAllData() to query all user entities (tasks, notes, topics, locations, meetings, categories, statuses)
- [ ] T071 [US4] Implement generateJSON() with metadata (exportedAt, version, schema) (FR-016)
- [ ] T072 [US4] Implement generateCSV() for each entity type with Papa.unparse (FR-017)
- [ ] T073 [US4] Implement createZipArchive() with JSZip (json/, csv/, README.txt structure) (FR-015)
- [ ] T074 [US4] Add chunking for large datasets (>1000 records) with progress indicator (FR-019)
- [ ] T075 [US4] Implement download trigger with file-saver.saveAs()
- [ ] T076 [US4] Add error handling with retry logic and user-friendly messages

**Checkpoint**: Data export fully functional - users can download all data in dual formats (SC-005, FR-014 to FR-019)

---

## Phase 8: User Story 6 - Performance Optimization (Priority: P2)

**Goal**: Ensure application remains fast and responsive even with large datasets (500+ tasks, 300+ notes) through virtual scrolling and optimizations

**Independent Test**: User with 500+ tasks and 300+ notes scrolls smoothly at 60fps, searches return results within 1 second, and initial page load is under 3 seconds

### Tests for User Story 6 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T077 [US6] Create performance benchmark test in tests/e2e/performance.spec.js - verify 60fps scrolling with 1000+ items

### Implementation for User Story 6

- [ ] T078 [US6] Install and configure vue-virtual-scroller (already done in T001, verify integration)
- [ ] T079 [P] [US6] Implement virtual scrolling in TasksView with RecycleScroller for >100 tasks (FR-029)
- [ ] T080 [P] [US6] Implement virtual scrolling in NotesView with RecycleScroller for >100 notes (FR-030)
- [ ] T081 [US6] Add data volume warning logic in task/note stores (90% threshold at 4,500 tasks, 2,700 notes) (FR-035, FR-036)
- [ ] T082 [US6] Create warning banner component for data volume limits with export recommendation
- [ ] T083 [US6] Memoize expensive computations in task/note components (FR-031)
- [ ] T084 [US6] Implement batch updates for topic reordering (FR-032)
- [ ] T085 [US6] Optimize real-time subscriptions to avoid N+1 queries (FR-033)
- [ ] T086 [US6] Verify time-to-interactive <3 seconds with Lighthouse audit (FR-034, SC-008, SC-009)

**Checkpoint**: Performance optimizations complete - smooth 60fps scrolling with 1000+ items (SC-008, SC-009, FR-029 to FR-037)

---

## Phase 9: User Story 7 - Session Management (Priority: P2)

**Goal**: Implement secure session management with automatic token refresh, 30-minute inactivity timeout with 2-minute warning, and "Remember Me" functionality

**Independent Test**: User remains inactive for 28 minutes, sees warning dialog, extends session, continues working; or user checks "Remember Me" at login, closes browser, reopens, and remains logged in

### Tests for User Story 7 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T087 [P] [US7] Create tests/unit/composables/useSessionTimeout.test.js - test inactivity tracking and warning logic
- [ ] T088 [P] [US7] Create tests/e2e/session-timeout.spec.js - test session timeout scenario (SC-011: warning at 28 min)

### Implementation for User Story 7

- [ ] T089 [US7] Create src/composables/useSessionTimeout.js - inactivity detection, warning trigger, extend session
- [ ] T090 [US7] Create src/components/layout/SessionTimeout.vue - session timeout warning modal
- [ ] T091 [US7] Implement event listeners for user activity (mousemove, keydown, click, scroll, touch) (FR-039)
- [ ] T092 [US7] Implement inactivity timer with 28-minute warning threshold, 30-minute logout (FR-039)
- [ ] T093 [US7] Add localStorage sync for multi-tab session coordination
- [ ] T094 [US7] Implement extendSession() function in auth store (FR-040)
- [ ] T095 [US7] Add automatic token refresh in auth store (FR-038)
- [ ] T096 [US7] Implement "Remember Me" checkbox in LoginView with persistent session (FR-041)
- [ ] T097 [US7] Add session validity check on route navigation with re-auth prompt (FR-042)

**Checkpoint**: Session management complete - automatic refresh, inactivity warnings, persistent sessions (SC-010, SC-011, FR-038 to FR-042)

---

## Phase 10: User Story 8 - Error Handling & Recovery (Priority: P2)

**Goal**: Provide clear, actionable error messages for all error scenarios (network failures, validation errors, unexpected errors) without exposing technical details

**Independent Test**: User encounters network failure, validation error, and unexpected error scenarios and receives user-friendly messages with recovery options while technical details are logged

### Tests for User Story 8 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T098 [US8] Create tests/integration/error-handling.test.js - verify all error scenarios display user-friendly messages

### Implementation for User Story 8

- [ ] T099 [P] [US8] Wrap all async operations in try-catch blocks across all stores (FR-043)
- [ ] T100 [P] [US8] Create error message mapping utility in src/utils/errors.js (technical → user-friendly)
- [ ] T101 [US8] Implement global error handler in main.js to catch Vue errors (FR-044)
- [ ] T102 [US8] Add inline validation error display to all forms (ProfileSettings, PreferencesSettings, AccountManagement) (FR-045)
- [ ] T103 [US8] Add hex color format validation in PreferencesSettings (FR-046)
- [ ] T104 [US8] Implement content sanitization before database writes (FR-047)
- [ ] T105 [US8] Add error logging with console.error including timestamp, user_id, error type, operation (FR-048, FR-049)
- [ ] T106 [US8] Verify no stack traces are displayed to users in production mode (SC-012)

**Checkpoint**: Error handling complete - all errors handled gracefully with user-friendly messages (SC-012, FR-043 to FR-049)

---

## Phase 11: User Story 9 - First-Time User Experience (Priority: P3)

**Goal**: Provide helpful empty states and contextual feature tours to guide new users through their first interactions with Tasks, Notes, Scheduling, and Settings

**Independent Test**: New user logs in, navigates to Tasks/Notes/Scheduling/Settings, sees empty states with encouraging messages and "Create First..." buttons, clicks CTA to create first item, sees contextual tour (skippable), completes tour, refreshes page, and tour does not reappear

### Tests for User Story 9 (REQUIRED - write FIRST, ensure FAIL)

- [ ] T107 [P] [US9] Create tests/unit/composables/useFeatureTour.test.js - test tour completion tracking
- [ ] T108 [P] [US9] Create tests/e2e/onboarding.spec.js - test empty states and feature tours (SC-013, SC-014)

### Implementation for User Story 9

- [ ] T109 [P] [US9] Create src/components/common/EmptyState.vue - reusable empty state component (icon, message, CTA)
- [ ] T110 [P] [US9] Create src/components/common/FeatureTour.vue - contextual tour overlay component
- [ ] T111 [P] [US9] Create src/composables/useFeatureTour.js - tour completion tracking (completed_tours array)
- [ ] T112 [P] [US9] Add EmptyState to TasksView for new users with "Create Your First Task" CTA (FR-050, FR-051)
- [ ] T113 [P] [US9] Add EmptyState to NotesView for new users with "Write Your First Note" CTA (FR-050, FR-051)
- [ ] T114 [P] [US9] Add EmptyState to SchedulingView for new users with "Schedule First Meeting" CTA (FR-050, FR-051)
- [ ] T115 [US9] Implement tour display logic (check completed_tours array, show if not completed) (FR-052)
- [ ] T116 [US9] Implement tour completion persistence (append tour ID to completed_tours array in database) (FR-053)
- [ ] T117 [US9] Add "Replay Tours" option in Settings > Help section (FR-054)

**Checkpoint**: Onboarding complete - new users guided with empty states and contextual tours (SC-013, SC-014, FR-050 to FR-054)

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories and overall quality

- [ ] T118 [P] Review all components for <300 line limit, refactor if exceeded (Constitutional requirement)
- [ ] T119 [P] Add JSDoc comments to complex utility functions (timezone.js, export.js, validation.js)
- [ ] T120 [P] Verify all primary actions use brand teal (#14b8a6), destructive actions use red (#ef4444)
- [ ] T121 [P] Verify all transitions respect prefers-reduced-motion media query
- [ ] T122 [P] Verify all forms use Tailwind spacing scale (space-y-4 between fields, space-y-2 label-to-input)
- [ ] T123 Run full test suite (unit + integration + E2E) and verify 80% coverage (SC-015)
- [ ] T124 Run Lighthouse performance audit and verify time-to-interactive <3 seconds
- [ ] T125 Run axe-core accessibility audit and verify zero critical violations (SC-006)
- [ ] T126 Test password reset flow end-to-end in Supabase development environment
- [ ] T127 Test account deletion with data verification (all user data removed from database)
- [ ] T128 Test data export with 1000+ record dataset and verify <30 sec completion
- [ ] T129 Manual keyboard navigation testing on all Settings tabs
- [ ] T130 Manual screen reader testing (NVDA/JAWS/VoiceOver) on critical flows
- [ ] T131 Update documentation in docs/ with new Settings features and accessibility improvements
- [ ] T132 Run quickstart.md validation checklist from start to finish
- [ ] T133 Code cleanup: remove console.logs, unused imports, commented code
- [ ] T134 Final commit: "feat: Complete user & application configuration (001-user-config)"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-11)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) or sequentially by priority
  - Priority order: P1 stories (US1, US2, US5) → P2 stories (US3, US4, US6, US7, US8) → P3 stories (US9)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

**P1 Stories** (MVP candidates - independent):
- **US1 (Password Reset)**: No dependencies on other stories
- **US2 (Profile & Preferences)**: No dependencies on other stories
- **US5 (Accessibility)**: No dependencies on other stories (cross-cutting, applied to all UI)

**P2 Stories** (independent):
- **US3 (Account Deletion)**: Depends on US2 (AccountManagement is part of Settings)
- **US4 (Data Export)**: Depends on US2 (DataExport is part of Settings)
- **US6 (Performance)**: Can start independently, affects TasksView and NotesView
- **US7 (Session Management)**: No dependencies on other stories
- **US8 (Error Handling)**: Can start independently (cross-cutting)

**P3 Stories**:
- **US9 (Onboarding)**: Depends on US2 (Settings integration for tour replay)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Utilities before composables
- Composables before components
- Components before views
- Views before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks marked [P] can run in parallel (T001, T005-T010)

**Phase 2 (Foundational)**: T011-T012 can run in parallel, T013-T014 can run in parallel

**User Story Tests**: All test tasks within a story marked [P] can run in parallel

**User Story Implementation**:
- Within US1: T019-T020 can run in parallel
- Within US2: T029-T031 can run in parallel, T042-T046 can run in parallel
- Within US3: T053-T054 can run in parallel, T055-T056 can run in parallel
- Within US4: T062-T065 can run in parallel, T066-T068 can run in parallel
- Within US5: T040-T041 can run in parallel, T042-T046 can run in parallel
- Within US6: T079-T080 can run in parallel
- Within US7: T087-T088 can run in parallel
- Within US9: T107-T108 can run in parallel, T109-T114 can run in parallel

**Cross-Story Parallelization**: After Foundational phase (Phase 2) completes, multiple developers can work on different user stories simultaneously:
- Developer A: US1 (Password Reset)
- Developer B: US2 (Profile & Preferences)
- Developer C: US5 (Accessibility)

---

## Parallel Example: User Story 2 (Profile & Preferences)

```bash
# Launch all tests for User Story 2 together:
Task: "Create tests/integration/settings/profile-update.test.js"
Task: "Create tests/integration/settings/theme-persistence.test.js"
Task: "Create tests/e2e/profile-update.spec.js"

# Launch all component creation for User Story 2 together:
Task: "Create src/views/SettingsView.vue"
Task: "Create src/components/settings/ProfileSettings.vue"
Task: "Create src/components/settings/PreferencesSettings.vue"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

**Recommended MVP Scope**: User Stories 1, 2, and 5 (Password Reset, Profile & Preferences, Accessibility)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T015) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (T016-T025) - Password Reset
4. Complete Phase 4: User Story 2 (T026-T039) - Profile & Preferences
5. Complete Phase 5: User Story 5 (T040-T052) - Accessibility
6. **STOP and VALIDATE**: Test all three stories independently
7. Run integration tests to verify stories work together
8. Deploy MVP / Create demo

**MVP Value Proposition**: Users can reset forgotten passwords, customize their profiles and preferences, and the application is fully accessible to all users.

### Incremental Delivery (Full Feature)

1. **Foundation** (Phases 1-2): Setup + Foundational → Infrastructure ready
2. **MVP** (Phases 3-5): US1 + US2 + US5 → Test independently → Deploy/Demo
3. **Enhancement Round 1** (Phases 6-7): US3 + US4 → Account deletion + Data export → Deploy/Demo
4. **Enhancement Round 2** (Phases 8-9): US6 + US7 + US8 → Performance + Session + Errors → Deploy/Demo
5. **Polish** (Phases 10-12): US9 + Cross-cutting concerns → Final release

**Benefit**: Each deployment adds value without breaking previous functionality. Users get immediate access to completed features.

### Parallel Team Strategy

With 3 developers (optimal for P1 stories):

1. **Week 1**: Team completes Setup + Foundational together (Phases 1-2)
2. **Week 2-3**: Once Foundational complete:
   - Developer A: User Story 1 (Password Reset)
   - Developer B: User Story 2 (Profile & Preferences)
   - Developer C: User Story 5 (Accessibility)
3. **Week 3**: Integration testing and MVP deployment
4. **Week 4+**: Team splits P2 stories in priority order

---

## Task Count Summary

- **Setup (Phase 1)**: 10 tasks
- **Foundational (Phase 2)**: 5 tasks
- **US1 - Password Reset (Phase 3)**: 10 tasks (2 test tasks, 8 implementation)
- **US2 - Profile & Preferences (Phase 4)**: 14 tasks (3 test tasks, 11 implementation)
- **US5 - Accessibility (Phase 5)**: 13 tasks (2 test tasks, 11 implementation)
- **US3 - Account Deletion (Phase 6)**: 9 tasks (2 test tasks, 7 implementation)
- **US4 - Data Export (Phase 7)**: 15 tasks (4 test tasks, 11 implementation)
- **US6 - Performance (Phase 8)**: 10 tasks (1 test task, 9 implementation)
- **US7 - Session Management (Phase 9)**: 11 tasks (2 test tasks, 9 implementation)
- **US8 - Error Handling (Phase 10)**: 9 tasks (1 test task, 8 implementation)
- **US9 - Onboarding (Phase 11)**: 11 tasks (2 test tasks, 9 implementation)
- **Polish (Phase 12)**: 17 tasks

**Total**: 134 tasks
- **Test tasks**: 19 tasks (unit, integration, E2E)
- **Implementation tasks**: 98 tasks
- **Setup/Infrastructure**: 15 tasks
- **Polish/Quality**: 17 tasks

**Test Coverage Target**: 80% minimum (SC-015) across ~50 unit tests, ~20 integration tests, ~8 E2E tests

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- **Test-First Approach**: All test tasks MUST be completed BEFORE corresponding implementation tasks
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Constitutional Compliance**: All components <300 lines, no TypeScript, brand teal for primary actions, WCAG 2.1 AA compliance
- **MVP Scope**: Phases 1-5 (Setup, Foundational, US1, US2, US5) provide maximum value with minimal scope
