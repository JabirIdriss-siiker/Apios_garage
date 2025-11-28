/*
  # Update Planning Module Schema

  1. Table Modifications
    - Modify appointments table to support calendar planning with date/time separation
    - Add customer_name, customer_phone, customer_email for public bookings
    - Add vehicle_id reference for existing vehicles
    - Add vehicle_plate, vehicle_make, vehicle_model for public bookings without vehicle registration
    - Change scheduled_at to appointment_date + start_time + end_time
    - Update status values to match requirements
    - Add slug column to tenants for public booking URLs

  2. Services Table Updates
    - Rename duration_minutes to estimated_duration_minutes for clarity

  3. Security
    - Enable RLS on appointments, services, clients tables
    - Add policies for authenticated tenant users
    - Add public policies for booking

  4. Important Notes
    - Appointments from public booking have NULL client_id initially
    - mechanic_id is NULL until assigned by admin/reception
    - All tenant data isolated via tenant_id
*/

-- Add slug to tenants table for public booking URLs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'slug'
  ) THEN
    ALTER TABLE tenants ADD COLUMN slug text;
    CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_unique ON tenants(slug);
  END IF;
END $$;

-- Drop existing appointments table and recreate with new schema
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  mechanic_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  vehicle_plate text,
  vehicle_make text,
  vehicle_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, appointment_date);
CREATE INDEX idx_appointments_mechanic_date ON appointments(mechanic_id, appointment_date) WHERE mechanic_id IS NOT NULL;

-- Update services table column name if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE services RENAME COLUMN duration_minutes TO estimated_duration_minutes;
  END IF;
END $$;

-- Enable RLS on tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Services policies for authenticated tenant users
DROP POLICY IF EXISTS "Tenant users can view their services" ON services;
CREATE POLICY "Tenant users can view their services"
  ON services FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant admins can insert services" ON services;
CREATE POLICY "Tenant admins can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION')
    )
  );

DROP POLICY IF EXISTS "Tenant admins can update services" ON services;
CREATE POLICY "Tenant admins can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION')
    )
  );

DROP POLICY IF EXISTS "Tenant admins can delete services" ON services;
CREATE POLICY "Tenant admins can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION')
    )
  );

-- Public read policy for services (for booking form)
DROP POLICY IF EXISTS "Anyone can view active services for public booking" ON services;
CREATE POLICY "Anyone can view active services for public booking"
  ON services FOR SELECT
  TO anon
  USING (is_active = true);

-- Appointments policies for authenticated tenant users
DROP POLICY IF EXISTS "Tenant users can view their appointments" ON appointments;
CREATE POLICY "Tenant users can view their appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant users can insert appointments" ON appointments;
CREATE POLICY "Tenant users can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC')
    )
  );

DROP POLICY IF EXISTS "Tenant users can update appointments" ON appointments;
CREATE POLICY "Tenant users can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC')
    )
  );

DROP POLICY IF EXISTS "Tenant admins can delete appointments" ON appointments;
CREATE POLICY "Tenant admins can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION')
    )
  );

-- Public insert policy for appointments (public booking)
DROP POLICY IF EXISTS "Anyone can create appointments via public booking" ON appointments;
CREATE POLICY "Anyone can create appointments via public booking"
  ON appointments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Clients RLS policies
DROP POLICY IF EXISTS "Tenant users can view their clients" ON clients;
CREATE POLICY "Tenant users can view their clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant users can insert clients" ON clients;
CREATE POLICY "Tenant users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant users can update clients" ON clients;
CREATE POLICY "Tenant users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert clients via public booking" ON clients;
CREATE POLICY "Anyone can insert clients via public booking"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

-- Seed default services for existing tenants
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants LOOP
    INSERT INTO services (tenant_id, name, description, estimated_duration_minutes, price, is_active)
    VALUES
      (tenant_record.id, 'Vidange', 'Vidange moteur et changement de filtre à huile', 60, 80.00, true),
      (tenant_record.id, 'Révision complète', 'Révision complète du véhicule', 120, 200.00, true),
      (tenant_record.id, 'Changement de pneus', 'Changement des 4 pneus', 90, 150.00, true),
      (tenant_record.id, 'Diagnostic électronique', 'Diagnostic complet avec valise', 45, 60.00, true),
      (tenant_record.id, 'Freinage', 'Remplacement plaquettes et disques', 120, 180.00, true)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
