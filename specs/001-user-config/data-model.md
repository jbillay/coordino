# Data Model: User & Application Configuration

**Feature**: `001-user-config`
**Phase**: 1 (Design)
**Date**: 2025-12-27

## Overview

This feature extends the existing Coordino database schema to support user configuration and onboarding features. The data model is intentionally minimal, leveraging existing infrastructure where possible.

## Schema Changes

### 1. Extend `users_extended` Table

**Purpose**: Add tracking for completed feature tours (onboarding).

**Current Schema** (from ARCHITECTURE.md):
```sql
CREATE TABLE users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**New Migration** (`YYYYMMDDHHMMSS_add_completed_tours_to_users_extended.sql`):
```sql
-- Add completed_tours column to track feature tour completion
ALTER TABLE users_extended
ADD COLUMN completed_tours TEXT[] DEFAULT '{}';

COMMENT ON COLUMN users_extended.completed_tours IS 'Array of feature tour identifiers completed by user (e.g., ["tasks_intro", "notes_intro", "scheduling_intro"])';
```

**Rationale**:
- Uses PostgreSQL array type for flexible, scalable tour tracking
- Default empty array `'{}'` ensures no null handling needed
- Text array allows descriptive tour IDs: `"tasks_intro"`, `"notes_first_note"`, `"scheduling_timezone_setup"`
- No additional table needed; tours are user-specific configuration data
- Existing RLS policies (`auth.uid() = id`) automatically secure this column

**Expected Tour IDs**:
- `"tasks_intro"`: First visit to Tasks view
- `"notes_intro"`: First visit to Notes view
- `"scheduling_intro"`: First visit to Scheduling view
- `"settings_intro"`: First visit to Settings view

**Example Data**:
```sql
-- New user (no tours completed)
{ id: '...', completed_tours: [] }

-- User who completed tasks and notes tours
{ id: '...', completed_tours: ['tasks_intro', 'notes_intro'] }
```

---

## No New Tables Required

This feature **does not introduce new database tables**. All functionality leverages existing infrastructure:

### Password Reset
- **Table**: `auth.users` (Supabase-managed)
- **Mechanism**: Supabase Auth handles token generation, email delivery, and validation
- **No custom tables needed**: Tokens are ephemeral, stored in Supabase Auth system

### Profile & Preferences
- **Table**: `users_extended` (existing)
- **Fields used**: `full_name`, `preferred_timezone`, `date_format`, `theme`
- **No new columns needed**: All required fields already exist

### Account Deletion
- **Table**: `auth.users` (Supabase-managed)
- **Mechanism**: Supabase Auth `deleteUser()` method + CASCADE deletes
- **Cleanup**: RLS policies and foreign key `ON DELETE CASCADE` automatically remove all user data

### Data Export
- **Tables queried**: All existing user tables (tasks, notes, topics, locations, meetings, etc.)
- **Storage**: Export generated on-demand, downloaded immediately (no database storage)
- **No export history table**: Exports are ephemeral, not tracked in database

### Session Management
- **Table**: N/A (client-side tracking)
- **Mechanism**: JavaScript inactivity detection + Supabase Auth session tokens
- **No persistence needed**: Inactivity timer resets on page reload

### Feature Tours
- **Table**: `users_extended` (extended with `completed_tours` array)
- **Storage**: Array of completed tour IDs
- **No separate tours table**: Tours are configuration, not relational data

---

## Row Level Security Policies

No new RLS policies required. Existing policies on `users_extended` cover the new `completed_tours` column:

**Existing Policies** (from ARCHITECTURE.md):
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON users_extended FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON users_extended FOR UPDATE
  USING (auth.uid() = id);
```

These policies automatically apply to the new `completed_tours` column because they operate on the entire row. No modifications needed.

---

## Entity Relationships

### Existing Relationships (Unchanged)

```
auth.users (Supabase-managed)
    ↓ 1:1
users_extended
    ↓ 1:many
tasks, task_categories, task_statuses, topics, notes, locations, meetings
```

### Extended Relationships (This Feature)

```
users_extended.completed_tours (array field)
    ↔ Feature Tour Components (application logic, not database relationship)

No foreign keys: Tour IDs are application-defined strings, not database entities
```

**Rationale**: Feature tours are UI concepts, not persistent business entities. Storing tour IDs as strings provides flexibility to add/rename tours without schema migrations.

---

## Data Volume Considerations

### Storage Impact

**Before**:
- `users_extended`: ~200 bytes per row (base fields)

**After**:
- `completed_tours` adds ~50-100 bytes per user (4-5 tour IDs × 20 chars avg)
- Total: ~250-300 bytes per user row
- 10,000 users: ~2.5 MB total (negligible)

### Query Performance

**Read Operations**:
```sql
-- Check if user completed specific tour
SELECT 'tasks_intro' = ANY(completed_tours) AS completed
FROM users_extended
WHERE id = auth.uid();
```
- Performance: O(n) where n = number of tours (typically 4-5)
- Index: Not needed (small array, single-user query)

**Write Operations**:
```sql
-- Mark tour as completed (append to array)
UPDATE users_extended
SET completed_tours = array_append(completed_tours, 'tasks_intro'),
    updated_at = NOW()
WHERE id = auth.uid();
```
- Performance: O(1) append operation
- Concurrency: Safe (PostgreSQL array append is atomic)

---

## Migration Strategy

### Migration File

**Filename**: `YYYYMMDDHHMMSS_add_completed_tours_to_users_extended.sql`

**Full Migration**:
```sql
-- Migration: Add completed_tours tracking to users_extended
-- Feature: 001-user-config
-- Date: 2025-12-27

BEGIN;

-- Add completed_tours column
ALTER TABLE users_extended
ADD COLUMN completed_tours TEXT[] DEFAULT '{}';

-- Add column comment for documentation
COMMENT ON COLUMN users_extended.completed_tours IS
  'Array of feature tour identifiers completed by user. ' ||
  'Example values: ["tasks_intro", "notes_intro", "scheduling_intro"]. ' ||
  'Used to prevent repeated display of contextual onboarding tours.';

-- Update trigger to include new column in updated_at logic (if exists)
-- (Trigger already handles ALL columns via FOR EACH ROW, no changes needed)

COMMIT;
```

### Rollback Plan

```sql
-- Rollback: Remove completed_tours column
BEGIN;

ALTER TABLE users_extended
DROP COLUMN IF EXISTS completed_tours;

COMMIT;
```

### Testing Migration

**Pre-migration validation**:
```sql
-- Verify table exists and is accessible
SELECT COUNT(*) FROM users_extended;

-- Check existing columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users_extended';
```

**Post-migration validation**:
```sql
-- Verify column added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users_extended'
  AND column_name = 'completed_tours';

-- Expected result:
-- column_name: completed_tours
-- data_type: ARRAY
-- column_default: '{}'::text[]

-- Verify RLS policies still apply
SET ROLE authenticated;
SET request.jwt.claims.sub = '<test-user-id>';
SELECT id, completed_tours FROM users_extended;
-- Should return only rows where id matches test-user-id
```

---

## Data Access Patterns

### Read Patterns

**1. Check Tour Completion**:
```javascript
// In useFeatureTour.js composable
const hasCompletedTour = async (tourId) => {
  const { data } = await supabase
    .from('users_extended')
    .select('completed_tours')
    .eq('id', user.value.id)
    .single()

  return data?.completed_tours?.includes(tourId) || false
}
```

**2. Load User Preferences** (existing pattern, unchanged):
```javascript
// In useConfigStore
const loadUserProfile = async () => {
  const { data } = await supabase
    .from('users_extended')
    .select('full_name, preferred_timezone, theme, date_format, completed_tours')
    .eq('id', user.value.id)
    .single()

  return data
}
```

### Write Patterns

**1. Mark Tour Completed**:
```javascript
// In useFeatureTour.js composable
const completeTour = async (tourId) => {
  const { error } = await supabase.rpc('append_completed_tour', {
    tour_id: tourId
  })

  if (error) throw error
}

// SQL function for atomic append (create in migration):
CREATE OR REPLACE FUNCTION append_completed_tour(tour_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users_extended
  SET completed_tours = array_append(completed_tours, tour_id),
      updated_at = NOW()
  WHERE id = auth.uid()
    AND NOT (tour_id = ANY(completed_tours)); -- Prevent duplicates
END;
$$;
```

**2. Update Profile** (existing pattern, unchanged):
```javascript
// In auth store
const updateProfile = async (updates) => {
  const { error } = await supabase
    .from('users_extended')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.value.id)

  if (error) throw error
}
```

**3. Delete Account**:
```javascript
// In auth store
const deleteAccount = async () => {
  // Step 1: Delete from Supabase Auth (triggers CASCADE deletes)
  const { error } = await supabase.auth.admin.deleteUser(user.value.id)

  if (error) throw error

  // Step 2: Foreign key ON DELETE CASCADE automatically removes:
  // - users_extended row (including completed_tours)
  // - All tasks, notes, topics, locations, meetings, etc.

  // Step 3: Sign out (clears local session)
  await supabase.auth.signOut()
}
```

---

## Indexing Strategy

**No indexes needed** for this feature:

1. **completed_tours column**:
   - Array operations on small arrays (4-5 elements) are fast without indexes
   - Queries always filtered by `id` first (primary key lookup)
   - Array GIN index would add overhead without measurable benefit

2. **Existing indexes on users_extended**:
   - Primary key index on `id` (automatic) - sufficient for all queries
   - All queries in this feature use `WHERE id = auth.uid()` pattern

**Benchmark** (for 10,000 users):
```sql
EXPLAIN ANALYZE
SELECT 'tasks_intro' = ANY(completed_tours)
FROM users_extended
WHERE id = 'specific-uuid';

-- Expected: Index Scan on users_extended_pkey (cost=0.29..8.31 rows=1)
-- No need for array index
```

---

## Data Integrity Constraints

### Existing Constraints (Enforced)

1. **Foreign Key to auth.users**:
   ```sql
   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
   ```
   - Ensures `users_extended` row cannot exist without corresponding `auth.users` row
   - Cascade delete maintains referential integrity on account deletion

2. **NOT NULL on required fields**:
   ```sql
   preferred_timezone TEXT NOT NULL DEFAULT 'UTC'
   theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark'))
   ```
   - Prevents null values for critical configuration
   - Provides sensible defaults for new users

3. **CHECK constraint on theme**:
   ```sql
   CHECK (theme IN ('light', 'dark'))
   ```
   - Database-level validation of enum values
   - Prevents invalid theme values even if frontend validation bypassed

### New Constraints (None)

**No new constraints needed**:
- `completed_tours` allows NULL and empty arrays (both valid states)
- No CHECK constraint needed (any text array is valid)
- Duplicate tour IDs prevented in application logic, not database constraint
- Invalid tour IDs have no impact (tours are UI concepts, not data entities)

---

## Summary

**Minimal Schema Impact**:
- ✅ Only 1 column added to existing table
- ✅ No new tables introduced
- ✅ No new indexes required
- ✅ No new RLS policies needed
- ✅ Existing foreign key CASCADE handles account deletion
- ✅ Migration is reversible with simple DROP COLUMN

**Data Model Benefits**:
- Leverages existing `users_extended` table structure
- Uses PostgreSQL array type for flexible tour tracking
- Maintains Row Level Security without modifications
- Minimal storage overhead (~50-100 bytes per user)
- Zero performance impact (queries already use primary key)

**Ready for Phase 1 Contracts**: All data access patterns defined, ready to create API contracts.
