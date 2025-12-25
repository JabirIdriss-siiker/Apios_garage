/*
  # Enrich Clients Schema for B2B Support

  1. New Columns
    - `client_type` (text) - 'individual' or 'professional'
    - `company_name` (text) - Company name for professional clients
    - `siret` (text) - French business registration number
    - `vat_number` (text) - VAT number for EU businesses
    - `city` (text) - City
    - `zip_code` (text) - Postal code

  2. Important Notes
    - All new columns are nullable for backward compatibility
    - client_type defaults to 'individual'
    - Existing clients will be automatically set as 'individual'
*/

-- Add new columns to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'individual' CHECK (client_type IN ('individual', 'professional')),
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS siret text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip_code text;

-- Create index for company searches
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(tenant_id, company_name) WHERE company_name IS NOT NULL;

-- Create index for SIRET searches
CREATE INDEX IF NOT EXISTS idx_clients_siret ON clients(tenant_id, siret) WHERE siret IS NOT NULL;
