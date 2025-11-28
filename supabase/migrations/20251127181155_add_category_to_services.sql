/*
  # Add Category Field to Services
  
  1. Changes
    - Add optional `category` column to services table for better organization
    - Common categories: Maintenance, Repair, Diagnostic, Tire Service, Body Work, etc.
  
  2. Important Notes
    - Category is optional (NULL allowed)
    - No migration of existing data needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'category'
  ) THEN
    ALTER TABLE services ADD COLUMN category text;
  END IF;
END $$;
