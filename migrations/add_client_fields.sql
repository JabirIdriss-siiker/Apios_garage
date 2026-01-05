-- Migration: Add missing fields to clients table
-- Description: Adds client_type, company_name, siret, vat_number, city, and zip_code fields to support both individual and professional clients

-- Add new columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'individual' CHECK (client_type IN ('individual', 'professional')),
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS siret TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Update existing rows to have default client_type
UPDATE clients 
SET client_type = 'individual' 
WHERE client_type IS NULL;

-- Make client_type NOT NULL after setting defaults
ALTER TABLE clients 
ALTER COLUMN client_type SET NOT NULL;

-- Add comment to table
COMMENT ON COLUMN clients.client_type IS 'Type of client: individual or professional';
COMMENT ON COLUMN clients.company_name IS 'Company name for professional clients';
COMMENT ON COLUMN clients.siret IS 'SIRET number for French professional clients (14 digits)';
COMMENT ON COLUMN clients.vat_number IS 'VAT/TVA number for professional clients';
COMMENT ON COLUMN clients.city IS 'City of the client';
COMMENT ON COLUMN clients.zip_code IS 'Postal/ZIP code of the client';
