-- Enable RLS (just in case)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to create appointments
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;
CREATE POLICY "Public can create appointments"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow public (anon) to create clients
DROP POLICY IF EXISTS "Public can create clients" ON public.clients;
CREATE POLICY "Public can create clients"
ON public.clients
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow public (anon) to SELECT clients (needed for "check if exists" logic)
DROP POLICY IF EXISTS "Public can select clients" ON public.clients;
CREATE POLICY "Public can select clients"
ON public.clients
FOR SELECT
TO anon
USING (true);

-- Ensure Services are viewable by public
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
ON public.services
FOR SELECT
TO anon
USING (is_active = true);

-- Ensure Tenants are viewable by public
DROP POLICY IF EXISTS "Public can view tenants" ON public.tenants;
CREATE POLICY "Public can view tenants"
ON public.tenants
FOR SELECT
TO anon
USING (true);
