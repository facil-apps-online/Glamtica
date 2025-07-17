
CREATE OR REPLACE FUNCTION public.get_tenant_activity_summary()
RETURNS TABLE (
    tenant_id uuid,
    tenant_name text,
    total_users bigint,
    total_clients bigint,
    total_appointments bigint,
    total_services bigint,
    total_products bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (SELECT public.is_super_admin()) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden ver el resumen de actividad de los tenants.';
    END IF;

    RETURN QUERY
    SELECT
        t.id AS tenant_id,
        t.name AS tenant_name,
        (SELECT COUNT(*) FROM public.users u WHERE u.tenant_id = t.id) AS total_users,
        (SELECT COUNT(*) FROM public.clients c WHERE c.tenant_id = t.id) AS total_clients,
        (SELECT COUNT(*) FROM public.attentions a WHERE a.tenant_id = t.id) AS total_appointments,
        (SELECT COUNT(*) FROM public.services s WHERE s.tenant_id = t.id) AS total_services,
        (SELECT COUNT(*) FROM public.products p WHERE p.tenant_id = t.id) AS total_products
    FROM
        public.tenants t
    ORDER BY
        t.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_activity_summary() TO authenticated;
