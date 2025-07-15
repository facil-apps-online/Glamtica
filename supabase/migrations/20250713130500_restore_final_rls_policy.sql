-- MIGRACIÓN FINAL: Restaurar y corregir la política de RLS para 'locales'

-- 1. Eliminar la política de diagnóstico temporal.
DROP POLICY IF EXISTS "DIAGNOSTIC_ALLOW_ALL_AUTHENTICATED" ON public.locales;

-- 2. Crear la política de escritura definitiva y correcta para el super_admin.
CREATE POLICY "ALLOW_SUPER_ADMIN_ALL_ACCESS_ON_LOCALES" ON public.locales
FOR ALL
USING ((auth.jwt() ->> 'role') = 'super_admin')
WITH CHECK ((auth.jwt() ->> 'role') = 'super_admin');

-- 3. Restaurar la política de lectura para todos los usuarios autenticados.
CREATE POLICY "ALLOW_AUTHENTICATED_READ_ON_LOCALES" ON public.locales
FOR SELECT
USING (auth.role() = 'authenticated');
