/*
  # Assign subscriptions to existing tenants

  1. Changes
    - Update existing tenants to have active subscription status
    - Create Basic plan subscriptions for existing tenants
  
  2. Notes
    - This migration assigns the Basic plan to all existing tenants that don't have a subscription
    - Existing tenants will automatically have an active subscription
*/

-- Update existing tenants to have active subscription status
UPDATE tenants 
SET subscription_status = 'active'
WHERE subscription_status IS NULL OR subscription_status = '';

-- Create subscriptions for tenants that don't have one
INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, started_at)
SELECT 
  t.id,
  (SELECT id FROM subscription_plans WHERE name = 'Basic' LIMIT 1),
  'active',
  now()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_subscriptions ts
  WHERE ts.tenant_id = t.id
);
