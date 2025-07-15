-- Modificar la política de seguridad para usar el claim 'role' en lugar de 'user_role'

-- 1. Eliminar la política antigua
DROP POLICY IF EXISTS "Allow all for super_admin on locales" ON public.locales;

-- 2. Crear la política nueva y corregida
CREATE POLICY "Allow all for super_admin on locales" ON public.locales FOR ALL
    USING ((auth.jwt() ->> 'role') = 'super_admin')
    WITH CHECK ((auth.jwt() ->> 'role') = 'super_admin');
