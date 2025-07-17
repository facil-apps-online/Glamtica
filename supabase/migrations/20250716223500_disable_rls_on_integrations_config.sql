-- supabase/migrations/20250716223500_disable_rls_on_integrations_config.sql

-- Desactivamos la Seguridad a Nivel de Fila (RLS) en la tabla de configuración.
-- Esta tabla contiene datos no sensibles y necesita ser accesible por las funciones del sistema.
ALTER TABLE public.integrations_config DISABLE ROW LEVEL SECURITY;
