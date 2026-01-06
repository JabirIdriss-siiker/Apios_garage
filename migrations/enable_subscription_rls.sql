-- Enable RLS on tenant_subscriptions if not already enabled
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Tenants can view their own subscriptions" ON tenant_subscriptions;
DROP POLICY IF EXISTS "Tenants can update their own subscriptions" ON tenant_subscriptions;
DROP POLICY IF EXISTS "Tenants can insert their own subscriptions" ON tenant_subscriptions;
DROP POLICY IF EXISTS "SuperAdmins can manage all subscriptions" ON tenant_subscriptions;

-- Policy: Tenants can view their own subscriptions
CREATE POLICY "Tenants can view their own subscriptions"
ON tenant_subscriptions
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
);

-- Policy: Tenant admins can update their own subscriptions
CREATE POLICY "Tenants can update their own subscriptions"
ON tenant_subscriptions
FOR UPDATE
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

-- Policy: Tenant admins can insert their own subscriptions
CREATE POLICY "Tenants can insert their own subscriptions"
ON tenant_subscriptions
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
);

-- Policy: SuperAdmins can manage all subscriptions
CREATE POLICY "SuperAdmins can manage all subscriptions"
ON tenant_subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPERADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPERADMIN'
  )
);
