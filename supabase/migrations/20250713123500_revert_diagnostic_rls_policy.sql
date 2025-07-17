-- MIGRACIÓN DE REVERSIÓN: Restaurar la política de RLS original para 'locales'

-- 1. Eliminar la política de diagnóstico temporal que causó el problema.
DROP POLICY IF EXISTS "TEMP_DIAGNOSTIC_ALLOW_ALL_AUTHENTICATED" ON public.locales;

-- 2. Restaurar la política de escritura original para el super_admin.
CREATE POLICY "ALLOW_SUPER_ADMIN_ALL_ACCESS_ON_LOCALES" ON public.locales
FOR ALL
USING ((auth.jwt() ->> 'role') = 'super_admin')
WITH CHECK ((auth.jwt() ->> 'role') = 'super_admin');

-- 3. Restaurar la política de lectura original.
CREATE POLICY "ALLOW_AUTHENTICATED_READ_ON_LOCALES" ON public.locales
FOR SELECT
USING (true);
