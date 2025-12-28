# Phase 5: User & Application Configuration

## 1. Executive Summary ⚙️

Phase 5, "User & Application Configuration," focuses on empowering users with greater control over their accounts and personal settings within Coordino, while also bringing the application to a state of high polish regarding accessibility, performance, and overall user experience. This phase addresses critical account management features such as password reset, user profile updates, and account deletion, alongside a comprehensive sweep of outstanding quality-of-life and technical debt items previously identified.

## 2. Key Features & Requirements ✨

This phase delivers essential user account management capabilities and implements a series of crucial improvements across the application.

### A. Account Management

#### US-001: Password Reset Feature

- **As a user**, I want to be able to reset my forgotten password securely, **so that** I can regain access to my account without contacting support.
  - **Acceptance Criteria:**
    - ✅ User can initiate a password reset request from the login page.
    - ✅ System sends a secure, time-limited password reset link to the user's registered email address.
    - ✅ The reset link directs the user to a secure page where they can set a new password.
    - ✅ New password must meet strength requirements (e.g., minimum 8 characters, mix of characters).
    - ✅ User is notified upon successful password change and is prompted to log in.
    - ✅ Invalid or expired reset links are handled gracefully with appropriate error messages.
    - ✅ After password reset, any active sessions are invalidated (user must re-login on all devices).
  - **UI/UX Considerations:**
    - "Forgot Password?" link prominently displayed on the login page.
    - Clear instructions for the reset process (e.g., "Check your email").
    - Real-time password strength indicator on the new password form.
    - Visual confirmation (toast) upon successful reset.
  - **Technical Details:**
    - Utilize Supabase `resetPasswordForEmail` method.
    - Configure Supabase email templates for password reset.
    - Implement a dedicated `ResetPasswordView.vue` for the new password form.
    - Validate new password against predefined rules on the client and server (Supabase).
    - Handle `redirectTo` parameter for a seamless user experience.

#### US-002: Update User Information

- **As a user**, I want to be able to update my personal information (e.g., email, display name, timezone, theme) in a dedicated settings area, **so that** my profile reflects my current preferences.
  - **Acceptance Criteria:**
    - ✅ User can access a "Profile Settings" section from the navigation.
    - ✅ User can update their `full_name` and `preferred_timezone` in the `users_extended` table.
    - ✅ User can change their `theme` preference, which updates the application theme and persists.
    - ✅ User can update their email address (requires re-authentication/confirmation).
    - ✅ User can initiate a password change request (separate from reset, for logged-in users).
    - ✅ Changes are saved with appropriate success/error feedback.
    - ✅ Form validation is applied to all editable fields.
  - **UI/UX Considerations:**
    - Dedicated "SettingsView.vue" with sub-sections (e.g., Profile, Account, Notifications).
    - Clear input fields with current values pre-filled.
    - "Save" button clearly indicates action and shows loading state.
    - Confirmation dialogs for sensitive changes (e.g., email change).
    - Timezone selector and date format selector components for ease of use.
  - **Technical Details:**
    - Update `src/stores/auth.js` to handle email/password updates.
    - Create methods in `src/stores/theme.js` for setting theme.
    - Interact with the `auth.users` table for email/password changes and `users_extended` for profile details via Supabase client.
    - Implement `SettingsView.vue` and possibly child components for different setting sections.
    - Ensure RLS policies on `users_extended` allow updates by the authenticated user.

#### US-003: Delete Account Feature

- **As a user**, I want to be able to permanently delete my account and all associated data, **so that** I have full control over my personal information.
  - **Acceptance Criteria:**
    - ✅ User can access an "Account Management" section within settings.
    - ✅ User is presented with a clear warning about data loss and irreversibility.
    - ✅ User must confirm deletion (e.g., by re-entering password or typing "DELETE").
    - ✅ Upon successful deletion, the user's `auth.users` entry and all cascading data (`users_extended`, `tasks`, `notes`, etc.) are removed.
    - ✅ User is logged out and redirected to the login/landing page.
    - ✅ System handles deletion gracefully without errors.
  - **UI/UX Considerations:**
    - Prominent but carefully placed "Delete Account" button within settings.
    - Multi-step confirmation process to prevent accidental deletion.
    - Use `ConfirmDialog.vue` for the final confirmation.
    - A final toast notification confirming account deletion.
  - **Technical Details:**
    - Implement a method in `src/stores/auth.js` to handle account deletion.
    - Utilize Supabase `deleteUser` or similar administrative function if applicable (often handled by RLS rules on `auth.users` with `ON DELETE CASCADE` on other tables).
    - Ensure all RLS policies are configured to cascade deletions correctly, removing all user-associated data.
    - Invalidate session after deletion.

#### US-004: User Data Export

*   **As a user**, I want to be able to export all of my data (tasks, notes, meetings, etc.) in a common format, **so that** I have a personal backup and can migrate to another service if I choose.

    *   **Acceptance Criteria:**
        *   ✅ A "Data Export" section is available in the Settings page.
        *   ✅ User can click an "Export All My Data" button to initiate the process.
        *   ✅ The system generates a downloadable archive (e.g., a `.zip` file) containing the user's data.
        *   ✅ The archive includes separate files for tasks, notes, topics, meetings, and participants in a machine-readable format (CSV or JSON).
        *   ✅ The process should handle a reasonable amount of data without timing out. For very large datasets, an asynchronous process (e.g., "We will email you a link to your export when it's ready") should be considered.
        *   ✅ The export button shows a loading state while the data is being prepared.
    *   **UI/UX Considerations:**
        *   Clear explanation of what will be exported.
        *   The export button is distinct and clearly labeled.
        *   A success toast notification appears when the download begins.
        *   An error toast is shown if the export fails.
    *   **Technical Details:**
        *   Leverage the sample `exportToCSV` utility function mentioned in `QUICK_REFERENCE.md`.
        *   Create a method in the `auth` or a new `settings` store to orchestrate the data fetching from each feature store (`taskStore`, `notesStore`, etc.).
        *   Use a library like `jszip` to create the zip archive on the client side.
        *   For asynchronous export (future enhancement), this would require a Supabase Edge Function to prepare the data and email the user a secure download link.

### B. Additional Key Requirements (from TODO.md / TASK.md)

These requirements address existing technical debt and enhance the overall quality of the application, pushing it towards a production-ready state.

#### US-005: Comprehensive Accessibility Audit & Fixes (WCAG 2.1 AA)

*   **As all users, including those with disabilities**, I want the application to be fully accessible and usable with assistive technologies, **so that** I can effectively use Coordino without barriers.

    *   **Acceptance Criteria:**
        *   ✅ All form inputs (`<input>`, `<select>`, `<textarea>`) have `autocomplete` attributes where appropriate.
        *   ✅ All form fields are correctly associated with their `<label>` elements.
        *   ✅ All form fields have `id` and `name` attributes.
        *   ✅ Screen reader testing (NVDA/JAWS) passes for all critical user flows.
        *   ✅ Keyboard-only navigation is functional and logical throughout the entire application.
        *   ✅ All interactive elements display clear and consistent focus indicators.
        *   ✅ Color contrast ratios meet WCAG 2.1 AA guidelines across both light and dark themes.
        *   ✅ Mobile menu implements a proper focus trap for keyboard users.
        *   ✅ Search results (Notes) are announced to screen readers via ARIA live regions.
        *   ✅ Keyboard navigation is implemented for the NoteList (arrow keys).
    *   **UI/UX Considerations:**
        *   Design system adherence for focus states and color usage.
        *   Accessible navigation patterns.
        *   Clear error messaging for validation failures.
    *   **Technical Details:**
        *   Update existing form components (`InputText`, `Dropdown`, etc.) and custom components with appropriate attributes.
        *   Implement `aria-live` regions for dynamic content updates (e.g., search results, toasts).
        *   Refactor `src/components/layout/AppLayout.vue` mobile menu for a proper focus trap.
        *   Implement keyboard navigation logic in `src/features/notes/components/NoteList.vue`.
        *   Review and adjust CSS for color contrast as needed.

#### US-006: Performance Optimizations

*   **As a user**, I want the application to be fast and responsive, especially with large datasets, **so that** my workflow is smooth and efficient.

    *   **Acceptance Criteria:**
        *   ✅ Virtual scrolling is implemented for large task lists (`TasksView`).
        *   ✅ Virtual scrolling is implemented for large note lists (`NotesView`).
        *   ✅ N+1 query problem in real-time note updates is resolved.
        *   ✅ Topic reordering uses batch updates for efficiency.
        *   ✅ Memoization is applied to expensive computations and utility functions.
        *   ✅ AppLayout is split into smaller, more performant sub-components.
        *   ✅ Image assets are optimized (WebP, lazy loading).
        *   ✅ Bundle analysis tooling is configured to monitor performance.
    *   **UI/UX Considerations:**
        *   Smooth scrolling experience for long lists.
        *   Fast data loading and updates.
    *   **Technical Details:**
        *   Integrate PrimeVue `VirtualScroller` in `TasksView.vue` and `NotesView.vue`.
        *   Refactor `src/features/notes/store.js` to avoid N+1 queries in real-time handlers.
        *   Implement `supabase.from('topics').upsert(data, { onConflict: 'id' })` for batch topic reordering.
        *   Introduce memoization techniques (e.g., `computed` or custom caches) in Pinia stores and composables.
        *   Break down `src/components/layout/AppLayout.vue` into logical, smaller components.
        *   Configure `vite-plugin-visualizer` and analyze bundle.

#### US-007: Enhanced Session Management

*   **As a user**, I want my session to be managed securely and gracefully, **so that** I don't get unexpectedly logged out or face security risks.

    *   **Acceptance Criteria:**
        *   ✅ Session timeout is implemented and handled (e.g., automatically logs out after inactivity).
        *   ✅ JWT token refresh mechanism is implemented to extend active sessions without re-login.
        *   ✅ Expired or invalid sessions are detected and the user is prompted to re-authenticate.
        *   ✅ "Remember Me" functionality is available for persistent sessions.
    *   **UI/UX Considerations:**
        *   Clear warnings before session expiration.
        *   Seamless re-authentication flow.
        *   Checkbox for "Remember Me" on login page.
    *   **Technical Details:**
        *   Utilize Supabase built-in session management and token refresh capabilities.
        *   Implement logic in `src/stores/auth.js` to handle session events (`onAuthStateChange`) and refresh tokens.
        *   Store "Remember Me" preference (e.g., in localStorage) and use appropriate Supabase `signIn` options.

#### US-008: Comprehensive Error Handling

*   **As a user**, I want clear and helpful feedback when errors occur, **so that** I understand what went wrong and how to proceed.

    *   **Acceptance Criteria:**
        *   ✅ Global `ErrorBoundary.vue` component is utilized in all main views (`TasksView`, `NotesView`, `SchedulingView`, `SettingsView`).
        *   ✅ Comprehensive error message mappings are implemented for task and note operations.
        *   ✅ All asynchronous operations in `NotesView.vue` are wrapped in `try-catch` blocks.
        *   ✅ User-friendly error messages are displayed (e.g., toasts, inline messages).
        *   ✅ Input sanitization is implemented for all user-generated content (task fields, general inputs).
        *   ✅ Input validation for colors (hex format) is added in relevant components (`TopicDialog`, `StatusManager`, `CategoryManager`).
        *   ✅ URL parameters are sanitized and validated (e.g., UUID format).
    *   **UI/UX Considerations:**
        *   Consistent display of error messages (e.g., dedicated error toast service).
        *   Graceful fallback UI for critical errors.
    *   **Technical Details:**
        *   Integrate `ErrorBoundary.vue` in `App.vue` or root views.
        *   Create error mapping objects (e.g., `TASK_ERRORS`, `NOTE_ERRORS`) in respective stores.
        *   Apply `try-catch` and appropriate error state management in views and stores.
        *   Implement `DOMPurify` for input sanitization before data is sent to Supabase.
        *   Add regex-based validation for hex colors.

#### US-009: Testing Coverage & Automation

*   **As a developer**, I want high test coverage and automated test execution, **so that** I can confidently make changes and ensure application stability.

    *   **Acceptance Criteria:**
        *   ✅ Overall test coverage reaches 80%+ (lines, branches, functions, statements).
        *   ✅ Automated E2E tests are implemented using Playwright for critical user paths (e.g., account management).
        *   ✅ Visual regression testing is integrated into the CI/CD pipeline.
        *   ✅ Integration tests are added for complex workflows (e.g., notes creation, task filtering).
        *   ✅ Unit tests are added for all notes composables and components.
    *   **Technical Details:**
        *   Write new unit and integration tests following existing patterns.
        *   Develop Playwright test suites for key user flows.
        *   Configure Playwright for visual regression testing.
        *   Ensure CI/CD workflows (`.github/workflows/test.yml`) execute all tests and enforce coverage.

#### US-010: Code Quality & Maintainability Refinements

*   **As a developer**, I want a clean, well-documented, and modular codebase, **so that** it is easy to understand, maintain, and extend.

    *   **Acceptance Criteria:**
        *   ✅ All code duplication between `StatusManager.vue` and `CategoryManager.vue` is eliminated using a generic `ConfigItemManager.vue`.
        *   ✅ `NotesView.vue` (currently 544 lines) and `AppLayout.vue` (679 lines) are refactored into smaller, more focused components and composables.
        *   ✅ Comprehensive JSDoc comments are added to all store methods and composables.
        *   ✅ Consistent use of constants for "magic strings" throughout the codebase.
        *   ✅ Real-time subscription cleanup is implemented for all stores using subscriptions.
        *   ✅ Dialog components are lazy-loaded using `defineAsyncComponent`.
        *   ✅ Bundle analysis tooling is configured and used to monitor code size.
    *   **Technical Details:**
        *   Create `ConfigItemManager.vue` and refactor existing managers.
        *   Extract logic from large components into new components and/or composables.
        *   Add JSDoc for all public functions/methods/props in stores and composables.
        *   Create `src/constants.js` and replace hardcoded strings.
        *   Implement `onBeforeUnmount` hooks to unsubscribe from real-time channels.
        *   Modify `main.js` and view components to lazy-load dialogs.

### C. UX Polish & Onboarding

This section focuses on refining the user experience, particularly for new users, to ensure the application is not just functional but also welcoming and intuitive.

#### US-011: First-Time User Experience & Empty State Audit

*   **As a new user**, I want to be guided on what to do next when I encounter an empty part of the application, **so that** I can quickly understand how to get started and see value.

    *   **Acceptance Criteria:**
        *   ✅ Every view that can contain a list of user-generated content (Dashboard, Tasks, Notes, Meetings) is reviewed for its "empty state."
        *   ✅ Empty states must replace generic messages like "No items found" with helpful, action-oriented guidance.
        *   ✅ Each empty state should include:
            1.  A relevant icon.
            2.  A clear, friendly heading (e.g., "You have no tasks yet").
            3.  A brief, encouraging description (e.g., "Let's get you organized. Create your first task to get started!").
            4.  A primary Call-to-Action (CTA) button that initiates the primary action for that view (e.g., "Create New Task", "Write Your First Note").
        *   ✅ The design of the empty state should be consistent across the application.
    *   **UI/UX Considerations:**
        *   The tone should be encouraging and friendly.
        *   The CTA should be the most prominent element in the empty view.
    *   **Technical Details:**
        *   Create a reusable `EmptyState.vue` component in `src/components/common/` that accepts props for the icon, title, description, and CTA button text/action.
        *   Refactor existing views (`TasksView.vue`, `NotesView.vue`, etc.) to use this new component when their respective data lists are empty.

#### US-012: Contextual Feature Tour for New Users

*   **As a new user**, I want a brief, guided tour of the main features when I first visit a new section, **so that** I can quickly understand the layout and core functionality without having to guess.

    *   **Acceptance Criteria:**
        *   ✅ A short, contextual tour is triggered the first time a user visits a major view (Dashboard, Tasks, Notes, Scheduling).
        *   ✅ The tour highlights key UI elements (e.g., navigation, primary action buttons, filter controls).
        *   ✅ The user's completion of a tour is persisted to the database to prevent it from showing again.
        *   ✅ Users can skip the tour at any time.
        *   ✅ A "Replay Tour" option is available in the Settings or a Help section.
        *   ✅ The tour component styling is consistent with the application's theme (light/dark).
    *   **UI/UX Considerations:**
        *   The tour should be non-blocking and easy to dismiss.
        *   Each step should be concise, focusing on one key concept.
        *   Use a "highlight" or "spotlight" effect to focus the user's attention on the target element.
    *   **Technical Details:**
        *   **Primary Recommendation:** Implement using the built-in PrimeVue `Tour` component for style consistency and easy integration.
        *   **Database:** Add a `completed_tours TEXT[]` column to the `users_extended` table to store an array of completed tour names (e.g., `{'dashboard', 'tasks'}`). This can be done with the SQL migration: `ALTER TABLE users_extended ADD COLUMN IF NOT EXISTS completed_tours TEXT[] DEFAULT '{}';`
        *   **State Management:** Create a `useTour` composable or add logic to the `auth` store to check if a tour should be initiated for the current view and to mark tours as complete in the database.
        *   **Implementation:** Define tour steps within each relevant view (`DashboardView.vue`, `TasksView.vue`, etc.) and conditionally trigger the tour on mount based on the user's `completed_tours` profile data.

## 3. Database Schema Considerations 💾

The existing `users_extended` table is suitable for storing `full_name`, `preferred_timezone`, and `theme`. Password and email changes are handled directly by Supabase's `auth.users` table. Account deletion leverages the `ON DELETE CASCADE` foreign key constraint between `auth.users` and `users_extended` (and other user-data tables like `tasks`, `notes`, etc.).

No new tables are expected for Phase 5's core features. However, migration scripts might be needed to:

-   Add default values or constraints if current schema allows invalid states that need stricter validation.
-   Update any RLS policies to reflect enhanced update/delete logic for security.

## 4. Technical Architecture 🏗️

Phase 5 adheres to the established Vue 3, Pinia, and Supabase architecture. Key architectural impacts:

-   **Auth Store (`src/stores/auth.js`):** Will become the central point for all user account-related operations (password reset, email change, account deletion, session management).
-   **Settings View (`src/views/SettingsView.vue`):** A new top-level view will be created to house all user preferences and account management forms. This will likely involve several child components for modularity.
-   **Supabase Client Integration:** All sensitive operations will leverage the Supabase client's built-in methods, relying on its robust security features (e.g., email-based password reset flows).
-   **Global Error Handling:** Implementation of `ErrorBoundary` will establish a consistent pattern for catching and displaying unexpected errors across the application.
-   **Performance & Modularity:** Focus on breaking down monolithic components and optimizing data flows to maintain application speed and responsiveness.

## 5. Testing Strategy 🧪

The testing strategy for Phase 5 is critical, focusing on robustness for sensitive account features and comprehensive coverage for quality-of-life improvements.

-   **Unit Tests:**
    -   **High Priority:** All new and modified store actions (especially `auth.js`), composables, and utility functions must have 100% unit test coverage.
    -   **Focus:** Edge cases for password validation, email updates, account deletion logic.
-   **Component Tests:**
    -   **High Priority:** `SettingsView.vue` and its child components (profile form, password change form, delete account confirmation) will be thoroughly tested.
    -   **Focus:** UI interactions, form submission, error display, accessibility attributes.
-   **Integration Tests:**
    -   **High Priority:** End-to-end user flows for account management (e.g., initiate password reset, complete reset; update email, confirm email; delete account flow).
    -   **Focus:** Interaction between components, stores, and mocked Supabase API responses.
-   **E2E Tests (Playwright):**
    -   **Critical:** Automated E2E tests for the most sensitive features:
        -   Successful password reset.
        -   Successful email update and re-login.
        -   Successful account deletion and data removal verification.
        *   Navigation and interaction with `SettingsView`.
        *   Full accessibility checks across the application.
    *   **Visual Regression:** Use Playwright for visual regression testing to ensure UI consistency after refactoring and theme enhancements.

## 6. Dependencies and Risks ⚠️

-   **Dependencies:**
    -   **Supabase Auth:** Reliability and functionality of Supabase's authentication service for password reset and email changes.
    -   **Existing Database Schema:** Correctness of `ON DELETE CASCADE` policies for full data cleanup on account deletion.
    -   **Vue 3 & Pinia:** Stable API for component and state management.
-   **Risks:**
    -   **Security Vulnerabilities:** Improper implementation of account management features could introduce security risks (e.g., insecure password reset tokens, insufficient data validation).
        *   **Mitigation:** Strict adherence to Supabase best practices, thorough code review, security testing.
    -   **Data Loss:** Accidental account deletion or incomplete data cleanup.
        *   **Mitigation:** Multi-step confirmation, `ON DELETE CASCADE` RLS policies.
    -   **Performance Degradation:** Over-optimization or incorrect implementation of virtual scrolling/memoization could introduce new bugs or slow down the app.
        *   **Mitigation:** Careful implementation, performance profiling, A/B testing.
    -   **Accessibility Regressions:** Refactoring and new features might inadvertently introduce accessibility issues.
        *   **Mitigation:** Continuous accessibility testing (manual and automated), WCAG checklists.
    -   **Time Overruns:** The breadth of technical debt items might lead to extended development time.
        *   **Mitigation:** Clear prioritization, realistic estimation, iterative delivery.

## 7. Success Criteria ✅

Phase 5 is successfully completed when:

-   **Functional:** All specified user account management features (password reset, profile updates, account deletion) are fully implemented and tested.
-   **Quality:** All high-priority accessibility, performance, error handling, and code quality improvements identified in this spec are implemented.
-   **Testing:** Overall test coverage reaches 80%+ across all metrics, and critical E2E tests for account management pass reliably.
-   **Stability:** The application remains stable, fast, and secure with no new critical bugs introduced.
-   **User Experience:** The user experience for managing account settings and preferences is intuitive, clear, and reassuring.
-   **Documentation:** All new features and changes are clearly documented, including JSDoc comments and updated architectural diagrams if necessary.
