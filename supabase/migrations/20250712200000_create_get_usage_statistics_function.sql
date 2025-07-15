
CREATE OR REPLACE FUNCTION public.get_usage_statistics()
RETURNS TABLE (
    total_logins bigint,
    total_appointments_created bigint,
    total_products_sold bigint,
    total_services_rendered bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (SELECT public.is_super_admin()) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden ver las estadísticas de uso.';
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.audit_logs WHERE action = 'user_login') AS total_logins,
        (SELECT COUNT(*) FROM public.attentions) AS total_appointments_created,
        (SELECT SUM(quantity) FROM public.attention_products) AS total_products_sold,
        (SELECT COUNT(*) FROM public.attention_services) AS total_services_rendered;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_usage_statistics() TO authenticated;
