# Guide de Déploiement des Migrations

## Problème Rencontré

La commande `npx supabase db push` a échoué avec l'erreur :
```
Cannot find project ref. Have you run supabase link?
```

## Solution

Vous avez deux options pour appliquer les migrations :

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Ouvrez votre projet Supabase** : https://supabase.com/dashboard
2. **Allez dans SQL Editor**
3. **Copiez et exécutez chaque migration dans l'ordre** :

#### Migration 1 : Enrichir Clients
```sql
-- Fichier: 20251215010000_enrich_clients_schema.sql
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'individual' CHECK (client_type IN ('individual', 'professional')),
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS siret text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip_code text;

CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(tenant_id, company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_siret ON clients(tenant_id, siret) WHERE siret IS NOT NULL;
```

#### Migration 2 : Relations Interventions
```sql
-- Fichier: 20251215010100_add_missing_relationships.sql
ALTER TABLE interventions
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_interventions_appointment_id ON interventions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_quote_id ON interventions(quote_id) WHERE quote_id IS NOT NULL;
```

#### Migration 3 : Indexes de Performance
```sql
-- Fichier: 20251215010200_add_performance_indexes.sql
CREATE INDEX IF NOT EXISTS idx_interventions_client_id ON interventions(client_id);
CREATE INDEX IF NOT EXISTS idx_interventions_tenant_status ON interventions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate_tenant ON vehicles(tenant_id, license_plate);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date_status ON appointments(tenant_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(tenant_id, phone) WHERE phone IS NOT NULL;
```

### Option 2 : Lier le Projet Supabase (Pour utiliser CLI)

Si vous souhaitez utiliser le CLI Supabase :

1. **Obtenez votre Project Reference ID** :
   - Allez sur https://supabase.com/dashboard
   - Ouvrez votre projet
   - Allez dans Settings → General
   - Copiez le "Reference ID"

2. **Liez le projet** :
```bash
npx supabase link --project-ref VOTRE_PROJECT_REF
```

3. **Appliquez les migrations** :
```bash
npx supabase db push
```

## Vérification

Après avoir appliqué les migrations, vérifiez dans Supabase Dashboard → Table Editor que :
- ✅ La table `clients` a les nouvelles colonnes (client_type, company_name, etc.)
- ✅ La table `interventions` a les colonnes `appointment_id` et `quote_id`
- ✅ Les indexes ont été créés (visible dans Database → Indexes)

## Note

Les migrations sont **idempotentes** (utilisent `IF NOT EXISTS`), donc vous pouvez les exécuter plusieurs fois sans problème.
