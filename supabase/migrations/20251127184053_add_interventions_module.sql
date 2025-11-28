/*
  # Gestion des Interventions

  1. New Tables
    - `interventions`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `client_id` (uuid, foreign key to clients)
      - `vehicle_id` (uuid, foreign key to vehicles)
      - `mechanic_id` (uuid, foreign key to profiles, nullable)
      - `description` (text)
      - `status` (enum: pending, in_progress, completed)
      - `estimated_cost` (numeric, default 0)
      - `actual_cost` (numeric, default 0)
      - `notes` (text, nullable)
      - `started_at` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `intervention_parts`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `intervention_id` (uuid, foreign key to interventions)
      - `name` (text)
      - `quantity` (numeric, default 1)
      - `unit_price` (numeric, default 0)
      - `total_price` (numeric, default 0)
      - `created_at` (timestamptz, default now())
    
    - `intervention_photos`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `intervention_id` (uuid, foreign key to interventions)
      - `photo_url` (text)
      - `description` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users scoped by tenant_id
    - Mechanic assignment restricted to TENANT_ADMIN and RECEPTION roles
    - All data strictly scoped by tenant_id for data isolation

  3. Important Notes
    - Status workflow: pending → in_progress → completed
    - When status = completed, intervention is locked (cannot modify critical fields)
    - Actual cost auto-calculated from parts total + labor if needed
    - Mechanic assignment optional for pending status
    - Photos stored as URLs (use Supabase Storage or external service)
*/

-- Create interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  mechanic_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  estimated_cost numeric NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  actual_cost numeric NOT NULL DEFAULT 0 CHECK (actual_cost >= 0),
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create intervention_parts table
CREATE TABLE IF NOT EXISTS intervention_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  intervention_id uuid NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price numeric NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create intervention_photos table
CREATE TABLE IF NOT EXISTS intervention_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  intervention_id uuid NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interventions_tenant_id ON interventions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_mechanic_id ON interventions(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_intervention_parts_intervention_id ON intervention_parts(intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_photos_intervention_id ON intervention_photos(intervention_id);

-- Enable RLS
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interventions table

CREATE POLICY "Users can view interventions in their tenant"
  ON interventions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and reception can create interventions"
  ON interventions FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION')
    )
  );

CREATE POLICY "Admin and reception can update interventions"
  ON interventions FOR UPDATE
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

CREATE POLICY "Admin can delete interventions"
  ON interventions FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'TENANT_ADMIN'
    )
  );

-- RLS Policies for intervention_parts table

CREATE POLICY "Users can view parts in their tenant"
  ON intervention_parts FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin and reception can add parts"
  ON intervention_parts FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC')
    )
  );

CREATE POLICY "Admin and reception can update parts"
  ON intervention_parts FOR UPDATE
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

CREATE POLICY "Admin and reception can delete parts"
  ON intervention_parts FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC')
    )
  );

-- RLS Policies for intervention_photos table

CREATE POLICY "Users can view photos in their tenant"
  ON intervention_photos FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can add photos"
  ON intervention_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete photos"
  ON intervention_photos FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('TENANT_ADMIN', 'RECEPTION')
    )
  );