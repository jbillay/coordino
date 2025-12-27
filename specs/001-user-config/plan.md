# Implementation Plan: User & Application Configuration

**Branch**: `001-user-config` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-user-config/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements comprehensive user and application configuration capabilities for Coordino, covering 9 core user stories: password reset with secure email tokens, profile and preference management with real-time synchronization, account deletion with multi-step confirmation, data export in dual formats (JSON for backup, CSV for analysis), WCAG 2.1 AA accessibility compliance, performance optimization for large datasets (5,000 tasks, 3,000 notes), session management with 30-minute inactivity timeout, robust error handling with user-friendly messaging, and first-time user onboarding with empty states and contextual tours.

The technical approach leverages Supabase Auth's built-in email service for password reset, extends the existing users_extended table for profile preferences, implements virtual scrolling for performance at scale, uses Supabase Dashboard + browser console.error for logging, and delivers phased implementation across Settings UI, accessibility enhancements, performance optimizations, and onboarding experiences.

## Technical Context

**Language/Version**: JavaScript (ES2020+), Vue 3.4+ with Composition API (no TypeScript)
**Primary Dependencies**: Vue 3, Vite 5.x, PrimeVue 3.x, Tailwind CSS 3.x, Pinia 2.x, Supabase JS Client 2.x
**Storage**: PostgreSQL 15+ via Supabase (serverless, managed database with Row Level Security)
**Testing**: Vitest 1.x (unit/integration), Playwright 1.x (E2E), @vue/test-utils 2.x (component testing)
**Target Platform**: Web application (modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web application (serverless SPA: Vue 3 frontend + Supabase backend)
**Performance Goals**:
- Time-to-interactive: <3 seconds on standard broadband
- Virtual scrolling: 60fps with 1,000+ item lists
- Search operations: <1 second for 500+ items
- Password reset email delivery: <2 minutes
- Data export: <30 seconds for 1,000 records
- Session token refresh: automatic, zero user interruption

**Constraints**:
- No TypeScript (.ts/.tsx files)
- WCAG 2.1 Level AA compliance mandatory
- 80% minimum test coverage enforced in CI
- Component size limit: 300 lines (refactor if exceeded)
- Row Level Security required for all user data tables
- Email service: Supabase Auth built-in only (no external email providers)
- Logging: Supabase Dashboard + browser console.error only (no external services)

**Scale/Scope**:
- Users: 10,000+ concurrent users target
- Data volume per user: 5,000 tasks soft limit, 3,000 notes soft limit
- Session duration: 8 hours of active use, 30 minutes inactivity timeout
- Code complexity: 10 new components, 3 new stores, 5 new composables, 15 new utility functions
- Test suite: ~50 unit tests, ~20 integration tests, ~8 E2E tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

- [x] **User Experience First**: Design prioritizes intuitive interactions and smooth user experience
  - Multi-step confirmation for destructive actions (account deletion)
  - Immediate feedback for preference changes (theme, timezone updates reflected instantly)
  - Clear, actionable error messages replacing technical jargon
  - Empty states with encouraging messages and clear CTAs for first-time users
  - Session timeout warnings 2 minutes in advance with extend option

- [x] **Accessibility (WCAG 2.1 AA)**: Color contrast ratios, keyboard navigation, screen reader support planned
  - User Story 5 dedicated entirely to accessibility compliance
  - FR-020 through FR-028 specify all form labels, keyboard access, focus indicators, ARIA live regions
  - Touch target minimums (44x44px), color contrast ratios (4.5:1 normal, 3:1 large)
  - Arrow key navigation for note lists, focus trap in mobile menu
  - Screen reader testing planned in acceptance scenarios

- [x] **Security by Design**: Row Level Security policies designed for all user data tables
  - Existing users_extended table already has RLS policies (auth.uid() = id)
  - Password reset uses time-limited (24 hours) secure tokens via Supabase Auth
  - All active sessions invalidated on password reset (FR-004)
  - Account deletion requires re-authentication or typing "DELETE" (FR-011)
  - No new user data tables introduced; extends existing schema

- [x] **Phased Implementation**: Feature broken into complete, testable phases with clear completion criteria
  - User stories prioritized: 5 P1 (password reset, profile, accessibility), 3 P2 (account deletion, export, performance, session, error handling), 1 P3 (onboarding)
  - Each user story has independent test criteria and acceptance scenarios
  - Can deliver P1 features first for maximum impact, defer P2/P3 enhancements

- [x] **Component-First Architecture**: Components focused, composable, <300 lines each
  - Settings area decomposed: SettingsView (container), ProfileSettings, PreferencesSettings, AccountManagement, DataExport components
  - Reusable ConfirmDialog for account deletion confirmation
  - Empty state components shared across Tasks, Notes, Scheduling views
  - FeatureTour component for contextual onboarding

- [x] **No TypeScript**: Vue 3 Composition API with JavaScript (no .ts files)
  - All new components use `<script setup>` with JavaScript
  - Constraint explicitly documented: "No TypeScript (.ts/.tsx files)"
  - JSDoc comments for complex utility functions (timezone conversion, export formatting)

- [x] **Context7 Usage**: Library documentation accessed via Context7 for PrimeVue, Supabase, date-fns, Vue Router, Pinia
  - Password reset: Context7 for Supabase Auth API (resetPasswordForEmail, verifyOtp)
  - Settings UI: Context7 for PrimeVue form components (Dropdown, InputText, ColorPicker)
  - Timezone conversion: Context7 for date-fns (format, formatInTimeZone)
  - Data export: Context7 for file download patterns and CSV formatting libraries

- [x] **Testing Strategy**: 80% minimum coverage planned with test pyramid (60-75% unit, 20-30% integration, 5-10% E2E)
  - SC-015: 80% coverage target across all code metrics
  - SC-016: E2E tests for critical flows (password reset, account deletion, data export)
  - Unit tests: timezone conversion, password validation, data sanitization, export formatting
  - Integration tests: profile update + RLS, password reset flow, session timeout warning
  - E2E tests: complete password reset journey, account deletion workflow, data export end-to-end

- [x] **Design System Consistency**: Brand teal (#14b8a6), Netflix dark mode (#141414), spacing/typography scales followed
  - Primary actions use brand teal: "Save Profile," "Reset Password," "Export Data" buttons
  - Dark mode toggle in preferences preserves #141414 base (not pure black)
  - Form layouts follow Tailwind spacing (--space-4 between fields, --space-2 label-to-input)
  - Typography: 16px minimum body text in settings forms, --text-sm for metadata
  - All transitions respect prefers-reduced-motion (theme switching, empty state reveals)

### Testing Requirements Gate

- [x] **Unit Tests**: Utilities and composables have 100% coverage plans
  - `src/utils/validation.js` - Password strength validation (8+ chars, mixed types)
  - `src/utils/timezone.js` - Timezone conversion and formatting for preferences
  - `src/utils/export.js` - JSON and CSV formatting for data export
  - `src/utils/sanitization.js` - User-generated content sanitization
  - `src/composables/useSessionTimeout.js` - Inactivity tracking, warning logic
  - `src/composables/usePasswordReset.js` - Password reset flow state machine

- [x] **Integration Tests**: Component + store interaction tests planned
  - ProfileSettings + useAuthStore: Profile update triggers store action, RLS policy verification
  - PreferencesSettings + useConfigStore: Theme toggle updates store + localStorage persistence
  - AccountManagement + useAuthStore: Account deletion flow with confirmation
  - DataExport + useTasksStore/useNotesStore: Export triggers data fetch, archive generation
  - SessionTimeout + useAuthStore: Timeout warning appears at 28 minutes, extend session works

- [x] **E2E Tests**: Critical user journeys identified (login, core workflows)
  - Password reset journey: Click "Forgot Password" → Enter email → Check inbox → Click reset link → Set new password → Login with new credentials
  - Account deletion workflow: Navigate to Settings → Account Management → Type "DELETE" → Confirm → Verify redirect to login → Attempt login fails
  - Data export end-to-end: Settings → Data Export → Click "Export All My Data" → Download .zip → Extract → Verify JSON and CSV files present and valid
  - Profile update journey: Settings → Profile → Change display name + timezone → Save → Verify changes reflected in header and throughout app
  - Session timeout scenario: Remain inactive for 28 minutes → Warning appears → Click "Extend Session" → Continue working without re-login

- [x] **Test-First**: Tests written BEFORE implementation in all phases
  - Phase 1 (Settings UI): Write component tests for SettingsView, ProfileSettings, PreferencesSettings FIRST, ensure they fail
  - Phase 2 (Password Reset): Write usePasswordReset composable tests FIRST, implement to make them pass
  - Phase 3 (Data Export): Write export utility tests FIRST (JSON/CSV formatting), then implement
  - Phase 4 (Accessibility): Write keyboard navigation tests FIRST, then implement aria-labels and focus management
  - Each PR must include both implementation AND corresponding tests

- [x] **Coverage Enforcement**: CI configured to block <80% coverage PRs
  - Vitest coverage configured in vitest.config.js with thresholds: branches 80%, functions 80%, lines 80%, statements 80%
  - GitHub Actions workflow runs `npm run test:coverage` on every PR
  - PR checks fail if coverage drops below 80% in any metric
  - Coverage report uploaded as PR comment for visibility

### Design System Gate

- [x] **Color System**: Brand teal used for primary actions, no hardcoded colors
  - Primary buttons: "Save Profile," "Reset Password," "Export Data" use `bg-teal-500 hover:bg-teal-600`
  - Destructive actions: "Delete Account" uses `bg-red-500 hover:bg-red-600` (semantic override)
  - Success messages: Data export complete uses `text-teal-600` for confirmation
  - No hardcoded hex colors in component templates; all use Tailwind utilities or CSS variables

- [x] **Dark Mode**: #141414 base background (NOT #000000 pure black)
  - Settings panels use `bg-gray-900` (#141414 in dark mode) as base
  - Elevated surfaces (cards, modals): `bg-gray-800` (#1f1f1f)
  - Theme toggle in PreferencesSettings updates `theme` value in Pinia store
  - All components inherit theme from root App.vue, no component-level theme logic

- [x] **Typography**: 16px (1rem) minimum body text, type scale followed
  - Form labels: `text-base` (16px) for accessibility
  - Form input text: `text-base` (16px) minimum
  - Help text and metadata: `text-sm` (14px) allowed for secondary information
  - Section headings: `text-xl` (20px) or `text-2xl` (24px) for hierarchy
  - No `text-xs` (12px) used for interactive elements, only timestamps

- [x] **Spacing**: Tailwind spacing scale (--space-*) used exclusively
  - Form field vertical spacing: `space-y-4` (1rem / 16px)
  - Label to input gap: `space-y-2` (0.5rem / 8px)
  - Section padding: `p-6` (1.5rem / 24px) for settings cards
  - Button internal padding: `px-4 py-2` (standard button spacing)
  - No arbitrary values like `p-[15px]`; only Tailwind scale values

- [x] **Animations**: prefers-reduced-motion respected in all transitions
  - Theme switching: `transition-colors duration-200` wrapped in `@media (prefers-reduced-motion: no-preference)`
  - Empty state reveals: Fade-in animation only if motion not reduced
  - Session timeout warning: Modal appears immediately if reduced motion, slides in otherwise
  - Success toast messages: Respect prefers-reduced-motion for slide/fade transitions
  - All transition utilities include motion-safe variants

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── views/
│   ├── SettingsView.vue          # NEW: Main settings container with tab navigation
│   ├── TasksView.vue              # MODIFIED: Add empty state for first-time users
│   ├── NotesView.vue              # MODIFIED: Add empty state for first-time users
│   └── SchedulingView.vue         # MODIFIED: Add empty state for first-time users
│
├── components/
│   ├── settings/                  # NEW: Settings-specific components
│   │   ├── ProfileSettings.vue    # Profile information editing (name, email)
│   │   ├── PreferencesSettings.vue # User preferences (timezone, theme, date format)
│   │   ├── AccountManagement.vue  # Password change, account deletion
│   │   └── DataExport.vue         # Data export interface
│   │
│   ├── common/
│   │   ├── EmptyState.vue         # NEW: Reusable empty state component
│   │   ├── ConfirmDialog.vue      # NEW: Confirmation dialog for destructive actions
│   │   └── FeatureTour.vue        # NEW: Contextual feature tour overlay
│   │
│   └── layout/
│       └── SessionTimeout.vue     # NEW: Session timeout warning modal
│
├── composables/
│   ├── usePasswordReset.js        # NEW: Password reset flow logic
│   ├── useSessionTimeout.js       # NEW: Session inactivity tracking
│   ├── useDataExport.js           # NEW: Data export orchestration
│   └── useFeatureTour.js          # NEW: Tour completion tracking
│
├── stores/
│   ├── auth.js                    # MODIFIED: Add password reset, account deletion methods
│   ├── config.js                  # MODIFIED: Extend with completed_tours array
│   └── export.js                  # NEW: Data export state management
│
├── utils/
│   ├── validation.js              # NEW: Password strength, email format validation
│   ├── export.js                  # NEW: JSON/CSV formatting and archiving
│   └── sanitization.js            # NEW: User-generated content sanitization
│
└── router/
    └── index.js                   # MODIFIED: Add /settings route

tests/
├── unit/
│   ├── utils/
│   │   ├── validation.test.js     # NEW: Password/email validation tests
│   │   ├── export.test.js         # NEW: JSON/CSV formatting tests
│   │   └── sanitization.test.js   # NEW: Content sanitization tests
│   │
│   └── composables/
│       ├── usePasswordReset.test.js   # NEW: Password reset flow tests
│       ├── useSessionTimeout.test.js  # NEW: Inactivity tracking tests
│       └── useDataExport.test.js      # NEW: Export orchestration tests
│
├── integration/
│   ├── settings/
│   │   ├── profile-update.test.js     # NEW: Profile + store + RLS test
│   │   ├── theme-persistence.test.js  # NEW: Theme toggle + localStorage test
│   │   └── account-deletion.test.js   # NEW: Deletion flow + confirmation test
│   │
│   └── export/
│       └── data-export-flow.test.js   # NEW: Export trigger + archive generation test
│
└── e2e/
    ├── password-reset.spec.js     # NEW: Complete password reset journey
    ├── account-deletion.spec.js   # NEW: Account deletion workflow
    ├── data-export.spec.js        # NEW: Data export end-to-end
    └── profile-update.spec.js     # NEW: Profile update journey

supabase/
└── migrations/
    └── YYYYMMDDHHMMSS_add_completed_tours_to_users_extended.sql  # NEW: Add completed_tours column
```

**Structure Decision**: Coordino follows the **Web Application** pattern with a serverless architecture (Vue 3 frontend + Supabase backend). The source structure is feature-based, with shared components in `src/components/` and feature-specific components in subdirectories (e.g., `src/components/settings/`).

This feature introduces:
- **1 new view**: SettingsView.vue (main settings container)
- **7 new components**: 4 settings components, 3 common components (EmptyState, ConfirmDialog, FeatureTour)
- **4 new composables**: Password reset, session timeout, data export, feature tour
- **1 new store**: Export state management
- **3 new utility modules**: Validation, export formatting, sanitization
- **1 database migration**: Add completed_tours array to users_extended table

Existing views (TasksView, NotesView, SchedulingView) are modified to include empty states for first-time users, leveraging the new EmptyState component.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations detected. All core principles are satisfied:
- User Experience First: ✅ Multi-step confirmations, immediate feedback, clear error messages
- Accessibility: ✅ Dedicated user story, comprehensive FR requirements
- Security by Design: ✅ Existing RLS policies, secure tokens, re-authentication for destructive actions
- Phased Implementation: ✅ Prioritized user stories (P1/P2/P3), independent test criteria
- Component-First: ✅ <300 line components, focused responsibilities
- No TypeScript: ✅ JavaScript with Composition API, JSDoc for complex functions
- Context7 Usage: ✅ Library documentation via Context7 planned
- Testing Strategy: ✅ 80% coverage target, test pyramid distribution
- Design System: ✅ Brand teal, #141414 dark mode, Tailwind spacing scale

No complexity tracking entries required.

---

## Planning Phase Completion Summary

### Artifacts Generated

**Phase 0: Research** ✅
- `research.md`: Technical integration research resolving 5 key areas
  - Supabase Auth password reset flow
  - Virtual scrolling implementation (vue-virtual-scroller)
  - Data export dual-format generation (jszip + papaparse)
  - Session timeout detection (custom inactivity tracking)
  - ARIA live regions for accessibility

**Phase 1: Design & Contracts** ✅
- `data-model.md`: Database schema extension (1 column added to users_extended)
- `contracts/password-reset.contract.md`: Complete password reset API contract
- `contracts/profile-management.contract.md`: Profile & preferences management contract
- `contracts/data-export.contract.md`: Data export API contract with dual-format specs
- `quickstart.md`: Development setup and testing guide

### Technology Decisions

**New Dependencies**:
- `vue-virtual-scroller` v2.0.0-beta.8 - Virtual scrolling for performance
- `jszip` v3.10.1 - Browser-based ZIP archive creation
- `papaparse` v5.4.1 - CSV generation with escaping

**Database Changes**:
- Add `completed_tours TEXT[]` column to `users_extended` table
- Migration file: `YYYYMMDDHHMMSS_add_completed_tours_to_users_extended.sql`
- No new tables required (leverages existing schema)

**External Services**:
- Email: Supabase Auth built-in (no external provider)
- Logging: Supabase Dashboard + browser console.error (no external service)

### Constitution Re-Check (Post-Design)

All 9 core principles remain satisfied after design phase:
- ✅ User Experience First
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Security by Design
- ✅ Phased Implementation
- ✅ Component-First Architecture
- ✅ No TypeScript
- ✅ Context7 Usage
- ✅ Testing Strategy
- ✅ Design System Consistency

**No violations introduced during design.**

### Implementation Readiness

**Ready for `/speckit.tasks` command**:
- ✅ Technical research complete (no ambiguities)
- ✅ Data model designed (minimal schema impact)
- ✅ API contracts defined (3 contracts, comprehensive testing strategies)
- ✅ Quickstart guide written (setup, testing, deployment procedures)
- ✅ Constitution compliance verified (pre and post design)

**File Count Summary**:
- Specification: 1 file (spec.md)
- Planning: 1 file (plan.md - this file)
- Research: 1 file (research.md)
- Design: 1 file (data-model.md)
- Contracts: 3 files (password-reset, profile-management, data-export)
- Quickstart: 1 file (quickstart.md)
- **Total**: 8 documentation files

### Next Command

Execute `/speckit.tasks` to generate actionable implementation tasks from this plan. The tasks will be written to:
```
specs/001-user-config/tasks.md
```

Tasks will be organized by:
1. Priority (P1, P2, P3 from user stories)
2. Dependencies (prerequisite tasks must complete first)
3. Testing requirements (tests written BEFORE implementation)

---

**Planning Phase Status**: ✅ **COMPLETE**

All planning artifacts generated and validated. Ready to proceed to task generation and implementation.
