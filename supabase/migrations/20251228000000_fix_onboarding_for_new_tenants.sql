/*
  # Fix Onboarding Completed Flag for New Tenants

  1. Purpose
    - Fix the issue where all tenants were being set to onboarding_completed = true
    - Only set existing tenants (created before this fix) to true
    - Ensure new tenants going forward will have onboarding_completed = false

  2. Strategy
    - Set onboarding_completed = true ONLY for tenants created before 2025-12-28
    - This is a one-time migration that won't affect future tenants
    - New tenants will use the DEFAULT false from the column definition
*/

-- Set existing tenants (created before this migration date) as having completed onboarding
-- They're already using the system, so we don't want to show them the wizard
UPDATE tenants
SET onboarding_completed = true
WHERE created_at < '2025-12-28 00:00:00+00'
  AND (onboarding_completed IS NULL OR onboarding_completed = false);

-- All tenants created on or after 2025-12-28 will keep their default value (false)
-- and will see the onboarding wizard on first login
