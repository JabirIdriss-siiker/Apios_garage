-- Migration: Create permissions system
-- Description: Creates tables for custom user permissions management

-- 1. Create permissions catalog table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user_permissions table (custom permissions per user)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_code)
);

-- 3. Create role_permissions table (default permissions per role)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_code)
);

-- 4. Insert permissions catalog
INSERT INTO permissions (code, name, description, category) VALUES
  -- Clients
  ('clients:view', 'Voir les clients', 'Permet de consulter la liste des clients', 'clients'),
  ('clients:create', 'Créer des clients', 'Permet de créer de nouveaux clients', 'clients'),
  ('clients:update', 'Modifier les clients', 'Permet de modifier les informations des clients', 'clients'),
  ('clients:delete', 'Supprimer les clients', 'Permet de supprimer des clients', 'clients'),
  
  -- Véhicules
  ('vehicles:view', 'Voir les véhicules', 'Permet de consulter la liste des véhicules', 'vehicles'),
  ('vehicles:create', 'Créer des véhicules', 'Permet d''ajouter de nouveaux véhicules', 'vehicles'),
  ('vehicles:update', 'Modifier les véhicules', 'Permet de modifier les informations des véhicules', 'vehicles'),
  ('vehicles:delete', 'Supprimer les véhicules', 'Permet de supprimer des véhicules', 'vehicles'),
  
  -- Interventions
  ('interventions:view', 'Voir les interventions', 'Permet de consulter les interventions', 'interventions'),
  ('interventions:create', 'Créer des interventions', 'Permet de créer de nouvelles interventions', 'interventions'),
  ('interventions:update', 'Modifier les interventions', 'Permet de modifier toutes les interventions', 'interventions'),
  ('interventions:update:own', 'Modifier ses interventions', 'Permet de modifier uniquement ses propres interventions', 'interventions'),
  ('interventions:delete', 'Supprimer les interventions', 'Permet de supprimer des interventions', 'interventions'),
  ('interventions:parts:add', 'Ajouter des pièces', 'Permet d''ajouter des pièces aux interventions', 'interventions'),
  ('interventions:pricing:edit', 'Modifier les prix', 'Permet de modifier les prix des interventions', 'interventions'),
  
  -- Factures
  ('invoices:view', 'Voir les factures', 'Permet de consulter les factures', 'invoices'),
  ('invoices:create', 'Créer des factures', 'Permet de créer de nouvelles factures', 'invoices'),
  ('invoices:update', 'Modifier les factures', 'Permet de modifier les factures', 'invoices'),
  ('invoices:delete', 'Supprimer les factures', 'Permet de supprimer des factures', 'invoices'),
  
  -- Administration
  ('users:manage', 'Gérer les utilisateurs', 'Permet de gérer les utilisateurs et leurs permissions', 'admin'),
  ('settings:manage', 'Gérer les paramètres', 'Permet de modifier les paramètres du garage', 'admin'),
  ('reports:view', 'Voir les rapports', 'Permet de consulter les rapports et statistiques', 'admin')
ON CONFLICT (code) DO NOTHING;

-- 5. Insert default role permissions
INSERT INTO role_permissions (role, permission_code) VALUES
  -- TENANT_ADMIN: toutes les permissions
  ('TENANT_ADMIN', 'clients:view'),
  ('TENANT_ADMIN', 'clients:create'),
  ('TENANT_ADMIN', 'clients:update'),
  ('TENANT_ADMIN', 'clients:delete'),
  ('TENANT_ADMIN', 'vehicles:view'),
  ('TENANT_ADMIN', 'vehicles:create'),
  ('TENANT_ADMIN', 'vehicles:update'),
  ('TENANT_ADMIN', 'vehicles:delete'),
  ('TENANT_ADMIN', 'interventions:view'),
  ('TENANT_ADMIN', 'interventions:create'),
  ('TENANT_ADMIN', 'interventions:update'),
  ('TENANT_ADMIN', 'interventions:delete'),
  ('TENANT_ADMIN', 'interventions:parts:add'),
  ('TENANT_ADMIN', 'interventions:pricing:edit'),
  ('TENANT_ADMIN', 'invoices:view'),
  ('TENANT_ADMIN', 'invoices:create'),
  ('TENANT_ADMIN', 'invoices:update'),
  ('TENANT_ADMIN', 'invoices:delete'),
  ('TENANT_ADMIN', 'users:manage'),
  ('TENANT_ADMIN', 'settings:manage'),
  ('TENANT_ADMIN', 'reports:view'),
  
  -- RECEPTION
  ('RECEPTION', 'clients:view'),
  ('RECEPTION', 'clients:create'),
  ('RECEPTION', 'clients:update'),
  ('RECEPTION', 'vehicles:view'),
  ('RECEPTION', 'vehicles:create'),
  ('RECEPTION', 'vehicles:update'),
  ('RECEPTION', 'interventions:view'),
  ('RECEPTION', 'interventions:create'),
  ('RECEPTION', 'interventions:update'),
  ('RECEPTION', 'invoices:view'),
  ('RECEPTION', 'invoices:create'),
  
  -- MECHANIC
  ('MECHANIC', 'clients:view'),
  ('MECHANIC', 'vehicles:view'),
  ('MECHANIC', 'vehicles:update'),
  ('MECHANIC', 'interventions:view'),
  ('MECHANIC', 'interventions:update:own'),
  ('MECHANIC', 'interventions:parts:add'),
  
  -- ACCOUNTANT
  ('ACCOUNTANT', 'clients:view'),
  ('ACCOUNTANT', 'vehicles:view'),
  ('ACCOUNTANT', 'interventions:view'),
  ('ACCOUNTANT', 'interventions:pricing:edit'),
  ('ACCOUNTANT', 'invoices:view'),
  ('ACCOUNTANT', 'invoices:create'),
  ('ACCOUNTANT', 'invoices:update'),
  ('ACCOUNTANT', 'invoices:delete'),
  ('ACCOUNTANT', 'reports:view')
ON CONFLICT (role, permission_code) DO NOTHING;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_code ON user_permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- 7. Add comments
COMMENT ON TABLE permissions IS 'Catalog of all available permissions in the system';
COMMENT ON TABLE user_permissions IS 'Custom permissions assigned to specific users';
COMMENT ON TABLE role_permissions IS 'Default permissions for each role';
