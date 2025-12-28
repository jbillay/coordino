# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

- [ ] **User Experience First**: Design prioritizes intuitive interactions and smooth user experience
- [ ] **Accessibility (WCAG 2.1 AA)**: Color contrast ratios, keyboard navigation, screen reader support planned
- [ ] **Security by Design**: Row Level Security policies designed for all user data tables
- [ ] **Phased Implementation**: Feature broken into complete, testable phases with clear completion criteria
- [ ] **Component-First Architecture**: Components focused, composable, <300 lines each
- [ ] **No TypeScript**: Vue 3 Composition API with JavaScript (no .ts files)
- [ ] **Context7 Usage**: Library documentation accessed via Context7 for PrimeVue, Supabase, date-fns, Vue Router, Pinia
- [ ] **Testing Strategy**: 80% minimum coverage planned with test pyramid (60-75% unit, 20-30% integration, 5-10% E2E)
- [ ] **Design System Consistency**: Brand teal (#14b8a6), Netflix dark mode (#141414), spacing/typography scales followed

### Testing Requirements Gate

- [ ] **Unit Tests**: Utilities and composables have 100% coverage plans
- [ ] **Integration Tests**: Component + store interaction tests planned
- [ ] **E2E Tests**: Critical user journeys identified (login, core workflows)
- [ ] **Test-First**: Tests written BEFORE implementation in all phases
- [ ] **Coverage Enforcement**: CI configured to block <80% coverage PRs

### Design System Gate

- [ ] **Color System**: Brand teal used for primary actions, no hardcoded colors
- [ ] **Dark Mode**: #141414 base background (NOT #000000 pure black)
- [ ] **Typography**: 16px (1rem) minimum body text, type scale followed
- [ ] **Spacing**: Tailwind spacing scale (--space-*) used exclusively
- [ ] **Animations**: prefers-reduced-motion respected in all transitions

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
