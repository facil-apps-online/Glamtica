-- FASE 4a: Refactorización de la Política de RLS de Users
-- Esta migración actualiza la política de seguridad de la tabla 'users' para que
-- no dependa de las columnas que serán eliminadas.

-- Eliminar la política antigua
DROP POLICY IF EXISTS "users_rls_policy" ON public.users;

-- Crear la nueva política simplificada
-- Ahora que los permisos se basan en 'user_assignments', la política sobre la tabla 'users'
-- solo necesita asegurar dos cosas:
-- 1. El super_admin puede ver a todos los usuarios.
-- 2. Cualquier usuario autenticado puede ver su *propio* perfil.
CREATE POLICY "users_rls_policy" ON public.users
FOR ALL
TO authenticated
USING (
    (SELECT is_super_admin()) OR (id = auth.uid())
)
WITH CHECK (
    (SELECT is_super_admin()) OR (id = auth.uid())
);
