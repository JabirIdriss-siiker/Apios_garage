/*
  # Add Subscription Plans and Vehicles Management

  ## 1. New Tables
    
  ### `subscription_plans`
  - `id` (uuid, primary key)
  - `name` (text) - Plan name (Basic, Pro, Business)
  - `price_monthly` (numeric) - Monthly price in euros
  - `max_users` (integer) - Maximum number of users
  - `max_vehicles` (integer) - Maximum number of vehicles
  - `max_storage_gb` (integer) - Maximum storage in GB
  - `features` (jsonb) - Additional features
  - `is_active` (boolean) - Whether the plan is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `tenant_subscriptions`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key to tenants)
  - `plan_id` (uuid, foreign key to subscription_plans)
  - `status` (text) - active, suspended, cancelled
  - `started_at` (timestamptz) - Subscription start date
  - `expires_at` (timestamptz) - Subscription expiry date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `vehicles`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key to tenants)
  - `client_id` (uuid, foreign key to clients)
  - `license_plate` (text) - Plaque d'immatriculation
  - `make` (text) - Marque
  - `model` (text) - Modèle
  - `year` (integer) - Année
  - `mileage` (integer) - Kilométrage
  - `vin` (text) - Vehicle Identification Number
  - `color` (text) - Couleur
  - `fuel_type` (text) - Type de carburant (essence, diesel, électrique, hybride)
  - `notes` (text) - Notes additionnelles
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `repair_history`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key to tenants)
  - `vehicle_id` (uuid, foreign key to vehicles)
  - `client_id` (uuid, foreign key to clients)
  - `description` (text) - Description of repair
  - `mileage_at_repair` (integer) - Kilométrage lors de la réparation
  - `cost` (numeric) - Coût de la réparation
  - `performed_by` (uuid, foreign key to profiles) - Mechanic who performed repair
  - `repair_date` (date) - Date de la réparation
  - `notes` (text) - Notes additionnelles
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Table Modifications
    - Add `subscription_status` (text) to tenants table
    - Add `suspended_at` (timestamptz) to tenants table
    - Add `suspension_reason` (text) to tenants table

  ## 3. Security
    - Enable RLS on all new tables
    - SUPERADMIN can manage all subscription plans and tenant subscriptions
    - Tenants can view their own subscription details
    - Tenants can manage vehicles within their tenant
    - All users within a tenant can view vehicles
    - Repair history is accessible to all tenant users
*/

-- Add subscription status fields to tenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE tenants 
    ADD COLUMN subscription_status text DEFAULT 'active',
    ADD COLUMN suspended_at timestamptz,
    ADD COLUMN suspension_reason text;
  END IF;
END $$;

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  max_users integer NOT NULL,
  max_vehicles integer NOT NULL,
  max_storage_gb integer NOT NULL,
  features jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SUPERADMIN can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create tenant_subscriptions table
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'cancelled'))
);

ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SUPERADMIN can manage all tenant subscriptions"
  ON tenant_subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

CREATE POLICY "Tenants can view their own subscription"
  ON tenant_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = tenant_subscriptions.tenant_id
    )
  );

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  license_plate text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  mileage integer DEFAULT 0,
  vin text,
  color text,
  fuel_type text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_fuel_type CHECK (fuel_type IS NULL OR fuel_type IN ('essence', 'diesel', 'électrique', 'hybride', 'gpl', 'autre'))
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their tenant vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.tenant_id = vehicles.tenant_id OR profiles.role = 'SUPERADMIN')
    )
  );

CREATE POLICY "Tenant admins and reception can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = vehicles.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'RECEPTION', 'SUPERADMIN')
    )
  );

CREATE POLICY "Tenant admins and reception can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = vehicles.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'RECEPTION', 'SUPERADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = vehicles.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'RECEPTION', 'SUPERADMIN')
    )
  );

CREATE POLICY "Tenant admins can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = vehicles.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'SUPERADMIN')
    )
  );

-- Create repair_history table
CREATE TABLE IF NOT EXISTS repair_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description text NOT NULL,
  mileage_at_repair integer,
  cost numeric(10,2) DEFAULT 0,
  performed_by uuid REFERENCES profiles(id),
  repair_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE repair_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their tenant repair history"
  ON repair_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.tenant_id = repair_history.tenant_id OR profiles.role = 'SUPERADMIN')
    )
  );

CREATE POLICY "Tenant staff can insert repair history"
  ON repair_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = repair_history.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC', 'SUPERADMIN')
    )
  );

CREATE POLICY "Tenant staff can update repair history"
  ON repair_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = repair_history.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC', 'SUPERADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = repair_history.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'RECEPTION', 'MECHANIC', 'SUPERADMIN')
    )
  );

CREATE POLICY "Tenant admins can delete repair history"
  ON repair_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = repair_history.tenant_id
      AND profiles.role IN ('TENANT_ADMIN', 'SUPERADMIN')
    )
  );

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, max_users, max_vehicles, max_storage_gb, features) VALUES
  ('Basic', 49.00, 3, 50, 5, '{"support": "email", "reports": "basic"}'),
  ('Pro', 99.00, 10, 200, 20, '{"support": "priority", "reports": "advanced", "api_access": true}'),
  ('Business', 199.00, 999, 999999, 100, '{"support": "24/7", "reports": "custom", "api_access": true, "multi_location": true}')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_repair_history_vehicle_id ON repair_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_history_tenant_id ON repair_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
