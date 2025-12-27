<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version: 1.0.0 → 1.1.0

  Modified Principles:
  - VII. Context7 for Library Documentation → Enhanced with specific examples

  Added Principles:
  - VIII. Testing Strategy (NEW) - 80% minimum coverage requirement
  - IX. Design System Consistency (NEW) - Brand teal, Netflix-style dark mode

  Added Sections:
  - Testing Requirements (NEW) - Comprehensive testing pyramid and coverage
  - Design System Standards (NEW) - Color system, typography, spacing rules

  Removed Sections:
  - None

  Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section updated to include testing and design gates
  ✅ spec-template.md - User Stories section already supports UX-first and phased approach
  ✅ tasks-template.md - Phase organization supports incremental delivery and test-first approach

  Follow-up TODOs:
  - None - all placeholders resolved

  Version Bump Rationale:
  - MINOR bump (1.0.0 → 1.1.0) - Added two new principles (Testing Strategy, Design System)
  - Not MAJOR because no existing principles removed or incompatibly changed
  - Not PATCH because new constitutional requirements added, not just clarifications

  Notes:
  - Added Testing Strategy principle based on TESTING_STRATEGY.md and TESTING_GUIDE.md
  - Added Design System principle based on DESIGN_GUIDELINES.md
  - Enhanced Context7 principle with specific library examples
  - Integrated testing requirements throughout workflow sections
  - Added design system standards to complement existing UX principle
  ============================================================================
-->

# Coordino Constitution

## Core Principles

### I. User Experience First

**The application prioritizes user experience above all else.** Every feature must feel intuitive, every interaction must be smooth, and the design must surprise and delight while remaining highly functional. This is not merely aspirational—it is a hard requirement that supersedes technical elegance.

**Rationale**: Users interact with experiences, not code. A technically perfect implementation that frustrates users has failed its purpose. Coordino exists to make users more productive, not to showcase technical prowess.

**Enforcement**:
- All features must pass usability validation before completion
- Animation and transitions required for state changes (respecting prefers-reduced-motion)
- Component consistency enforced: similar actions must look similar everywhere
- Form validation must provide immediate, helpful feedback

### II. Accessibility is Non-Negotiable (WCAG 2.1 Level AA)

**All interfaces MUST meet WCAG 2.1 Level AA standards.** This includes color contrast ratios (4.5:1 for normal text, 3:1 for large text and UI components), keyboard navigation for all interactive elements, screen reader support with semantic HTML and ARIA labels, and visible focus indicators.

**Rationale**: Accessibility is not a feature—it is a fundamental requirement. Approximately 15% of the world's population experiences some form of disability. Excluding them is not acceptable.

**Enforcement**:
- Every interactive element must be keyboard accessible
- Color cannot be the sole means of conveying information
- All form inputs must have associated labels
- Focus indicators must have 2px solid outline with 2px offset
- Touch targets must be at least 44x44 pixels on mobile
- Test with keyboard navigation and screen readers before completion

### III. Security by Design (Row Level Security)

**Every database table MUST have Row Level Security (RLS) policies enabled.** Users can only access their own data, enforced at the database level. Never rely solely on frontend checks for security. The database is the ultimate security boundary.

**Rationale**: Frontend code can be modified or bypassed. Database-level security is the only reliable defense against unauthorized data access. A single misconfigured API endpoint should not compromise all user data.

**Enforcement**:
- All user data tables require user_id column with RLS policies
- RLS policies use auth.uid() for automatic user isolation
- No table can be created without documented RLS policies
- Foreign key cascades must be explicit (CASCADE vs SET NULL vs RESTRICT)
- Authentication tokens never exposed in URLs or logs

### IV. Phased Implementation Strategy

**Features are built in complete, testable phases.** Each phase delivers a usable piece of functionality that can be validated before moving forward. No phase begins until the previous phase is complete and verified.

**Rationale**: Large monolithic implementations create risk, delay feedback, and make it difficult to pivot based on learning. Incremental delivery provides validation checkpoints and allows course correction.

**Enforcement**:
- Each phase must have explicit completion criteria
- Phase completion requires manual testing of all functionality
- No work on Phase N+1 until Phase N is complete and verified
- Each phase must be documented with what users can accomplish
- Phases must be independently deployable when possible

**Current Phase Structure**:
1. Foundation and Authentication
2. Task Management
3. Notes System
4. Scheduling Assistant
5. Configuration and Polish

### V. Component-First Architecture

**Components must be focused and composable.** A component should do one thing well. If a component exceeds 300 lines, it must be refactored into smaller pieces. Use props for data down, emit events for actions up. Avoid direct parent-child coupling.

**Rationale**: Small, focused components are easier to understand, test, and reuse. Tightly coupled components create maintenance nightmares and prevent code reuse.

**Enforcement**:
- Components exceeding 300 lines trigger refactoring requirement
- Props are for data down, events are for actions up (no other patterns)
- Shared components live in src/components/, feature components in src/features/[feature]/components/
- Components must document their purpose and key props
- Local component state (ref/reactive) only for UI concerns, Pinia stores for cross-component state

### VI. No TypeScript (JavaScript with Composition API)

**The project uses Vue 3 with Composition API in JavaScript, NOT TypeScript.** All new code must follow this pattern. JSDoc comments provide type hints where beneficial without TypeScript overhead.

**Rationale**: The project architecture was deliberately chosen for rapid development and lower barrier to entry. TypeScript adds build complexity and learning curve without sufficient benefit for this project's scale and team composition.

**Enforcement**:
- All .vue files use `<script setup>` with JavaScript
- No .ts or .tsx files permitted
- Use JSDoc comments for complex function signatures if needed
- Rely on Vue's reactivity system and runtime validation
- ESLint configured for JavaScript, not TypeScript

### VII. Context7 for Library Documentation

**Always use Context7 MCP tools to retrieve the latest library documentation** when working with code generation, setup/configuration, or library/API usage. Do not rely on potentially outdated documentation or assumptions.

**Rationale**: Library APIs change frequently. Using stale documentation leads to broken implementations and wasted time. Context7 provides current, accurate information.

**Enforcement**:
- Context7 tools MUST be invoked for PrimeVue component usage (Button, Dialog, DataTable, etc.)
- Context7 tools MUST be invoked for Supabase API patterns (auth, database queries, realtime)
- Context7 tools MUST be invoked for date-fns formatting and manipulation
- Context7 tools MUST be invoked for Vue Router navigation guards and route configuration
- Context7 tools MUST be invoked for Pinia store patterns and plugin usage
- Any third-party library integration requires Context7 lookup first
- Documentation links in code comments should reference Context7-verified current versions

### VIII. Testing Strategy

**Minimum 80% code coverage is required for all new code.** Tests follow the testing pyramid: many unit tests (60-75%), some integration tests (20-30%), few E2E tests (5-10%). Write tests as you build features—testing is not a separate phase.

**Rationale**: High test coverage provides confidence to refactor, catches regressions early, and serves as executable documentation. The testing pyramid ensures fast feedback while covering critical user journeys.

**Enforcement**:
- All utility functions MUST have 100% unit test coverage
- All composables MUST have 100% unit test coverage
- New Vue components MUST have 80%+ test coverage
- Store actions and mutations MUST be tested
- Critical user flows (login, task creation, note saving) MUST have E2E tests
- Tests run in watch mode during development (<30s locally, <2min in CI)
- Coverage reports block PRs below 80% threshold
- Use Vitest for unit/integration, Playwright for E2E
- Pre-commit hooks enforce passing tests

**Test-First Approach**:
- Write tests FIRST, ensure they FAIL, then implement
- Tests for User Story N must exist before User Story N implementation begins
- Each commit should include both code and corresponding tests

### IX. Design System Consistency

**Brand identity and design system must be consistent throughout the application.** Use brand teal (#14b8a6) as primary color, Netflix-style dark mode (#141414, not pure black), and follow spacing/typography scales precisely.

**Rationale**: Consistent design reduces cognitive load, reinforces brand identity, and creates a cohesive user experience. Arbitrary color choices and inconsistent spacing make the application feel unprofessional and difficult to navigate.

**Enforcement**:
- Primary color MUST be brand teal (#14b8a6) everywhere
- Dark mode MUST use #141414 as base background (NOT #000000 pure black)
- Elevated surfaces in dark mode: #1f1f1f (cards), #2a2a2a (modals)
- Typography MUST follow type scale (--text-base: 1rem minimum for body text)
- Spacing MUST use CSS variables (--space-2, --space-4, etc.) from Tailwind scale
- No hardcoded colors or spacing values in components
- All animations MUST respect prefers-reduced-motion
- Interactive elements MUST have hover and focus states

**Color System**:
- Brand teal: #14b8a6 (primary), #0d9488 (hover/focus)
- Semantic colors: success (#10b981), warning (#f59e0b), error (#ef4444), info (#3b82f6)
- Text hierarchy: --text-primary, --text-secondary, --text-tertiary

**Spacing Philosophy**:
- Information density over decorative whitespace
- Compact task cards: 0.625rem (10px) vertical padding, not 1.25rem (20px)
- Show 8-10 tasks per screen vs. 3-4 with excessive padding
- Consistent gaps: forms (1rem between fields), navigation (0.5rem between items)

## Technical Stack Requirements

**These technology choices are constitutional and cannot be changed without a constitution amendment:**

### Frontend Framework
- **Vue 3 with Composition API** (JavaScript only, no TypeScript)
- **Vite** for build tool (fast development, optimized production builds)
- **Vue Router** for navigation with auth guards

### State Management
- **Pinia** for centralized state management
- **Pinia persists** user preferences to localStorage
- **Supabase realtime** for data synchronization

### UI Framework
- **PrimeVue** for component library (buttons, forms, dialogs, complex components)
- **Tailwind CSS** for utility-first styling and custom designs
- **PrimeFlex** complements Tailwind for layout utilities

### Backend Services
- **Supabase** for authentication, database, and realtime subscriptions
- **PostgreSQL** (via Supabase) with Row Level Security policies
- **Supabase Edge Functions** for scheduled tasks (future: reminder notifications)

### Testing Tools
- **Vitest** for unit and integration tests (5-10x faster than Jest, native ESM)
- **@vue/test-utils** for component testing (official Vue testing library)
- **Playwright** for E2E tests (cross-browser, auto-wait, industry standard)
- **@vitest/coverage-v8** for coverage reporting (native V8 coverage, accurate)
- **Husky** for git hooks (enforce quality gates before commit)

### Hosting
- **Vercel** for frontend hosting with automatic GitHub deployments
- **Custom domain**: coordino.app
- **Environment variables** stored in Vercel dashboard (never in repository)

**Rationale**: These choices form a coherent, serverless architecture that eliminates the need for custom application servers, reduces operational complexity, and leverages managed services for authentication, data, and hosting. Changing any piece undermines the integrated benefits.

## Development Workflow

### Component Design Rules

- **Single Responsibility**: Each component does one thing well
- **Props Down, Events Up**: No other communication patterns permitted
- **300-Line Limit**: Components exceeding this must be refactored
- **Feature Organization**: src/features/[feature]/components/ for feature-specific, src/components/ for shared
- **Shared Logic**: Extract to composables in src/composables/

### State Management Rules

- **Pinia stores** for cross-component state
- **Local component state** (ref/reactive) only for UI concerns (modal open/closed, form state)
- **Computed properties** for derived state (never duplicate data)
- **No direct mutations**: Use store actions for all state changes

### API Integration Rules

- **All Supabase calls** go through useSupabase composable or feature-specific stores
- **Loading and error states** must be handled explicitly (users always know what's happening)
- **Never show raw errors**: Display friendly messages, log technical details
- **Optimistic updates** where appropriate, with rollback on failure

### Testing Requirements

**Unit Tests** (60-75% of tests):
- Location: `src/**/__tests__/*.test.js`
- Speed: <10ms each
- Isolated: No network, no database
- Cover: Utilities, composables, store logic
- Example: `src/utils/__tests__/validation.test.js`

**Integration Tests** (20-30% of tests):
- Location: `src/**/__tests__/integration/*.test.js`
- Speed: <100ms each
- Cover: Component + store interactions, API integrations
- Example: `src/features/tasks/__tests__/integration/task-creation.test.js`

**E2E Tests** (5-10% of tests):
- Location: `tests/e2e/*.spec.js`
- Speed: <5s each
- Cover: Critical user journeys only (login, create task, complete workflow)
- Example: `tests/e2e/task-management.spec.js`

**Coverage Thresholds** (enforced in CI):
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

**Test Quality Standards**:
- All tests must be isolated (no dependencies on each other)
- Test names clearly describe behavior (not implementation)
- Use AAA pattern: Arrange, Act, Assert
- Mock external dependencies (Supabase), not internal logic
- Tests run fast (<30s locally, <2min in CI)
- Pre-commit hooks block commits with failing tests

### Accessibility Testing Requirements

- **Keyboard navigation**: Test every interactive flow with Tab, Enter, Escape
- **Screen reader**: Test with at least one screen reader (NVDA, JAWS, or VoiceOver)
- **Color contrast**: Verify with automated tools (WebAIM Contrast Checker)
- **Focus indicators**: Must be visible at all times (no outline: none without replacement)
- **Touch targets**: Minimum 44x44px on mobile devices

### Performance Requirements

- **Lazy-load routes** that aren't immediately needed
- **Virtual scrolling** for lists exceeding 100 items
- **Image optimization**: Proper sizing and lazy loading
- **Code splitting**: PrimeVue components tree-shakeable
- **Avoid re-renders**: Be thoughtful about reactive dependencies

### Error Handling Requirements

- **Graceful degradation**: Network failures, database issues, lost connections
- **User-facing messages**: Clear explanations with recovery options
- **Never expose**: Raw error messages, stack traces, database errors
- **Logging**: Technical errors logged for debugging, user sees friendly message
- **Validation**: Client-side for UX (immediate feedback), server-side for security (database constraints)

### Design System Requirements

**Color Usage**:
- Primary color: Brand teal (#14b8a6) for primary buttons, active states, FAB
- Never use generic blue (#3b82f6) or hardcoded colors
- Dark mode: #141414 base (NOT #000000), #1f1f1f surfaces, #2a2a2a elevated
- Use CSS variables (var(--brand-teal-500)) instead of Tailwind hardcoded colors

**Typography**:
- Minimum body text: 16px (1rem) - NEVER use 14px for body content
- Type scale: --text-xs (12px) for timestamps, --text-sm (14px) for metadata
- Font weights: --font-medium (500) for labels, --font-semibold (600) for headings
- Line height: --leading-normal (1.5) for body text

**Spacing**:
- Use Tailwind spacing scale exclusively (--space-2, --space-4, etc.)
- Compact task cards: 0.625rem (10px) vertical padding
- Dashboard cards: 1.5rem (24px) internal padding, 1rem (16px) gaps
- Forms: 1rem between fields, 0.5rem label-to-input

**Animation**:
- Transition timing: --duration-fast (150ms) for UI interactions
- Easing: --ease-out (cubic-bezier(0, 0, 0.2, 1)) for natural motion
- MUST respect prefers-reduced-motion media query

## Governance

**This constitution supersedes all other practices and conventions.** When conflicts arise between this constitution and any other documentation, the constitution takes precedence.

### Amendment Process

1. **Proposal**: Document the proposed change with rationale and impact analysis
2. **Impact Assessment**: Identify all affected templates, code, and documentation
3. **Approval**: Requires explicit approval (project owner or designated authority)
4. **Migration Plan**: Create step-by-step plan for applying changes to existing code
5. **Version Bump**: Follow semantic versioning (MAJOR.MINOR.PATCH)
6. **Synchronization**: Update all dependent templates and documentation
7. **Communication**: Announce amendment with effective date and migration guidance

### Versioning Policy

- **MAJOR**: Backward-incompatible principle removals or redefinitions (e.g., switching to TypeScript)
- **MINOR**: New principle added or materially expanded guidance (e.g., adding testing requirements)
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review

- **Pull Requests**: Must verify compliance with all principles
- **Phase Completion**: Cannot proceed without constitution compliance
- **Code Reviews**: Reviewers must check constitution adherence
- **Testing**: All PRs must include tests and pass 80% coverage threshold
- **Design Review**: New UI components must follow design system standards
- **Complexity**: Any violation of principles must be explicitly justified with rationale

### Principle Conflicts

If two principles conflict in practice:
1. User Experience First takes precedence over technical preferences
2. Accessibility is Non-Negotiable takes precedence over aesthetic choices
3. Security by Design takes precedence over convenience
4. When still unclear, escalate for constitutional amendment

### Runtime Development Guidance

For day-to-day development decisions not covered by this constitution:
- Refer to **CLAUDE.md** for general project philosophy and best practices
- Refer to **ARCHITECTURE.md** for system design patterns and database schemas
- Refer to **DESIGN_GUIDELINES.md** for UI/UX standards and component patterns
- Refer to **TESTING_STRATEGY.md** for comprehensive testing approach and CI/CD
- Refer to **TESTING_GUIDE.md** for practical testing examples and patterns
- Refer to **IMPLEMENTATION_GUIDE.md** for phase-specific implementation details

When CLAUDE.md conflicts with this constitution, this constitution takes precedence.

**Version**: 1.1.0 | **Ratified**: 2025-06-13 | **Last Amended**: 2025-12-27
