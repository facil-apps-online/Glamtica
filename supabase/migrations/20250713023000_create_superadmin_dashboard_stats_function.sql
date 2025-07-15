-- Migración para crear la función RPC get_superadmin_dashboard_stats
-- Esta función calcula y devuelve las métricas clave para el dashboard del superadministrador.

-- Primero, eliminamos la función si ya existe para evitar conflictos de tipo de retorno.
DROP FUNCTION IF EXISTS get_superadmin_dashboard_stats();

-- Luego, la creamos con la estructura correcta.
CREATE OR REPLACE FUNCTION get_superadmin_dashboard_stats()
RETURNS TABLE (
    total_tenants BIGINT,
    total_active_users BIGINT,
    new_tenants_last_30_days BIGINT,
    active_subscriptions BIGINT
)
LANGUAGE sql
AS $$
SELECT
    (SELECT COUNT(*) FROM public.tenants) AS total_tenants,
    (SELECT COUNT(*) FROM public.users WHERE is_active = TRUE) AS total_active_users,
    (SELECT COUNT(*) FROM public.tenants WHERE created_at >= now() - interval '30 days') AS new_tenants_last_30_days,
    (SELECT COUNT(*) FROM public.tenant_subscriptions WHERE is_active = TRUE) AS active_subscriptions;
$$;