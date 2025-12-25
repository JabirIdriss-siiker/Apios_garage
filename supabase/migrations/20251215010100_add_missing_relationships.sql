/*
  # Add Missing Relationships to Interventions

  1. New Columns
    - `appointment_id` (uuid) - Link to the appointment that was converted to this intervention
    - `quote_id` (uuid) - Link to the quote that was accepted and converted to this intervention

  2. Workflows Supported
    - Appointment → Intervention: When a confirmed appointment is converted to an intervention
    - Quote → Intervention: When an accepted quote is converted to an intervention

  3. Important Notes
    - Both columns are nullable (interventions can be created directly)
    - ON DELETE SET NULL to preserve intervention history if appointment/quote is deleted
    - Indexes added for performance
*/

-- Add relationship columns to interventions table
ALTER TABLE interventions
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES invoices(id) ON DELETE SET NULL;

-- Create indexes for the new relationships
CREATE INDEX IF NOT EXISTS idx_interventions_appointment_id ON interventions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_quote_id ON interventions(quote_id) WHERE quote_id IS NOT NULL;

-- Add constraint to ensure quote_id only references quotes, not invoices
ALTER TABLE interventions
  ADD CONSTRAINT check_quote_id_is_quote 
  CHECK (
    quote_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = quote_id 
      AND invoices.type = 'quote'
    )
  );
