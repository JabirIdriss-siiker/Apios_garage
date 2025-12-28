/*
  # Add Opening Hours to Tenants Table

  1. New Column
    - `opening_hours` (jsonb) - Store business hours as JSON object
  
  2. Structure
    {
      "monday": { "open": "08:00", "close": "18:00" },
      "tuesday": { "open": "08:00", "close": "18:00" },
      ...
      "sunday": null  // null means closed
    }
  
  3. Important Notes
    - Nullable column for backward compatibility
    - Used by onboarding wizard to configure business hours
    - Can be used for appointment scheduling logic
*/

-- Add opening_hours column to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS opening_hours jsonb;

-- Add a helpful comment
COMMENT ON COLUMN tenants.opening_hours IS 'Business hours stored as JSON: { "monday": { "open": "08:00", "close": "18:00" }, ... }';
