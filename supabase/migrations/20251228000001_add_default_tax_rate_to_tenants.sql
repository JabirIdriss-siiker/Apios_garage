/*
  # Add Default Tax Rate to Tenants

  1. Purpose
    - Add default_tax_rate column to tenants table
    - This will be used to store the default VAT/tax rate configured during onboarding
    - Can be overridden on individual invoices

  2. Column Details
    - default_tax_rate (numeric) - Default tax rate percentage (e.g., 20 for 20%)
    - Defaults to 20 (standard French VAT rate)
*/

-- Add default_tax_rate column
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS default_tax_rate numeric DEFAULT 20;

-- Add a check constraint to ensure valid tax rates (0-100%)
ALTER TABLE tenants
  ADD CONSTRAINT check_default_tax_rate CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100);
