
CREATE OR REPLACE FUNCTION public.get_superadmin_dashboard_stats()
RETURNS TABLE (
    total_tenants bigint,
    active_tenants bigint,
    inactive_tenants bigint,
    total_users bigint,
    total_subscription_plans bigint,
    total_countries bigint,
    total_currencies bigint,
    total_languages bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (SELECT public.is_super_admin()) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden ver las estadísticas del dashboard.';
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.tenants) AS total_tenants,
        (SELECT COUNT(*) FROM public.tenants WHERE subscription_status = 'active') AS active_tenants,
        (SELECT COUNT(*) FROM public.tenants WHERE subscription_status = 'inactive') AS inactive_tenants,
        (SELECT COUNT(*) FROM public.users) AS total_users,
        (SELECT COUNT(*) FROM public.subscription_plans) AS total_subscription_plans,
        (SELECT COUNT(*) FROM public.countries) AS total_countries,
        (SELECT COUNT(*) FROM public.currencies) AS total_currencies,
        (SELECT COUNT(*) FROM public.languages) AS total_languages;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_superadmin_dashboard_stats() TO authenticated;
