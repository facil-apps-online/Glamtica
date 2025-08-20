GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres;

-- 1. Create a stable function to get the tenant_id from the JWT
CREATE OR REPLACE FUNCTION auth.get_tenant_id_from_jwt()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' -> 'assignments' -> 0 ->> 'tenant_id', '')::uuid;
$$;

-- 2. Drop the old, inefficient policy from the equipment_brands table
DROP POLICY "Allow full access to own tenants" ON public.equipment_brands;

-- 3. Create the new, more performant policy using the stable function
CREATE POLICY "Allow full access to own tenants"
ON public.equipment_brands
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  auth.get_tenant_id_from_jwt() = tenant_id
)
WITH CHECK (
  auth.get_tenant_id_from_jwt() = tenant_id
);