-- Eliminar la política RLS temporal de depuración (si la creaste)
DROP POLICY IF EXISTS "debug_allow_all_authenticated_read" ON public.tenant_integrations;

-- Eliminar la política RLS original
DROP POLICY IF EXISTS "Allow super_admins to read their integrations" ON public.tenant_integrations;

-- Crear la nueva política RLS para leer el rol desde app_metadata
CREATE POLICY "Allow super_admins to read their integrations"
ON public.tenant_integrations
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);
