# API Contract: Profile & Preferences Management

**Feature**: `001-user-config`
**Contract Type**: Supabase Database + Auth Integration
**Date**: 2025-12-27

## Overview

This contract defines interactions between the Coordino frontend and Supabase for managing user profile information and application preferences, including real-time synchronization across sessions.

---

## 1. Load User Profile

### Request

**Method**: Supabase `select` query on `users_extended` table

**Query**:
```javascript
const { data, error } = await supabase
  .from('users_extended')
  .select('id, full_name, preferred_timezone, date_format, theme, completed_tours, created_at, updated_at')
  .eq('id', userId)
  .single()
```

**Parameters**:
- `userId`: Authenticated user's UUID from `auth.uid()`

### Response

**Success** (HTTP 200):
```javascript
{
  data: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    full_name: "Jane Doe",
    preferred_timezone: "America/New_York",
    date_format: "MM/DD/YYYY",
    theme: "dark",
    completed_tours: ["tasks_intro", "notes_intro"],
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-12-27T14:22:00Z"
  },
  error: null
}
```

**Error** (HTTP 400):
```javascript
{
  data: null,
  error: {
    message: "No rows found",
    code: "PGRST116"
  }
}
```

### Error Scenarios

| Error Code | Message | Handling |
|------------|---------|----------|
| PGRST116 | "No rows found" | Create default profile row (new user setup) |
| PGRST301 | "RLS policy violation" | Re-authenticate user (session expired) |
| 500 | "Database connection error" | Retry with exponential backoff + show offline message |

### Row Level Security

**Policy** (from ARCHITECTURE.md):
```sql
CREATE POLICY "Users can view own profile"
  ON users_extended FOR SELECT
  USING (auth.uid() = id);
```

**Enforcement**:
- Query automatically filtered to current user
- Attempting to access another user's profile returns empty result set
- No error thrown (PostgreSQL RLS silently filters)

---

## 2. Update Profile Information

### Request

**Method**: Supabase `update` query on `users_extended` table

**Query**:
```javascript
const { data, error } = await supabase
  .from('users_extended')
  .update({
    full_name: updatedName,
    updated_at: new Date().toISOString()
  })
  .eq('id', userId)
  .select()
  .single()
```

**Allowed Fields**:
```javascript
{
  full_name: string | null,          // Display name (shown in header, profile)
  preferred_timezone: string,         // IANA timezone identifier
  date_format: string,                // Date display format
  theme: "light" | "dark",            // UI theme preference
  completed_tours: string[],          // Tour completion tracking
  updated_at: ISO 8601 timestamp      // Required for optimistic concurrency
}
```

### Validation

**Client-Side Validation**:
```javascript
const validateProfileUpdate = (updates) => {
  const errors = {}

  // Full name (optional but max 100 chars if provided)
  if (updates.full_name && updates.full_name.length > 100) {
    errors.full_name = 'Name cannot exceed 100 characters'
  }

  // Timezone (must be valid IANA identifier)
  if (updates.preferred_timezone && !isValidTimezone(updates.preferred_timezone)) {
    errors.preferred_timezone = 'Invalid timezone'
  }

  // Date format (must be one of allowed formats)
  const validFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
  if (updates.date_format && !validFormats.includes(updates.date_format)) {
    errors.date_format = 'Invalid date format'
  }

  // Theme (enum check)
  if (updates.theme && !['light', 'dark'].includes(updates.theme)) {
    errors.theme = 'Theme must be "light" or "dark"'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Helper: Validate IANA timezone
const isValidTimezone = (tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch (error) {
    return false
  }
}
```

**Server-Side Validation** (Database Constraints):
```sql
-- From ARCHITECTURE.md users_extended schema
CHECK (theme IN ('light', 'dark'))  -- Enforced at database level
NOT NULL constraints on preferred_timezone, date_format, theme
```

### Response

**Success** (HTTP 200):
```javascript
{
  data: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    full_name: "Jane Smith",  // Updated value
    preferred_timezone: "America/New_York",
    date_format: "MM/DD/YYYY",
    theme: "dark",
    completed_tours: ["tasks_intro", "notes_intro"],
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-12-27T15:45:00Z"  // New timestamp
  },
  error: null
}
```

**Error** (HTTP 400):
```javascript
{
  data: null,
  error: {
    message: 'new row for relation "users_extended" violates check constraint "users_extended_theme_check"',
    code: "23514"
  }
}
```

### Error Scenarios

| Error Code | Message | Handling |
|------------|---------|----------|
| 23514 | "Check constraint violation" | Show: "Invalid theme value. Please select Light or Dark." |
| 23502 | "NOT NULL constraint violation" | Show: "Timezone is required" |
| PGRST301 | "RLS policy violation" | Re-authenticate user |

### Row Level Security

**Policy** (from ARCHITECTURE.md):
```sql
CREATE POLICY "Users can update own profile"
  ON users_extended FOR UPDATE
  USING (auth.uid() = id);
```

**Enforcement**:
- Update only applies to rows where `id = auth.uid()`
- Attempting to update another user's profile silently fails (0 rows affected)

---

## 3. Change Email Address

### Request

**Method**: Supabase Auth `updateUser` with email

**Query**:
```javascript
const { data, error } = await supabase.auth.updateUser({
  email: newEmail
})
```

**Process Flow**:
1. Client calls `updateUser({ email })`
2. Supabase sends confirmation email to NEW email address
3. User clicks confirmation link in email
4. Supabase updates `auth.users.email` and marks as confirmed
5. Old email receives notification of change

### Re-Authentication Requirement (FR-007)

**Security Check**:
```javascript
const changeEmail = async (newEmail, currentPassword) => {
  // Step 1: Re-authenticate with current password
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: currentUser.email,
    password: currentPassword
  })

  if (authError) {
    throw new Error('Current password is incorrect')
  }

  // Step 2: Request email change
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail
  })

  if (error) throw error

  return data
}
```

### Response

**Success** (HTTP 200):
```javascript
{
  data: {
    user: {
      id: "uuid",
      email: "newemail@example.com",  // New email (unconfirmed)
      email_confirmed_at: null,        // NULL until confirmation
      new_email: "newemail@example.com",
      updated_at: "2025-12-27T10:30:00Z"
    }
  },
  error: null
}
```

**Email Confirmation Flow**:
- User receives email at `newemail@example.com` with confirmation link
- Clicking link confirms new email and updates `email_confirmed_at`
- Until confirmed, old email remains active for login

**Error** (HTTP 400):
```javascript
{
  data: null,
  error: {
    message: "Email already in use",
    status: 400
  }
}
```

### Error Scenarios

| Error Code | Message | Handling |
|------------|---------|----------|
| 400 | "Email already in use" | Show: "This email is already registered. Please use a different email." |
| 400 | "Invalid email format" | Show inline validation error |
| 401 | "Current password incorrect" | Show: "Current password is incorrect. Please try again." |

---

## 4. Change Password (While Logged In)

### Request

**Method**: Supabase Auth `updateUser` with password

**Query**:
```javascript
const { data, error } = await supabase.auth.updateUser({
  password: newPassword
})
```

### Re-Authentication Requirement (FR-008)

**Security Check**:
```javascript
const changePassword = async (currentPassword, newPassword) => {
  // Step 1: Re-authenticate with current password
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: currentUser.email,
    password: currentPassword
  })

  if (authError) {
    throw new Error('Current password is incorrect')
  }

  // Step 2: Validate new password
  const validation = validatePassword(newPassword)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  // Step 3: Update password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) throw error

  return data
}
```

### Response

**Success** (HTTP 200):
```javascript
{
  data: {
    user: {
      id: "uuid",
      email: "user@example.com",
      updated_at: "2025-12-27T10:35:00Z"
    }
  },
  error: null
}
```

**Side Effects**:
- ✅ Password updated in `auth.users` (hashed with bcrypt)
- ✅ All OTHER sessions invalidated (current session remains active)
- ✅ User does NOT need to re-login (unlike password reset flow)

**Error** (HTTP 400):
```javascript
{
  data: null,
  error: {
    message: "Password should be at least 8 characters",
    status: 400
  }
}
```

### Error Scenarios

| Error Code | Message | Handling |
|------------|---------|----------|
| 400 | "Password too weak" | Show client-side validation errors |
| 401 | "Current password incorrect" | Show: "Current password is incorrect" |
| 500 | "Failed to update password" | Retry with error message |

---

## 5. Real-Time Preference Synchronization

### Scenario

User has Coordino open in multiple tabs/devices. Preference change in one tab should reflect immediately in others.

### Implementation

**Supabase Realtime Subscription**:
```javascript
// In Pinia config store
const setupRealtimeSync = () => {
  const channel = supabase
    .channel('profile_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users_extended',
        filter: `id=eq.${user.value.id}`
      },
      (payload) => {
        // Update local store with new values
        profile.value = {
          ...profile.value,
          ...payload.new
        }

        // Apply theme change immediately
        if (payload.new.theme !== payload.old.theme) {
          applyTheme(payload.new.theme)
        }
      }
    )
    .subscribe()

  return channel
}
```

**Cleanup on Logout**:
```javascript
const unsubscribe = () => {
  if (channel) {
    supabase.removeChannel(channel)
  }
}
```

### Payload Structure

**UPDATE Event**:
```javascript
{
  schema: "public",
  table: "users_extended",
  commit_timestamp: "2025-12-27T10:40:00Z",
  eventType: "UPDATE",
  new: {
    id: "uuid",
    full_name: "Jane Smith",
    theme: "light",  // Changed value
    updated_at: "2025-12-27T10:40:00Z"
  },
  old: {
    id: "uuid",
    full_name: "Jane Smith",
    theme: "dark",  // Previous value
    updated_at: "2025-12-27T10:30:00Z"
  }
}
```

---

## 6. LocalStorage Persistence

### Purpose

Persist theme and date format preferences to localStorage for instant application on page load (before Supabase query completes).

### Storage Keys

```javascript
const STORAGE_KEYS = {
  THEME: 'coordino:theme',
  DATE_FORMAT: 'coordino:date_format',
  TIMEZONE: 'coordino:timezone'
}
```

### Write Pattern

**On Preference Update**:
```javascript
const updatePreference = async (key, value) => {
  // 1. Update database
  await supabase
    .from('users_extended')
    .update({ [key]: value, updated_at: new Date().toISOString() })
    .eq('id', user.value.id)

  // 2. Update localStorage (instant future page loads)
  if (key === 'theme') {
    localStorage.setItem(STORAGE_KEYS.THEME, value)
    applyTheme(value)  // Apply immediately
  }

  // 3. Update Pinia store (reactive updates)
  profile.value[key] = value
}
```

### Read Pattern

**On Application Load**:
```javascript
const initializePreferences = async () => {
  // 1. Load from localStorage (instant, no flash of wrong theme)
  const cachedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
  applyTheme(cachedTheme)

  // 2. Fetch from database (source of truth)
  const { data } = await supabase
    .from('users_extended')
    .select('theme, date_format, preferred_timezone')
    .eq('id', user.value.id)
    .single()

  // 3. Sync if different (database wins)
  if (data.theme !== cachedTheme) {
    localStorage.setItem(STORAGE_KEYS.THEME, data.theme)
    applyTheme(data.theme)
  }

  // 4. Update store
  profile.value = data
}
```

---

## 7. Testing Contract

### Unit Tests

**Test**: Validation functions
```javascript
describe('validateProfileUpdate', () => {
  it('accepts valid profile updates', () => {
    const result = validateProfileUpdate({
      full_name: 'Jane Doe',
      preferred_timezone: 'America/New_York',
      theme: 'dark'
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('rejects invalid timezone', () => {
    const result = validateProfileUpdate({
      preferred_timezone: 'Invalid/Timezone'
    })

    expect(result.valid).toBe(false)
    expect(result.errors.preferred_timezone).toBeDefined()
  })
})
```

### Integration Tests

**Test**: Profile update + RLS policy verification (SC-003)
```javascript
describe('Profile Update with RLS', () => {
  it('updates own profile successfully', async () => {
    const { data, error } = await supabase
      .from('users_extended')
      .update({ full_name: 'Test User' })
      .eq('id', testUser.id)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.full_name).toBe('Test User')
  })

  it('cannot update another user\'s profile', async () => {
    const { data, error } = await supabase
      .from('users_extended')
      .update({ full_name: 'Hacked!' })
      .eq('id', otherUser.id)  // Different user
      .select()

    // RLS silently filters, returns empty result
    expect(data).toBeNull()
  })
})
```

### E2E Tests

**Test**: Profile update journey (SC-003)
```javascript
test('user updates profile and sees changes within 5 seconds', async ({ page }) => {
  const startTime = Date.now()

  // 1. Navigate to Settings > Profile
  await page.goto('/settings')
  await page.click('text=Profile')

  // 2. Update display name
  await page.fill('[name="full_name"]', 'New Display Name')

  // 3. Save changes
  await page.click('button:has-text("Save Profile")')

  // 4. Verify success message
  await expect(page.locator('text=Profile updated successfully')).toBeVisible()

  // 5. Verify name in header updates
  await expect(page.locator('[data-testid="user-name"]')).toHaveText('New Display Name')

  // 6. Verify completion time
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(5000) // 5 seconds
})
```

---

## Contract Summary

**Endpoints**:
1. ✅ `SELECT from users_extended` - Load profile
2. ✅ `UPDATE users_extended` - Update preferences
3. ✅ `auth.updateUser({ email })` - Change email
4. ✅ `auth.updateUser({ password })` - Change password
5. ✅ Realtime subscription - Sync across tabs

**Validation**:
- Client-side: Timezone, theme enum, name length
- Server-side: CHECK constraints, NOT NULL, RLS policies

**Security**:
- RLS policies: Automatic user isolation
- Re-authentication required for email/password changes
- Realtime filtered by user ID

**Performance**:
- localStorage caching for instant theme application
- Realtime sync for multi-tab consistency
- Updates complete within 5 seconds (SC-003)

**Testing**:
- Unit: Validation logic
- Integration: RLS policy enforcement
- E2E: Complete profile update journey
