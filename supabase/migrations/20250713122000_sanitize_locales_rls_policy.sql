-- Migración de Saneamiento para la Política de Seguridad de 'locales'

-- 1. Eliminar todas las versiones posibles de la política de escritura anterior para evitar conflictos.
DROP POLICY IF EXISTS "Allow all for super_admin on locales" ON public.locales;
DROP POLICY IF EXISTS "Allow all operations for super_admins on locales" ON public.locales;


-- 2. Crear la política de escritura definitiva y correcta.
-- Esta política concede acceso total SÓLO si el token JWT del usuario contiene el claim "role" con el valor "super_admin".
CREATE POLICY "ALLOW_SUPER_ADMIN_ALL_ACCESS_ON_LOCALES" ON public.locales
FOR ALL
USING ((auth.jwt() ->> 'role') = 'super_admin')
WITH CHECK ((auth.jwt() ->> 'role') = 'super_admin');

-- 3. Reforzar la política de lectura para asegurar que no haya conflictos.
DROP POLICY IF EXISTS "Allow public read access on locales" ON public.locales;
CREATE POLICY "ALLOW_AUTHENTICATED_READ_ON_LOCALES" ON public.locales
FOR SELECT
USING (true);
