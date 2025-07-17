-- Force drop and recreate the policy to ensure caches are invalidated.
DROP POLICY IF EXISTS "Allow super_admins to read their integrations" ON public.tenant_integrations;

CREATE POLICY "Allow super_admins to read their integrations"
ON public.tenant_integrations
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role') = 'super_admin'
);
