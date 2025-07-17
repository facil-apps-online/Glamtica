
CREATE OR REPLACE FUNCTION public.get_tenant_access_logs(p_tenant_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    action text,
    details jsonb,
    ip_address inet,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (SELECT public.is_super_admin()) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden ver los logs de acceso de los tenants.';
    END IF;

    RETURN QUERY
    SELECT
        al.id,
        al.user_id,
        al.action,
        al.details,
        al.ip_address,
        al.created_at
    FROM
        public.audit_logs al
    WHERE
        al.tenant_id = p_tenant_id
    ORDER BY
        al.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_access_logs(uuid) TO authenticated;
