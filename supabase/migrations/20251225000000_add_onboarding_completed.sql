/*
  # Add Onboarding Completed Flag to Tenants

  1. New Column
    - `onboarding_completed` (boolean) - Tracks if tenant admin has completed onboarding wizard
  
  2. Important Notes
    - Defaults to false for new tenants
    - Existing tenants will be set to true (assume they're already configured)
    - Used to show onboarding wizard on first login for new tenant admins
*/

-- Add onboarding_completed column
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Note: The UPDATE statement that was here has been removed because it was
-- running on every migration and incorrectly setting ALL tenants to true,
-- including new ones. A separate one-time migration (20251228000000) will
-- handle setting existing tenants to true.
