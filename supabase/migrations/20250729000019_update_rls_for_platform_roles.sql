-- supabase/migrations/20250729000019_update_rls_for_platform_roles.sql

-- Primero, eliminamos las políticas existentes para poder recrearlas.
-- Es más seguro que usar ALTER POLICY si la lógica cambia sustancialmente.

DROP POLICY IF EXISTS "Enable read access for all users" ON public.platforms;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tenants;

-- Nueva política para la tabla 'platforms'
CREATE POLICY "Enable read access for platform roles"
ON public.platforms
FOR SELECT
USING (
    -- El super_admin global puede ver todo.
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    OR
    -- Los roles a nivel de plataforma pueden ver las plataformas que tienen asignadas.
    id IN (SELECT platform_id FROM public.get_user_accessible_platforms())
);

-- Nueva política para la tabla 'tenants'
CREATE POLICY "Enable read access for platform roles"
ON public.tenants
FOR SELECT
USING (
    -- El super_admin global puede ver todo.
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
    OR
    -- Un usuario normal puede ver su propio tenant (lógica de la aplicación principal).
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    OR
    -- Los roles a nivel de plataforma pueden ver los tenants de las plataformas que tienen asignadas.
    platform_id IN (SELECT platform_id FROM public.get_user_accessible_platforms())
);

-- Nota: Las políticas para INSERT, UPDATE, DELETE no se modifican en este paso,
-- ya que esas acciones se manejan a través de Edge Functions que se ejecutan con
-- la service_role_key, la cual salta las políticas RLS. La seguridad de escritura
-- está garantizada a nivel de API.
