
-- MIGRATION: DEBUG STEP - Inline get_tenant_users logic into check_user_availability (base version)

CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_item_id UUID,
    p_item_type TEXT,
    p_branch_id UUID,
    p_tenant_id UUID,
    p_appointment_date DATE,
    p_appointment_time TIME WITHOUT TIME ZONE,
    p_duration_minutes INTEGER,
    p_assigned_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    user_id UUID,
    commission_rate NUMERIC,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
BEGIN
    RAISE NOTICE '[check_availability_DEBUG_V6_INLINE_BASE] Inlined base logic. No time or schedule checks.';

    RETURN QUERY
    SELECT
        ua.user_id,
        ua.default_service_commission_rate AS commission_rate,
        (u.raw_user_meta_data ->> 'first_name')::text AS first_name,
        (u.raw_user_meta_data ->> 'last_name')::text AS last_name,
        (ua.status = 'active') AS is_active
    FROM
        public.user_assignments ua
    JOIN
        auth.users u ON ua.user_id = u.id
    WHERE
        ua.tenant_id = p_tenant_id;
        -- No other filters are applied in this version.
END;
$$;
