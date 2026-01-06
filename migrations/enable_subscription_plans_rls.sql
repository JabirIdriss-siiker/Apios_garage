-- Enable RLS on subscription_plans if not already enabled
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "SuperAdmins can manage subscription plans" ON subscription_plans;

-- Policy: Anyone authenticated can view active plans
CREATE POLICY "Anyone can view active subscription plans"
ON subscription_plans
FOR SELECT
USING (is_active = true);

-- Policy: Only SuperAdmins can manage plans
CREATE POLICY "SuperAdmins can manage subscription plans"
ON subscription_plans
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
