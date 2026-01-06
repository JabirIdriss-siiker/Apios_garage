-- Seed subscription plans
-- This migration creates the default subscription plans for the application

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, max_users, max_vehicles, max_storage_gb, features, is_active)
VALUES
  (
    'Basic',
    29.99,
    5,
    50,
    5,
    '{"advanced_reports": false, "api_access": false, "custom_branding": false}'::jsonb,
    true
  ),
  (
    'Pro',
    79.99,
    15,
    200,
    20,
    '{"advanced_reports": true, "api_access": false, "custom_branding": true}'::jsonb,
    true
  ),
  (
    'Entreprise',
    199.99,
    50,
    1000,
    100,
    '{"advanced_reports": true, "api_access": true, "custom_branding": true, "priority_support": true}'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;
