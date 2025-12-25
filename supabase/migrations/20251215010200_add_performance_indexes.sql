/*
  # Add Performance Indexes

  1. New Indexes
    - Interventions: client_id, tenant_id + status
    - Invoices: tenant_id + status
    - Vehicles: tenant_id + license_plate
    - Appointments: tenant_id + appointment_date + status

  2. Important Notes
    - These indexes optimize common query patterns
    - Composite indexes are ordered by selectivity (most selective first)
    - Partial indexes used where appropriate to reduce index size
*/

-- Interventions indexes
CREATE INDEX IF NOT EXISTS idx_interventions_client_id ON interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_tenant_status ON interventions(tenant_id, status);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);

-- Vehicles indexes (for quick license plate lookups)
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate_tenant ON vehicles(tenant_id, license_plate);

-- Appointments indexes (for calendar queries)
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date_status ON appointments(tenant_id, appointment_date, status);

-- Clients indexes (for search)
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(tenant_id, phone) WHERE phone IS NOT NULL;
