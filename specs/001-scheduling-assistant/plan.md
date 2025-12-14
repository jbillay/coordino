# Implementation Plan: Scheduling Assistant

**Branch**: `001-scheduling-assistant` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-scheduling-assistant/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.claude/commands/speckit.plan.md` for the execution workflow.

## Summary

The Scheduling Assistant feature enables international meeting coordination by providing real-time timezone conversion, equity scoring for proposed meeting times, and intelligent optimal time discovery. The system helps users schedule meetings across timezones by visualizing how proposed times affect each participant (color-coded status indicators), generating 24-hour heatmaps to find optimal time slots, detecting national holidays and non-working days, and supporting custom working hour configurations per country. The technical approach uses Vue 3 components with Pinia state management, Supabase PostgreSQL for data persistence with RLS policies, date-fns-tz for timezone calculations, and integration with the Nager.Date API for holiday detection.

## Technical Context

**Language/Version**: JavaScript (ES2022+) with Vue 3.4+ Composition API (no TypeScript per constitution)
**Primary Dependencies**: Vue 3, Vite 5, Vue Router 4, Pinia 2, PrimeVue 3, Tailwind CSS 3, date-fns 3.x, date-fns-tz 3.x, @supabase/supabase-js 2.x
**Storage**: Supabase PostgreSQL 15+ with Row Level Security policies, tables: meetings, participants, meeting_participants, country_configurations
**Testing**: Vitest 1.x for unit tests, @vue/test-utils 2.x for component tests, Playwright 1.x for E2E tests, 80% minimum coverage requirement
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), responsive design for desktop and mobile
**Project Type**: Web application (single-page Vue app with feature-based organization)
**Performance Goals**: Timezone display <10s (SC-001), equity calculations <2s for 20 participants (SC-002), heatmap generation <5s for 20 participants (SC-003), 100% timezone accuracy including DST (SC-008)
**Constraints**: WCAG 2.1 Level AA compliance (SC-009), components <300 lines (constitution V), 4.5:1 text contrast / 3:1 UI contrast (constitution II), keyboard navigation required, no TypeScript (constitution VI)
**Scale/Scope**: 50 participants max per meeting (FR-010a), 50 concurrent users (SC-011), permanent data retention (FR-006a), single-owner model (FR-006b)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User Experience First ✅ PASS

- **Requirement**: Intuitive interactions, smooth animations, immediate feedback
- **Feature alignment**:
  - FR-019: Instant local time updates on proposed time change
  - FR-045: Keyboard navigation for all interactive elements
  - Color-coded status provides immediate visual feedback (FR-020)
  - 24-hour heatmap enables quick optimal time discovery (FR-027)
- **Enforcement**: Manual testing required before phase completion per constitution

### Principle II: Accessibility is Non-Negotiable (WCAG 2.1 Level AA) ✅ PASS

- **Requirement**: 4.5:1 text contrast, 3:1 UI contrast, keyboard navigation, screen reader support, focus indicators
- **Feature alignment**:
  - FR-045: Explicit keyboard navigation requirement
  - FR-046: ARIA labels and screen reader support
  - FR-047: Respects prefers-reduced-motion
  - FR-048: Maintains required contrast ratios
  - SC-009: WCAG 2.1 AA compliance in success criteria
- **Enforcement**: Accessibility testing checkpoint required before completion

### Principle III: Security by Design (Row Level Security) ✅ PASS

- **Requirement**: All tables must have RLS policies using auth.uid()
- **Feature alignment**:
  - FR-005: RLS policies ensure users only access their own meetings
  - FR-042: Custom country configurations isolated via RLS
  - Single-owner model (FR-006b) simplifies RLS implementation
- **Enforcement**: All database migrations must include RLS policies

### Principle IV: Phased Implementation Strategy ✅ PASS

- **Requirement**: Complete, testable phases with validation checkpoints
- **Feature alignment**:
  - User stories prioritized P1-P4 for incremental delivery
  - P1 (Quick Timezone Check) delivers standalone MVP value
  - Each phase independently testable per acceptance scenarios
  - "Independent Test" documented for each user story
- **Enforcement**: No Phase N+1 work until Phase N complete and verified

### Principle V: Component-First Architecture ✅ PASS

- **Requirement**: Components <300 lines, props down/events up, feature organization
- **Feature alignment**:
  - Feature-specific components in `src/features/scheduling/components/`
  - Shared timezone utilities in `src/composables/useTimezone.js`
  - Component size verified during code review
- **Enforcement**: Refactoring required if components exceed 300 lines

### Principle VI: No TypeScript (JavaScript with Composition API) ✅ PASS

- **Requirement**: Vue 3 Composition API with JavaScript only, no .ts/.tsx files
- **Feature alignment**:
  - All components use `<script setup>` with JavaScript
  - JSDoc comments for complex functions (equity scoring algorithm)
  - Constitution explicitly mandates JavaScript-only approach
- **Enforcement**: ESLint configured to reject TypeScript files

### Principle VII: Context7 for Library Documentation ✅ PASS

- **Requirement**: Use Context7 MCP tools for current library documentation
- **Feature alignment**:
  - Context7 required for PrimeVue component usage (DataTable, Calendar, Dialog)
  - Context7 required for date-fns-tz API patterns (timezone conversion, DST handling)
  - Context7 required for Supabase RLS policy patterns
- **Enforcement**: Document Context7 lookups in implementation notes

### Gate Evaluation: ✅ ALL GATES PASSED

No constitutional violations detected. Feature design aligns with all 7 core principles.

**Phase 0 Research**: ✅ COMPLETE (see research.md)
**Phase 1 Design**: ✅ COMPLETE (see data-model.md, contracts/, quickstart.md)
**Agent Context**: ✅ UPDATED (CLAUDE.md updated with new technologies)

### Post-Design Constitution Re-evaluation: ✅ ALL GATES STILL PASS

After completing research and design phases, all constitutional principles remain satisfied:
- **UX First**: Color-coded status system, instant updates, heatmap visualization
- **Accessibility**: WCAG 2.1 AA enforced, keyboard nav, screen reader support
- **Security**: RLS policies on all 5 tables (meetings, participants, meeting_participants, country_configurations, holiday_cache)
- **Phased**: P1-P4 user stories enable incremental delivery with clear MVP (P1)
- **Component-First**: Feature directory structure with <300 line components, composables pattern
- **No TypeScript**: JavaScript with Composition API, JSDoc for complex algorithms
- **Context7**: PrimeVue, date-fns-tz, Supabase patterns require Context7 lookups

No design decisions conflict with constitutional constraints. Ready to proceed to task generation.

## Project Structure

### Documentation (this feature)

```text
specs/001-scheduling-assistant/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   ├── meetings.yaml    # Meeting management API contracts
│   ├── participants.yaml # Participant management API contracts
│   └── equity.yaml      # Equity scoring and heatmap API contracts
├── checklists/
│   └── requirements.md  # Specification quality checklist (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── features/
│   └── scheduling/                    # Scheduling Assistant feature
│       ├── components/
│       │   ├── MeetingForm.vue       # Meeting creation/editing form
│       │   ├── ParticipantList.vue   # Participant table with timezone display
│       │   ├── TimezoneGrid.vue      # Color-coded participant status grid
│       │   ├── EquityScoreCard.vue   # Equity score visualization
│       │   ├── TimeHeatmap.vue       # 24-hour optimal time heatmap
│       │   ├── HolidayAlert.vue      # Holiday/non-working day warnings
│       │   └── CountryConfigForm.vue # Custom working hours configuration
│       ├── composables/
│       │   ├── useTimezone.js        # Timezone conversion utilities
│       │   ├── useEquityScore.js     # Equity scoring algorithm
│       │   ├── useHolidays.js        # Holiday API integration
│       │   └── useHeatmap.js         # Heatmap generation logic
│       ├── store.js                   # Pinia store for scheduling state
│       └── utils.js                   # Utility functions (date formatting, etc.)
├── composables/
│   └── useSupabase.js                 # Supabase client (existing)
├── router/
│   └── index.js                       # Add /scheduling routes
└── stores/
    └── auth.js                        # Authentication state (existing)

tests/
├── unit/
│   └── scheduling/
│       ├── useTimezone.spec.js       # Timezone conversion tests
│       ├── useEquityScore.spec.js    # Equity algorithm tests
│       └── useHeatmap.spec.js        # Heatmap generation tests
├── integration/
│   └── scheduling/
│       ├── MeetingCRUD.spec.js       # Meeting CRUD operations
│       └── ParticipantCRUD.spec.js   # Participant CRUD operations
└── e2e/
    └── scheduling/
        ├── create-meeting.spec.js    # E2E meeting creation flow
        └── optimal-time.spec.js      # E2E optimal time discovery flow

supabase/
└── migrations/
    └── 20251211_scheduling_assistant.sql  # Database schema and RLS policies
```

**Structure Decision**: Using feature-based organization per constitution Principle V and CLAUDE.md guidance. The `src/features/scheduling/` directory contains all scheduling-specific components, composables, and stores. Shared utilities (useSupabase) remain at root level. This structure supports component-first architecture and makes the feature independently maintainable.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. This section intentionally left empty.

---

## Planning Summary

**Status**: Phase 0 (Research) and Phase 1 (Design & Contracts) ✅ COMPLETE

### Artifacts Generated

1. **plan.md** (this file)
   - Technical Context filled with all stack details
   - Constitution Check: All 7 principles validated
   - Project structure defined with feature-based organization
   - Post-design re-evaluation: All gates still pass

2. **research.md** (Phase 0)
   - Timezone library decision: date-fns + date-fns-tz
   - Holiday API decision: Nager.Date Public API
   - Equity scoring algorithm specification
   - Heatmap generation strategy
   - IANA timezone validation approach
   - ISO 3166-1 country code validation
   - Database schema design with RLS policies
   - PrimeVue component selection
   - Work week pattern implementation
   - Accessibility testing strategy

3. **data-model.md** (Phase 1)
   - 5 entity definitions (Meeting, Participant, MeetingParticipant, CountryConfiguration, HolidayCache)
   - Entity-relationship diagram
   - State transition diagrams
   - Computed field specifications
   - Complete RLS policy definitions
   - Database migration plan
   - Query pattern examples

4. **contracts/** (Phase 1)
   - `meetings.yaml`: Meeting management API (OpenAPI 3.1)
   - `participants.yaml`: Participant management API (OpenAPI 3.1)
   - `equity.yaml`: Equity scoring, heatmap, and country config API (OpenAPI 3.1)

5. **quickstart.md** (Phase 1)
   - 5-minute developer setup guide
   - Core concept code examples (timezone conversion, equity scoring, status calculation, holiday API)
   - Pinia store pattern
   - Component example (ParticipantList.vue)
   - Testing examples (unit and integration)
   - Common pitfalls and solutions
   - Next steps guidance

6. **Agent Context** (Phase 1)
   - Updated CLAUDE.md with new technologies:
     - date-fns 3.x, date-fns-tz 3.x
     - Supabase PostgreSQL 15+ with 5 new tables
     - Feature-based organization for scheduling

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Timezone Library | date-fns-tz | Lightweight (15KB), DST support, modular, existing usage |
| Holiday API | Nager.Date v3 | Free, no auth, 100+ countries, reasonable SLA |
| Equity Algorithm | Weighted scoring with normalization | Penalizes poor times more, intuitive 0-100 scale |
| Heatmap Strategy | Client-side on-demand calculation | <20ms for 50 participants, well within 5s target |
| Database Schema | 4 tables + 1 cache table | Normalized, reusable participants, RLS on all tables |
| Work Week Storage | Integer array (1-7) | Flexible, supports any pattern, simple validation |
| UI Components | PrimeVue (DataTable, Calendar, Dropdown, etc.) | Accessible, existing usage, themeable |

### Performance Validation

| Requirement | Target | Calculated | Status |
|-------------|--------|------------|--------|
| SC-001: Timezone display | <10s | ~100ms | ✅ PASS |
| SC-002: Equity calculation | <2s for 20p | ~10ms | ✅ PASS |
| SC-003: Heatmap generation | <5s for 20p | 10-20ms | ✅ PASS |
| SC-008: Timezone accuracy | 100% including DST | date-fns-tz handles DST | ✅ PASS |

### Next Steps

**Immediate**: Run `/speckit.tasks` command to generate task breakdown (tasks.md)

**Phase 2 (Task Generation)** will create:
- Detailed implementation tasks organized by user story priority (P1→P2→P3→P4)
- Database migration tasks with SQL code
- Component implementation tasks with acceptance criteria
- Testing tasks (unit, integration, E2E)
- Accessibility validation tasks
- Dependency order for parallel/sequential execution

**After Task Generation**:
- Review tasks.md for clarity and completeness
- Optionally run `/speckit.analyze` for cross-artifact consistency check
- Optionally run `/speckit.checklist` to generate domain-specific checklist
- Begin implementation following phased approach (P1 first)

**Branch**: `001-scheduling-assistant` (already checked out)
**Feature Status**: Design complete, ready for task breakdown
