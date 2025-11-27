# Coordino - Code Review Task List

This file tracks issues, improvements, and tasks identified through code reviews. Tasks are prioritized by severity and impact.

## 🟡 Medium Priority

- [ ] **[UX]** Add loading indicator to auth initialization in `src/main.js:60-62` - Currently app shows nothing while auth initializes
- [ ] **[UX]** Implement "Remember Me" functionality for persistent sessions
- [ ] **[UX]** Add "Forgot Password" flow with password reset email
- [ ] **[UX]** Add email verification status indicator and resend verification email option
- [ ] **[UX]** Improve mobile menu animations and add haptic feedback consideration
- [ ] **[TESTING]** Add comprehensive unit tests for auth store (`src/stores/auth.js`) - Currently only basic test file exists
- [ ] **[TESTING]** Add E2E tests for authentication flows (login, signup, magic link)
- [ ] **[TESTING]** Add tests for theme store and persistence
- [ ] **[TESTING]** Add tests for router navigation guards
- [ ] **[REFACTOR]** Extract user display name logic from `DashboardView.vue:185-194` and `AppLayout.vue:174-183` into a composable (`useUser.js`)
- [ ] **[REFACTOR]** Extract time-of-day greeting logic from `DashboardView.vue:177-182` into a utility function
- [ ] **[REFACTOR]** Consider separating auth state from auth actions in store (follow CQRS pattern)
- [ ] **[CODE QUALITY]** Add .editorconfig file to ensure consistent code formatting across team

## 🟢 Low Priority

- [ ] **[DOCS]** Create `.env.example` file with template environment variables and instructions
- [ ] **[DOCS]** Add JSDoc comments to all store methods and composables
- [ ] **[DOCS]** Document component props and events using JSDoc or Vue's defineProps with types
- [ ] **[DOCS]** Add inline comments explaining complex authentication flows
- [ ] **[CLEANUP]** Remove unused `HelloWorld.vue` component in `src/components/HelloWorld.vue`
- [ ] **[CLEANUP]** Remove `nul` file from repository (shown in git status)
- [ ] **[CLEANUP]** Clean up duplicate dark mode styling in AppLayout - Some styles are repeated for dark mode
- [ ] **[STYLE]** Consider consolidating similar transition animations into a shared CSS class
- [ ] **[STYLE]** Add consistent focus-visible styles for keyboard navigation across all interactive elements
- [ ] **[ENHANCEMENT]** Add animation for theme transitions (smooth color change between light/dark)
- [ ] **[ENHANCEMENT]** Add keyboard shortcuts (e.g., Ctrl+K for quick navigation)
- [ ] **[ENHANCEMENT]** Implement proper SEO meta tags and Open Graph tags for social sharing
- [ ] **[ENHANCEMENT]** Add favicon and app icons for different platforms
- [ ] **[PERFORMANCE]** Optimize images (logo, etc.) - Consider using WebP format with fallbacks
