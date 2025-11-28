# Coordino - Code Review Task List

This file tracks issues, improvements, and tasks identified through code reviews. Tasks are prioritized by severity and impact.

---

## 🔴 Critical Priority

### Security & Data Integrity

- [x] **[SECURITY]** Replace native `confirm()` dialogs with accessible Dialog components
  - **Files**: `src/views/TasksView.vue:254`, `src/features/tasks/components/StatusManager.vue:212`, `src/features/tasks/components/CategoryManager.vue`
  - **Issue**: Browser confirm() can be spoofed, not accessible, blocks UI thread
  - **Action**: Create `ConfirmDialog.vue` component using PrimeVue Dialog, replace all confirm() calls
  - **Status**: ✅ Completed - Created ConfirmDialog component with proper ARIA attributes and severity levels

- [x] **[SECURITY]** Fix email validation regex vulnerability
  - **File**: `src/utils/validation.js:10`
  - **Current**: `/\S+@\S+\.\S+/` - too permissive, allows invalid emails
  - **Action**: Use RFC 5322 compliant regex or email-validator library
  - **Impact**: Prevents invalid emails in database
  - **Status**: ✅ Completed - Implemented RFC 5322 compliant regex with proper documentation

- [ ] **[SECURITY]** Remove production console.error() logging with sensitive data
  - **Files**: `src/stores/auth.js:154,186`, `src/features/tasks/store.js:82`, `src/main.js:35`
  - **Action**: Implement conditional logging (dev only), integrate Sentry for production
  - **Impact**: Prevents information disclosure via console

### Testing

- [ ] **[TESTING]** Implement unit tests for task store - ZERO real tests currently exist
  - **File**: `src/__tests__/auth.test.js` contains only placeholder tests
  - **Action**: Write tests for:
    - Task CRUD operations
    - Filter/sort utilities
    - Store state management
    - Auth flows
  - **Target**: 70%+ coverage before Phase 3

### Performance

- [x] **[PERFORMANCE]** Add pagination to task list to prevent scaling issues
  - **File**: `src/features/tasks/store.js:63-86`
  - **Issue**: `fetchTasks()` loads ALL tasks - breaks with 1000+ tasks
  - **Action**: Implement pagination (25-50 tasks per page) or virtual scrolling
  - **Impact**: Critical for user experience with large datasets
  - **Status**: ✅ Completed - Implemented pagination with 50 tasks per page, "Load More" button, and task count display

---

## 🟠 High Priority

### Security

- [ ] **[SECURITY]** Add input sanitization for user-generated content
  - **Files**: `src/features/tasks/components/TaskDialog.vue:326`, `src/features/tasks/components/TaskCard.vue:23`
  - **Issue**: While Vue escapes by default, stored XSS possible if v-html ever used
  - **Action**: Add DOMPurify validation for title, description, owner fields

- [ ] **[SECURITY]** Document and validate Row Level Security (RLS) enforcement
  - **File**: `src/composables/useSupabase.js:12-13`
  - **Issue**: Anon key exposed (expected) but no validation that RLS policies work
  - **Action**: Add automated RLS policy verification tests

- [ ] **[SECURITY]** Implement session timeout and token refresh handling
  - **File**: `src/stores/auth.js`
  - **Issue**: No token refresh on expiry, silent failures possible
  - **Action**: Implement Supabase JWT refresh mechanism with user warnings

- [ ] **[SECURITY]** Add CSRF token validation strategy
  - **File**: `src/router/index.js`
  - **Action**: Document CSRF protection strategy (Supabase handles server-side but client should validate)

### Code Quality & Maintainability

- [ ] **[REFACTOR]** Create comprehensive error message mapping for task operations
  - **Files**: `src/features/tasks/store.js:138-194`
  - **Issue**: Auth store has excellent error mapping, task store doesn't
  - **Action**: Create `TASK_ERRORS` mapping similar to `AUTH_ERRORS` in auth.js:24-47

- [ ] **[REFACTOR]** Eliminate code duplication between StatusManager and CategoryManager
  - **Files**: `src/features/tasks/components/StatusManager.vue`, `CategoryManager.vue`
  - **Issue**: 90%+ duplicate code
  - **Action**: Create generic `ConfigItemManager.vue` component with slots/props

- [ ] **[CODE QUALITY]** Add null safety checks for task data rendering
  - **File**: `src/features/tasks/components/TaskCard.vue:23,28,79,88`
  - **Issue**: `task.status`, `task.category` accessed without null checks
  - **Action**: Add defensive checks or use optional chaining

- [ ] **[CODE QUALITY]** Add comprehensive JSDoc type definitions
  - **Files**: All stores and utilities
  - **Action**: Add @typedef, @type, @param annotations for better IDE support

- [x] **[ARCHITECTURE]** Implement Supabase real-time subscriptions for tasks
  - **File**: `src/features/tasks/store.js`
  - **Issue**: Tasks fetched once, no real-time updates
  - **Action**: Add `.on('postgres_changes')` subscription in initialize()
  - **Impact**: Users see stale data if tasks updated elsewhere
  - **Status**: ✅ Completed - Implemented real-time subscriptions for INSERT, UPDATE, DELETE events with proper cleanup

- [ ] **[ARCHITECTURE]** Use ErrorBoundary in main app views
  - **File**: `src/components/common/ErrorBoundary.vue` exists but not used
  - **Action**: Wrap TasksView and other main views with ErrorBoundary

### Performance

- [ ] **[PERFORMANCE]** Optimize task filtering with memoization
  - **File**: `src/views/TasksView.vue:192-201`
  - **Issue**: Re-filters entire array on every change
  - **Action**: Implement memoization or move filtering to store with caching

- [ ] **[PERFORMANCE]** Reduce TaskCard re-renders with v-memo or virtual scrolling
  - **File**: `src/features/tasks/components/TaskCard.vue:155-186`
  - **Issue**: All cards re-render on any task change
  - **Action**: Add v-memo directive or implement virtual scrolling

- [ ] **[PERFORMANCE]** Split AppLayout into smaller sub-components
  - **File**: `src/components/layout/AppLayout.vue` - 679 lines
  - **Issue**: Single massive component, potential re-render bottleneck
  - **Action**: Extract `Sidebar.vue`, `MobileMenu.vue`, `UserMenu.vue`, `Navigation.vue`

### Accessibility (WCAG 2.1 AA)

- [x] **[A11Y]** Add aria-label to all icon-only buttons
  - **Files**: `src/features/tasks/components/TaskCard.vue:102-113`, `AppLayout.vue` navigation
  - **Issue**: Screen readers announce "button" instead of purpose
  - **Action**: Add descriptive aria-label to edit/delete/navigation buttons
  - **Status**: ✅ Completed - All icon-only buttons now have proper aria-label attributes

- [ ] **[A11Y]** Verify color contrast ratios for priority badges
  - **File**: `src/features/tasks/utils.js:20-45`
  - **Issue**: Badge colors not verified for WCAG AA compliance (4.5:1 ratio)
  - **Action**: Test all color combinations, adjust if needed

- [ ] **[A11Y]** Improve mobile menu keyboard navigation
  - **File**: `src/components/layout/AppLayout.vue:272-287`
  - **Issue**: Focus management exists but incomplete (no circular focus trap)
  - **Action**: Implement proper focus trap using focus-trap library

---

## 🟡 Medium Priority

### Security

- [ ] **[SECURITY]** Validate localStorage theme value against whitelist
  - **File**: `src/stores/theme.js:20`
  - **Action**: Check theme value is 'light' or 'dark' before applying

- [ ] **[SECURITY]** Validate color input in StatusManager/CategoryManager
  - **Files**: `src/features/tasks/components/StatusManager.vue:32`, `CategoryManager.vue`
  - **Action**: Validate hex color format before database insert

- [ ] **[SECURITY]** Add client-side rate limiting for API calls
  - **Files**: `src/features/tasks/store.js`, `src/stores/auth.js`
  - **Action**: Implement request debouncing and rate limiting

### Code Quality

- [ ] **[REFACTOR]** Create constants file to eliminate magic strings
  - **Issue**: Strings like 'created_at', 'status_id', 'task_categories' scattered throughout
  - **Action**: Create `src/constants.js` with database schema constants

- [ ] **[REFACTOR]** Convert PRIORITY_LEVELS to enum-like object
  - **File**: `src/features/tasks/utils.js:14`
  - **Current**: Array `['low', 'medium', 'high', 'urgent']`
  - **Action**: Export as `const PRIORITIES = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent' }`

- [ ] **[CODE QUALITY]** Add prop validation (required attribute) to all components
  - **Files**: All Vue components
  - **Action**: Mark required props, add type checking

- [ ] **[CODE QUALITY]** Consolidate dialog visibility state in TasksView
  - **File**: `src/views/TasksView.vue:170-175`
  - **Issue**: Three separate boolean refs for dialogs
  - **Action**: Use single `activeDialog` state with enum

- [ ] **[REFACTOR]** Extract task filtering logic into useTaskFiltering composable
  - **Issue**: Filtering logic split between component and utils
  - **Action**: Create `src/composables/useTaskFiltering.js`

### Architecture & Best Practices

- [ ] **[ARCHITECTURE]** Clarify store initialization strategy
  - **Issue**: authStore.initialize() in main.js, others on-demand - inconsistent
  - **Action**: Document and standardize initialization pattern

- [ ] **[ARCHITECTURE]** Implement cache invalidation strategy for tasks
  - **Issue**: fetchTasks() runs on every navigation even if data unchanged
  - **Action**: Add time-based or event-based cache with invalidation

- [ ] **[BEST PRACTICE]** Lazy load dialog components
  - **File**: `src/views/TasksView.vue:145-154`
  - **Issue**: All dialogs imported eagerly
  - **Action**: Use defineAsyncComponent for TaskDialog, StatusManager, CategoryManager

- [ ] **[BEST PRACTICE]** Add bundle analysis tooling
  - **File**: `vite.config.js`
  - **Action**: Install and configure `vite-plugin-visualizer`

### Performance

- [ ] **[PERFORMANCE]** Optimize image assets and add lazy loading
  - **Files**: `src/components/layout/AppLayout.vue:12-16`, `LoginView.vue:12-16`
  - **Action**: Compress logo images, consider WebP, lazy load non-critical images

- [ ] **[PERFORMANCE]** Cache parsed dates in task utilities
  - **File**: `src/features/tasks/utils.js:74,126,156-158`
  - **Action**: Memoize parseISO() calls for same dates

- [ ] **[PERFORMANCE]** Reduce scoped CSS in AppLayout, use Tailwind classes
  - **File**: `src/components/layout/AppLayout.vue:340-679`
  - **Action**: Replace custom scoped styles with Tailwind utilities where possible

### Testing

- [ ] **[TESTING]** Add integration tests for task workflows
  - **Action**: Test complete flows: create → filter → edit → delete → complete

- [ ] **[TESTING]** Add E2E tests with Playwright
  - **Tests needed**:
    - Task CRUD operations
    - Filtering and sorting
    - Status/Category management
    - Authentication flows
    - Keyboard navigation

- [ ] **[TESTING]** Add automated accessibility tests
  - **Action**: Integrate jest-axe or axe-core for a11y regression testing

### Accessibility

- [ ] **[A11Y]** Test and improve form label associations
  - **File**: `src/features/tasks/components/TaskDialog.vue:18-33`
  - **Action**: Verify all inputs properly associated with labels

- [ ] **[A11Y]** Add prefers-reduced-motion media queries
  - **File**: `src/components/layout/AppLayout.vue:660-678`
  - **Action**: Wrap animations with `@media (prefers-reduced-motion: no-preference)`

### UX Improvements

- [ ] **[UX]** Add loading indicator to auth initialization in `src/main.js:60-62` - Currently app shows nothing while auth initializes
- [ ] **[UX]** Implement "Remember Me" functionality for persistent sessions
- [ ] **[UX]** Add "Forgot Password" flow with password reset email
- [ ] **[UX]** Add email verification status indicator and resend verification email option
- [ ] **[UX]** Improve mobile menu animations and add haptic feedback consideration

---

## 🟢 Low Priority

### Documentation

- [x] **[DOCS]** Create `.env.example` file with template environment variables and instructions
- [ ] **[DOCS]** Add JSDoc comments to all store methods and composables
- [ ] **[DOCS]** Document component props and events using JSDoc or Vue's defineProps with types
- [ ] **[DOCS]** Add inline comments explaining complex authentication flows
- [ ] **[DOCS]** Standardize documentation across all components (some well-documented, others not)

### Code Cleanup

- [x] **[CLEANUP]** Remove unused `HelloWorld.vue` component
- [ ] **[CLEANUP]** Remove `nul` file from repository (shown in git status)
- [ ] **[CLEANUP]** Clean up duplicate dark mode styling in AppLayout - Some styles are repeated for dark mode
- [ ] **[CLEANUP]** Remove or verify unused imports (e.g., `src/features/tasks/utils.js:8`)

### Style & Consistency

- [ ] **[STYLE]** Consider consolidating similar transition animations into a shared CSS class
- [ ] **[STYLE]** Add consistent focus-visible styles for keyboard navigation across all interactive elements
- [ ] **[STYLE]** Establish naming conventions (taskId vs task.id, $event vs explicit params)

### Enhancements

- [ ] **[ENHANCEMENT]** Add animation for theme transitions (smooth color change between light/dark)
- [ ] **[ENHANCEMENT]** Add keyboard shortcuts (e.g., Ctrl+K for quick navigation)
- [ ] **[ENHANCEMENT]** Implement proper SEO meta tags and Open Graph tags for social sharing
- [ ] **[ENHANCEMENT]** Add favicon and app icons for different platforms
- [ ] **[ENHANCEMENT]** Add feature flags system (even simple localStorage-based)
- [ ] **[ENHANCEMENT]** Add language attribute to HTML element (`lang="en"`)

### Performance

- [ ] **[PERFORMANCE]** Optimize images (logo, etc.) - Consider using WebP format with fallbacks

---

## Completed Tasks ✅

### Phase 1
- [x] Create environment variable validation with detailed error messages
- [x] Create `.env.example` template
- [x] Enhance error handling with user-friendly messages
- [x] Add ARIA attributes for form validation
- [x] Implement focus management for mobile menu
- [x] Add skip-to-main-content link
- [x] Optimize bundle with local component imports
- [x] Create comprehensive JSDoc documentation
- [x] Implement ErrorBoundary component
- [x] Extract validation utilities (DRY principle)

### Phase 2
- [x] Create task feature structure
- [x] Build task store with CRUD operations
- [x] Create TaskCard, TaskDialog, TaskList, TaskFilters components
- [x] Create StatusManager and CategoryManager
- [x] Implement filtering, sorting, and grouping
- [x] Build TasksView with statistics
- [x] Migrate to PrimeVue 4.x components (Select, DatePicker)
- [x] Fix TaskDialog initialization bug
- [x] Remove unused HelloWorld.vue component

---

## Review Statistics

- **Last Review Date**: 2025-11-28
- **Total Files Reviewed**: 25+ Vue components and JS modules
- **Total Lines of Code**: ~5,435 lines (src/ directory)
- **Critical Issues Found**: 5
- **High Priority Issues**: 17
- **Medium Priority Issues**: 16
- **Low Priority Issues**: 8

**Overall Assessment**: Phase 2 implementation is solid with good Vue 3 practices. However, security issues (input validation, dialog handling), missing tests, and scalability concerns (pagination) should be addressed before Phase 3.

---

## Priority Recommendations for Phase 2 Completion

1. ✅ Replace all `confirm()` with accessible Dialog component - COMPLETED
2. ✅ Implement pagination for task list - COMPLETED
3. ✅ Fix email validation regex - COMPLETED
4. ✅ Add ARIA labels to icon buttons - COMPLETED
5. ✅ Implement real-time subscriptions - COMPLETED

**Before Phase 3**:
6. Write unit tests for stores (minimum)
7. Create constants file
8. Extract task logic into composables
9. Split AppLayout into sub-components
10. Add comprehensive JSDoc types
