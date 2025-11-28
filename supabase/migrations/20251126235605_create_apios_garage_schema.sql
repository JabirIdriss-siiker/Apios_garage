/*
  # Apios Garage - Multi-tenant Database Schema

  ## Overview
  This migration creates the complete database structure for the Apios Garage multi-tenant application.

  ## 1. New Tables

  ### `tenants` (garages)
  - `id` (uuid, primary key)
  - `name` (text) - Garage name
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone
  - `address` (text) - Physical address
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `profiles` (extended user data)
  - `id` (uuid, primary key, references auth.users)
  - `tenant_id` (uuid, references tenants) - NULL for SUPERADMIN
  - `role` (text) - SUPERADMIN, TENANT_ADMIN, RECEPTION, MECHANIC, ACCOUNTANT
  - `full_name` (text)
  - `phone` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `clients`
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, references tenants)
  - `name` (text)
  - `phone` (text)
  - `email` (text)
  - `address` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - SUPERADMIN can access everything
  - Tenant users can only access their tenant's data
  - Specific policies for each role and operation

  ## 3. Important Notes
  - Multi-tenant isolation is enforced at the database level
  - Superadmins have tenant_id = NULL
  - All tenant-specific data is filtered by tenant_id
  - Indexes added for performance on tenant_id columns
*/

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('SUPERADMIN', 'TENANT_ADMIN', 'RECEPTION', 'MECHANIC', 'ACCOUNTANT')),
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ===== TENANTS POLICIES =====

-- Superadmins can view all tenants
CREATE POLICY "Superadmins can view all tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Superadmins can insert tenants
CREATE POLICY "Superadmins can insert tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Superadmins can update tenants
CREATE POLICY "Superadmins can update tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Superadmins can delete tenants
CREATE POLICY "Superadmins can delete tenants"
  ON tenants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Tenant users can view their own tenant
CREATE POLICY "Tenant users can view own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id IS NOT NULL
    )
  );

-- ===== PROFILES POLICIES =====

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Superadmins can view all profiles
CREATE POLICY "Superadmins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'SUPERADMIN'
    )
  );

-- Tenant admins can view profiles in their tenant
CREATE POLICY "Tenant admins can view tenant profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'TENANT_ADMIN'
      AND profiles.tenant_id IS NOT NULL
    )
  );

-- Superadmins can insert profiles
CREATE POLICY "Superadmins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Superadmins can update profiles
CREATE POLICY "Superadmins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Superadmins can delete profiles
CREATE POLICY "Superadmins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ===== CLIENTS POLICIES =====

-- Tenant users can view clients in their tenant
CREATE POLICY "Tenant users can view tenant clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id IS NOT NULL
    )
  );

-- Superadmins can view all clients
CREATE POLICY "Superadmins can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPERADMIN'
    )
  );

-- Tenant users can insert clients in their tenant
CREATE POLICY "Tenant users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id IS NOT NULL
    )
  );

-- Tenant users can update clients in their tenant
CREATE POLICY "Tenant users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id IS NOT NULL
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id IS NOT NULL
    )
  );

-- Tenant users can delete clients in their tenant
CREATE POLICY "Tenant users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id IS NOT NULL
    )
  );
