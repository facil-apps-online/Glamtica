-- Migración para eliminar la política de RLS incorrecta de la tabla subscription_items
-- Esta política usaba auth.uid(), lo cual no es compatible con la arquitectura de autenticación personalizada.

DROP POLICY IF EXISTS "Enable read access for admins" ON public.subscription_items;

-- Por ahora, permitiremos el acceso a nivel de API (a través de RPCs seguras)
-- y deshabilitaremos RLS en esta tabla para evitar bloqueos inesperados.
-- La seguridad se manejará en las funciones que accedan a esta tabla.
-- ALTER TABLE public.subscription_items DISABLE ROW LEVEL SECURITY;
-- Nota: Dejamos RLS habilitado pero sin políticas, lo que por defecto deniega todo.
-- Esto es más seguro hasta que se creen las RPCs adecuadas.
