# Test Setup Guide

## Prerequisites for E2E Tests

Before running E2E tests, you need to create test users in your Supabase database.

### Required Test Users

Create the following users via Supabase Dashboard (Authentication > Users):

1. **New User** (for onboarding and empty state tests)
   - Email: `newuser@example.com`
   - Password: `TestPassword123!`
   - Purpose: Tests empty states, feature tours, first-time user experience

2. **Test User** (for general E2E tests)
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Purpose: Tests with existing data, profile updates, settings

### Creating Test Users

#### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add user** > **Create new user**
4. Enter email and password
5. Click **Create user**
6. Repeat for both test users

#### Option 2: Via SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Note: Replace with actual hashed passwords or use Supabase Auth API
-- This is just for reference - use the Dashboard method above
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES
  ('newuser@example.com', 'hashed_password', NOW()),
  ('test@example.com', 'hashed_password', NOW());
```

#### Option 3: Via Sign-Up Flow

1. Start the development server: `npm run dev`
2. Navigate to `/login` and click "Sign Up"
3. Create both test users using the sign-up form

### Running Tests

Once test users are created:

```bash
# Run all E2E tests (includes auth setup)
npm run test:e2e

# Run only unit tests
npm run test:unit

# Run specific E2E test file
npx playwright test tests/e2e/onboarding.spec.js

# Run with UI mode (helpful for debugging)
npx playwright test --ui
```

### Authentication State

The auth setup (`tests/e2e/auth.setup.js`) automatically:
1. Logs in as each test user via the UI
2. Saves authentication state to `tests/e2e/.auth/`
3. Reuses this state across all tests (no need to log in for every test)

Authentication state files are gitignored and regenerated on each test run.

### Troubleshooting

**"Test timeout" or "Failed to login"**
- Verify test users exist in Supabase
- Check that passwords match exactly: `TestPassword123!`
- Ensure dev server is running on `http://localhost:5173`

**"Cannot find test users"**
- Create the test users following the instructions above
- Verify email confirmation is not required in Supabase settings

**"Tests pass locally but fail in CI"**
- Set up test users in your CI Supabase project
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to CI environment variables

## Test Structure

```
tests/
├── README.md                 # This file
├── e2e/                      # End-to-end tests (Playwright)
│   ├── .auth/               # Saved authentication states (gitignored)
│   ├── auth.setup.js        # Authentication setup (runs first)
│   ├── onboarding.spec.js   # US9: Empty states & feature tours
│   ├── profile-update.spec.js
│   └── ...
├── integration/             # Integration tests (Vitest)
│   ├── settings/
│   ├── export/
│   └── error-handling/
└── unit/                    # Unit tests (Vitest)
    ├── composables/
    ├── utils/
    └── scheduling/
```

## Coverage Requirements

The specification requires 80% test coverage (FR Testing Strategy, SC-015, SC-016).

Run coverage report:
```bash
npm run test:coverage
```
