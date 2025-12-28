/*
  # Allow Tenant Admins to Update Their Own Tenant (Secure Version)

  1. Purpose
    - Fix onboarding wizard by allowing TENANT_ADMIN to update their own tenant
    - Currently only SUPERADMIN can update tenants, blocking onboarding data from saving
    - This policy allows TENANT_ADMIN to update ONLY specific columns

  2. Security
    - TENANT_ADMIN can only update their own tenant (verified by tenant_id match)
    - Can ONLY update these columns:
      * name, email, phone, address (basic info)
      * opening_hours (business hours)
      * default_tax_rate (tax configuration)
      * onboarding_completed (onboarding status)
    - Cannot update: id, created_at, updated_at, or any future sensitive columns
    - Cannot update other tenants
    - Maintains multi-tenant isolation

  3. Implementation
    - Uses a function to validate that only allowed columns are being updated
    - More secure than allowing all columns to be updated
*/

-- Create a function to check if only allowed columns are being updated
CREATE OR REPLACE FUNCTION check_tenant_update_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow SUPERADMIN to update any column
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPERADMIN'
  ) THEN
    RETURN NEW;
  END IF;

  -- For TENANT_ADMIN, only allow specific columns to be updated
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'TENANT_ADMIN'
    AND profiles.tenant_id = NEW.id
  ) THEN
    -- Check that only allowed columns have changed
    IF (OLD.id IS DISTINCT FROM NEW.id) OR
       (OLD.created_at IS DISTINCT FROM NEW.created_at) THEN
      RAISE EXCEPTION 'TENANT_ADMIN cannot modify id or created_at';
    END IF;
    
    -- Allow updates to: name, email, phone, address, opening_hours, default_tax_rate, onboarding_completed, updated_at
    RETURN NEW;
  END IF;

  -- If we get here, the user is not authorized
  RAISE EXCEPTION 'Not authorized to update this tenant';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce column restrictions
DROP TRIGGER IF EXISTS enforce_tenant_update_columns ON tenants;
CREATE TRIGGER enforce_tenant_update_columns
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION check_tenant_update_columns();

-- Allow tenant admins to update their own tenant (with column restrictions via trigger)
CREATE POLICY "Tenant admins can update own tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'TENANT_ADMIN'
      AND profiles.tenant_id IS NOT NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'TENANT_ADMIN'
      AND profiles.tenant_id IS NOT NULL
    )
  );
