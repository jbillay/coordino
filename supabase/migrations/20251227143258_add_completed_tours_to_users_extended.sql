-- Migration: Add completed_tours column to users_extended table
-- Feature: 001-user-config (User & Application Configuration)
-- Date: 2025-12-27
-- Purpose: Track which feature tours the user has completed to prevent repeated display

BEGIN;

-- Add completed_tours column to track feature tour completion
ALTER TABLE users_extended
ADD COLUMN completed_tours TEXT[] DEFAULT '{}';

-- Add comment explaining the column purpose and expected values
COMMENT ON COLUMN users_extended.completed_tours IS
  'Array of feature tour identifiers completed by user. ' ||
  'Example values: ["tasks_intro", "notes_intro", "scheduling_intro"]. ' ||
  'Used to prevent repeated display of contextual onboarding tours.';

COMMIT;
