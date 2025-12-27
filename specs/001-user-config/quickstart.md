# Quickstart Guide: User & Application Configuration

**Feature**: `001-user-config`
**Branch**: `001-user-config`
**Date**: 2025-12-27

## Overview

This quickstart guide provides step-by-step instructions for setting up your development environment, running migrations, installing dependencies, and testing the User & Application Configuration feature.

---

## Prerequisites

**Required**:
- Node.js 18.x or higher
- npm 9.x or higher
- Git 2.x or higher
- Supabase CLI (`npm install -g supabase`)
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Accounts**:
- Supabase account with project created
- Vercel account (for deployment, optional for local development)

**Environment**:
- Development database: Supabase development project
- Production database: Supabase production project (separate instance)

---

## Setup Instructions

### 1. Clone Repository and Switch to Feature Branch

```bash
# Clone repository
git clone https://github.com/your-org/coordino.git
cd coordino

# Fetch latest changes
git fetch origin

# Create and switch to feature branch
git checkout -b 001-user-config
```

### 2. Install Dependencies

```bash
# Install existing dependencies
npm install

# Install new dependencies for this feature
npm install --save vue-virtual-scroller@^2.0.0-beta.8
npm install --save jszip@^3.10.1
npm install --save papaparse@^5.4.1
```

**New Dependencies Explained**:
- `vue-virtual-scroller`: Virtual scrolling for performance with 1,000+ item lists
- `jszip`: Browser-based ZIP archive creation for data export
- `papaparse`: CSV generation with proper escaping and formatting

### 3. Environment Configuration

**Create `.env.local` file** (if not exists):
```bash
cp .env.example .env.local
```

**Add Supabase credentials** (from Supabase Dashboard > Settings > API):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Verify configuration**:
```bash
# Test Supabase connection
npm run dev
# Navigate to http://localhost:5173
# Try logging in to verify Supabase connection works
```

### 4. Database Migration

**Apply migration to add `completed_tours` column**:

**Option A: Using Supabase CLI** (Recommended for local development)
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create migration file
supabase migration new add_completed_tours_to_users_extended

# Copy migration SQL from specs/001-user-config/data-model.md
# Paste into: supabase/migrations/YYYYMMDDHHMMSS_add_completed_tours_to_users_extended.sql

# Apply migration
supabase db push
```

**Option B: Using Supabase Dashboard** (For production)
1. Navigate to Supabase Dashboard > SQL Editor
2. Create new query
3. Paste migration SQL from `specs/001-user-config/data-model.md`
4. Click "Run"
5. Verify with: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users_extended';`

**Migration SQL** (copy from data-model.md):
```sql
BEGIN;

ALTER TABLE users_extended
ADD COLUMN completed_tours TEXT[] DEFAULT '{}';

COMMENT ON COLUMN users_extended.completed_tours IS
  'Array of feature tour identifiers completed by user. ' ||
  'Example values: ["tasks_intro", "notes_intro", "scheduling_intro"]. ' ||
  'Used to prevent repeated display of contextual onboarding tours.';

COMMIT;
```

**Verify migration**:
```bash
# Check column exists
supabase db inspect

# Or via SQL Editor:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users_extended'
  AND column_name = 'completed_tours';

# Expected output:
# completed_tours | ARRAY | '{}'::text[]
```

### 5. Customize Supabase Email Templates

**Password Reset Email Template**:

1. Navigate to Supabase Dashboard > Authentication > Email Templates
2. Select "Reset Password" template
3. Update subject: `Reset your Coordino password`
4. Update body HTML (apply brand teal #14b8a6 to CTA button):

```html
<h2>Reset your password</h2>
<p>Hi there,</p>
<p>We received a request to reset your Coordino password.</p>
<p>Click the button below to create a new password:</p>

<a href="{{ .ConfirmationURL }}"
   style="
     background-color: #14b8a6;
     color: #ffffff;
     padding: 12px 24px;
     text-decoration: none;
     border-radius: 6px;
     display: inline-block;
     font-weight: 600;
     margin: 16px 0;
   ">
  Reset Password
</a>

<p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
  This link will expire in 24 hours. If you didn't request a password reset,
  you can safely ignore this email.
</p>

<p style="color: #6b7280; font-size: 14px;">
  If the button doesn't work, copy and paste this link into your browser:<br>
  {{ .ConfirmationURL }}
</p>
```

5. Click "Save"
6. Test by requesting password reset from login page

---

## Development Workflow

### 1. Start Development Server

```bash
# Start Vite dev server with hot module reload
npm run dev

# Server runs at http://localhost:5173
# Auto-reloads on file changes
```

### 2. Run Tests

**Unit Tests**:
```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode (recommended during development)
npm run test:unit -- --watch

# Run tests with coverage
npm run test:coverage
```

**Integration Tests**:
```bash
# Run integration tests
npm run test:integration

# Run specific test file
npm run test:integration src/components/settings/__tests__/integration/profile-update.test.js
```

**E2E Tests** (requires dev server running):
```bash
# Start dev server in one terminal
npm run dev

# Run E2E tests in another terminal
npm run test:e2e

# Run specific E2E test
npm run test:e2e tests/e2e/password-reset.spec.js

# Run in headed mode (see browser)
npm run test:e2e -- --headed
```

### 3. Code Quality Checks

**Linting**:
```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

**Formatting**:
```bash
# Check code formatting
npm run format:check

# Auto-format code
npm run format
```

### 4. Type Checking (JSDoc)

While the project doesn't use TypeScript, complex functions should have JSDoc comments:

```javascript
/**
 * Validates password strength against security requirements
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result with error messages
 */
const validatePassword = (password) => {
  // Implementation...
}
```

---

## Testing the Feature

### Manual Testing Checklist

**Password Reset Flow**:
- [ ] Navigate to `/login` and click "Forgot Password"
- [ ] Enter email address and submit
- [ ] Check email inbox for password reset link
- [ ] Click link and verify redirect to `/reset-password`
- [ ] Enter new password (test validation: <8 chars should fail)
- [ ] Submit new password and verify success message
- [ ] Login with new password and verify access granted
- [ ] Verify all other sessions logged out (test in incognito window)

**Profile & Preferences**:
- [ ] Navigate to `/settings` and click "Profile" tab
- [ ] Update display name and click "Save"
- [ ] Verify name updates in header within 5 seconds
- [ ] Change timezone (e.g., America/New_York → Europe/London)
- [ ] Verify time displays update throughout app
- [ ] Toggle theme (Light ↔ Dark) and verify immediate change
- [ ] Refresh page and verify theme persists
- [ ] Open second tab, change theme, verify first tab updates in real-time

**Account Deletion**:
- [ ] Navigate to `/settings` and click "Account Management"
- [ ] Click "Delete Account"
- [ ] Verify warning dialog appears
- [ ] Type "DELETE" in confirmation field
- [ ] Submit deletion and verify redirect to login page
- [ ] Attempt to login with deleted account credentials
- [ ] Verify error: "Account does not exist"

**Data Export**:
- [ ] Create test data: 10 tasks, 5 notes, 2 topics, 1 meeting
- [ ] Navigate to `/settings` and click "Data Export"
- [ ] Click "Export All My Data"
- [ ] Verify loading indicator appears
- [ ] Wait for download to trigger
- [ ] Extract ZIP file and verify structure:
  - README.txt exists
  - json/full_export.json exists and is valid JSON
  - csv/tasks.csv exists with 10 rows + header
  - csv/notes.csv exists with 5 rows + header
- [ ] Open tasks.csv in Excel/Google Sheets and verify readability

**Accessibility**:
- [ ] Navigate entire Settings area using only keyboard (Tab, Enter, Escape)
- [ ] Verify all interactive elements receive visible focus indicators
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver):
  - All form labels announced correctly
  - Success/error messages announced
  - Button purposes clear
- [ ] Check color contrast with browser DevTools:
  - Text contrast ≥ 4.5:1
  - Large text/UI components ≥ 3:1

**Performance**:
- [ ] Create 150 tasks in database (via Supabase SQL Editor)
- [ ] Navigate to Tasks view
- [ ] Verify smooth scrolling (60fps, no jank)
- [ ] Verify virtual scrolling enabled (inspect DOM: <30 task elements rendered)
- [ ] Search for specific task
- [ ] Verify results appear within 1 second

**Session Timeout**:
- [ ] Login to application
- [ ] Wait 28 minutes (or reduce INACTIVITY_TIMEOUT in code for testing)
- [ ] Verify warning dialog appears: "Your session will expire in 2 minutes"
- [ ] Click "Extend Session"
- [ ] Verify warning closes and user remains logged in
- [ ] Wait additional 2 minutes (30 minutes total inactivity)
- [ ] Verify automatic logout and redirect to login page

**Feature Tours** (Onboarding):
- [ ] Create new user account (or reset completed_tours in database)
- [ ] Login and navigate to Tasks view
- [ ] Verify feature tour appears with "Tasks Intro" content
- [ ] Complete or skip tour
- [ ] Refresh page and verify tour does NOT reappear
- [ ] Navigate to Notes view
- [ ] Verify "Notes Intro" tour appears (different content)

---

## Debugging Tips

### Common Issues

**Issue**: Migration fails with "relation already exists"
**Solution**:
```sql
-- Rollback and retry
ALTER TABLE users_extended DROP COLUMN IF EXISTS completed_tours;
-- Then re-run migration
```

**Issue**: Theme changes don't persist across page refreshes
**Solution**:
```javascript
// Check localStorage in browser DevTools console
localStorage.getItem('coordino:theme')

// Should return "light" or "dark"
// If null, check PreferencesSettings.vue save logic
```

**Issue**: Virtual scrolling not working (all 1000+ tasks rendered)
**Solution**:
```javascript
// Verify vue-virtual-scroller installed
npm list vue-virtual-scroller

// Check TasksView.vue uses RecycleScroller component
// Verify :items prop bound correctly
```

**Issue**: Data export download blocked by browser
**Solution**:
1. Check browser DevTools Console for errors
2. Verify file-saver library loaded: `import { saveAs } from 'file-saver'`
3. Check browser download settings (allow pop-ups for localhost)
4. Test in different browser

**Issue**: Password reset email not received
**Solution**:
1. Check Supabase Dashboard > Authentication > Logs for email sent confirmation
2. Verify email template enabled in Dashboard > Email Templates
3. Check spam/junk folder
4. Test with different email provider (Gmail, Outlook, etc.)
5. For development: Use Supabase email trap (Dashboard > Settings > Email)

### Development Console Helpers

**Check current user session**:
```javascript
// In browser console
const { data: { session } } = await supabase.auth.getSession()
console.log(session)
```

**Manually trigger feature tour**:
```javascript
// Reset completed tours for current user
await supabase.from('users_extended')
  .update({ completed_tours: [] })
  .eq('id', session.user.id)

// Reload page to see tours again
```

**Check RLS policy enforcement**:
```javascript
// Try to fetch another user's profile (should return empty)
const { data } = await supabase
  .from('users_extended')
  .select('*')
  .eq('id', 'some-other-user-id')

console.log(data)  // Should be empty due to RLS
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing (`npm run test:unit && npm run test:integration`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Code coverage ≥ 80% (`npm run test:coverage`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Migration applied to production database
- [ ] Supabase email templates customized in production project
- [ ] Environment variables configured in Vercel

### Deploy to Vercel

**Option A: Automatic Deployment** (Recommended)
```bash
# Push to GitHub
git add .
git commit -m "feat: Add user & application configuration (001-user-config)"
git push origin 001-user-config

# Create pull request on GitHub
# Vercel preview deployment auto-triggers

# After PR approval, merge to main
# Production deployment auto-triggers
```

**Option B: Manual Deployment via Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment Verification

**Production Smoke Tests**:
- [ ] Navigate to https://coordino.app/login
- [ ] Test password reset flow with real email
- [ ] Login and navigate to Settings
- [ ] Update profile and verify changes persist
- [ ] Test data export and download archive
- [ ] Verify theme toggle works and persists
- [ ] Check browser console for errors
- [ ] Test on mobile device (iOS Safari, Android Chrome)

---

## Support & Documentation

**Technical Documentation**:
- Feature Specification: `specs/001-user-config/spec.md`
- Implementation Plan: `specs/001-user-config/plan.md` (this file's parent)
- Data Model: `specs/001-user-config/data-model.md`
- API Contracts: `specs/001-user-config/contracts/`

**External Documentation**:
- Supabase Auth: https://supabase.com/docs/guides/auth
- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- PrimeVue Components: https://primevue.org/
- Vitest Testing: https://vitest.dev/guide/
- Playwright E2E: https://playwright.dev/docs/intro

**Context7 Library Documentation** (use during development):
```bash
# Example: Get latest Supabase Auth docs
npx @context7/cli resolve supabase-js
npx @context7/cli docs supabase-js auth.resetPasswordForEmail

# Example: Get latest PrimeVue Dialog docs
npx @context7/cli resolve primevue
npx @context7/cli docs primevue dialog
```

**Getting Help**:
- Project README: `README.md`
- Architecture documentation: `docs/ARCHITECTURE.md`
- Design guidelines: `docs/DESIGN_GUIDELINES.md`
- Testing strategy: `docs/TESTING_STRATEGY.md`

---

## Next Steps

After completing this quickstart:

1. **Review Constitution Compliance**: Verify your implementation adheres to `specs/001-user-config/plan.md` Constitution Check
2. **Run Task Generation**: Execute `/speckit.tasks` command to generate implementation tasks from this plan
3. **Begin Implementation**: Follow task order in `specs/001-user-config/tasks.md` (generated by `/speckit.tasks`)
4. **Test-First Development**: Write tests BEFORE implementation for each task
5. **Incremental Commits**: Commit after each completed task with descriptive messages

**Recommended Implementation Order** (from plan.md):
- Phase 1: Settings UI (SettingsView, ProfileSettings, PreferencesSettings)
- Phase 2: Password Reset (usePasswordReset composable, email flow)
- Phase 3: Data Export (useDataExport, JSON/CSV generation)
- Phase 4: Accessibility (ARIA labels, keyboard navigation, focus management)
- Phase 5: Performance (Virtual scrolling, session timeout)
- Phase 6: Onboarding (EmptyState, FeatureTour components)

---

## Troubleshooting FAQ

**Q: How do I reset my local database to a clean state?**
A:
```bash
# Using Supabase CLI
supabase db reset

# Or manually via SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
# Then re-run all migrations
```

**Q: How do I test password reset email without sending real emails?**
A:
```bash
# Use Supabase local development with Inbucket email trap
supabase start
# Emails viewable at: http://localhost:54324
```

**Q: Why is virtual scrolling not activating?**
A: Check that your list has >100 items (FR-029, FR-030). Virtual scrolling only enables for large lists.

**Q: How do I manually complete a feature tour for testing?**
A:
```javascript
// In browser console
await supabase.from('users_extended')
  .update({
    completed_tours: ['tasks_intro', 'notes_intro', 'scheduling_intro', 'settings_intro']
  })
  .eq('id', '<your-user-id>')
```

**Q: Data export failing with "CORS error"**
A: JSZip runs client-side, no CORS issue should occur. If error persists:
1. Clear browser cache
2. Check browser console for actual error
3. Verify jszip installed: `npm list jszip`

---

## Summary

This quickstart covered:
- ✅ Environment setup and dependency installation
- ✅ Database migration for `completed_tours` column
- ✅ Supabase email template customization
- ✅ Development workflow (dev server, testing, linting)
- ✅ Manual testing procedures for all 9 user stories
- ✅ Debugging tips and common issues
- ✅ Deployment process to Vercel
- ✅ Links to supporting documentation

**Ready to start implementation!** Proceed to `/speckit.tasks` command to generate actionable task list.
