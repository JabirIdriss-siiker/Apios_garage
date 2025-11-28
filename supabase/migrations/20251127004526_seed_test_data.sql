/*
  # Seed Test Data

  This migration adds test data for development and testing purposes.

  ## 1. Test Tenants
  - Garage Dupont (Paris)
  - Auto Service Martin (Lyon)

  ## 2. Test Users
  - SuperAdmin: superadmin@test.com / password123
  - Tenant Admin 1: admin@dupont.com / password123 (Garage Dupont)
  - Tenant Admin 2: admin@martin.com / password123 (Auto Service Martin)
  - Mechanic: mechanic@dupont.com / password123 (Garage Dupont)

  ## 3. Test Clients
  - Multiple clients for each tenant

  ## Important Notes
  - This is for testing only
  - User passwords will need to be created via Supabase Auth
  - UUIDs are hardcoded for consistency
*/

-- Insert test tenants
INSERT INTO tenants (id, name, email, phone, address, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Garage Dupont',
    'contact@dupont-garage.fr',
    '01 23 45 67 89',
    '123 Avenue des Champs-Élysées, 75008 Paris',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Auto Service Martin',
    'contact@martin-auto.fr',
    '04 56 78 90 12',
    '45 Rue de la République, 69002 Lyon',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test clients for Garage Dupont
INSERT INTO clients (tenant_id, name, email, phone, address, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Jean Lefebvre',
    'jean.lefebvre@email.fr',
    '06 12 34 56 78',
    '10 Rue de Rivoli, 75001 Paris',
    now(),
    now()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Marie Bernard',
    'marie.bernard@email.fr',
    '06 23 45 67 89',
    '22 Boulevard Haussmann, 75009 Paris',
    now(),
    now()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Pierre Dubois',
    'pierre.dubois@email.fr',
    '06 34 56 78 90',
    '15 Rue du Louvre, 75001 Paris',
    now(),
    now()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Sophie Moreau',
    'sophie.moreau@email.fr',
    '06 45 67 89 01',
    '8 Place de la Concorde, 75008 Paris',
    now(),
    now()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Luc Petit',
    'luc.petit@email.fr',
    '06 56 78 90 12',
    '30 Rue de la Paix, 75002 Paris',
    now(),
    now()
  )
ON CONFLICT DO NOTHING;

-- Insert test clients for Auto Service Martin
INSERT INTO clients (tenant_id, name, email, phone, address, created_at, updated_at)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'Antoine Rousseau',
    'antoine.rousseau@email.fr',
    '06 67 89 01 23',
    '12 Rue Victor Hugo, 69002 Lyon',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Isabelle Girard',
    'isabelle.girard@email.fr',
    '06 78 90 12 34',
    '25 Cours Lafayette, 69003 Lyon',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'François Blanc',
    'francois.blanc@email.fr',
    '06 89 01 23 45',
    '7 Place Bellecour, 69002 Lyon',
    now(),
    now()
  )
ON CONFLICT DO NOTHING;
