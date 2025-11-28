/*
  # Create Facturation Module (Invoices & Quotes)

  1. New Tables
    - `invoices` - Store invoices and quotes
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `intervention_id` (uuid, nullable foreign key)
      - `client_id` (uuid, nullable foreign key)
      - `invoice_number` (text, unique per tenant)
      - `quote_number` (text, unique per tenant)
      - `type` (text: 'invoice' or 'quote')
      - `status` (text: 'draft', 'sent', 'paid', 'overdue')
      - `description` (text)
      - `notes` (text)
      - `subtotal_ex_tax` (numeric)
      - `tax_rate` (numeric, percentage 0-100)
      - `tax_amount` (numeric)
      - `total_inc_tax` (numeric)
      - `currency` (text, default: 'EUR')
      - `issued_date` (date)
      - `due_date` (date)
      - `paid_date` (date, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `invoice_items` - Line items for invoices
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key)
      - `description` (text)
      - `quantity` (numeric)
      - `unit_price` (numeric)
      - `subtotal` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for tenant isolation
    - Users can only see invoices for their tenant

  3. Important Notes
    - TAX calculation is automatic: tax_amount = subtotal_ex_tax * (tax_rate / 100)
    - total_inc_tax = subtotal_ex_tax + tax_amount
    - Status flow: draft → sent → paid or overdue
    - Invoices can be created standalone or linked to interventions
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  intervention_id uuid REFERENCES interventions(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number text,
  quote_number text,
  type text NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'quote')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  description text,
  notes text,
  subtotal_ex_tax numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 20,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_inc_tax numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  paid_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, invoice_number),
  UNIQUE(tenant_id, quote_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_intervention_id ON invoices(intervention_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices for their tenant"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invoices.tenant_id
    )
  );

CREATE POLICY "Users can create invoices for their tenant"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invoices.tenant_id
    )
  );

CREATE POLICY "Users can update invoices for their tenant"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invoices.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invoices.tenant_id
    )
  );

CREATE POLICY "Users can delete invoices for their tenant"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = invoices.tenant_id
    )
  );

CREATE POLICY "Users can view invoice items for their tenant"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = invoices.tenant_id
      )
    )
  );

CREATE POLICY "Users can create invoice items for their tenant"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = invoices.tenant_id
      )
    )
  );

CREATE POLICY "Users can update invoice items for their tenant"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = invoices.tenant_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = invoices.tenant_id
      )
    )
  );

CREATE POLICY "Users can delete invoice items for their tenant"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = invoices.tenant_id
      )
    )
  );
