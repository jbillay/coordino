<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version: 1.0.0 → Created initial constitution

  New Principles:
  - I. User Experience First
  - II. Accessibility is Non-Negotiable (WCAG 2.1 Level AA)
  - III. Security by Design (Row Level Security)
  - IV. Phased Implementation Strategy
  - V. Component-First Architecture
  - VI. No TypeScript (JavaScript with Composition API)
  - VII. Context7 for Library Documentation

  New Sections:
  - Technical Stack Requirements
  - Development Workflow
  - Governance

  Template Sync Status:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - User Stories section supports UX-first and phased approach
  ✅ tasks-template.md - Phase organization supports incremental delivery

  Follow-up TODOs:
  - None - all placeholders resolved

  Notes:
  - Initial constitution created from existing project documentation
  - Ratification date set to project inception based on git history
  - Principles derived from CLAUDE.md, ARCHITECTURE.md, DESIGN_GUIDELINES.md
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
- Context7 tools must be invoked for PrimeVue component usage
- Context7 tools must be invoked for Supabase API patterns
- Context7 tools must be invoked for date-fns, Vue Router, Pinia APIs
- Any third-party library integration requires Context7 lookup first
- Documentation links in code comments should reference Context7-verified current versions

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
- Refer to **IMPLEMENTATION_PLAN.md** for phase-specific implementation details

When CLAUDE.md conflicts with this constitution, this constitution takes precedence.

**Version**: 1.0.0 | **Ratified**: 2025-06-13 | **Last Amended**: 2025-12-10
