
DROP FUNCTION IF EXISTS get_user_time_off_history(uuid, uuid, text, text, date, date, uuid, text);

CREATE OR REPLACE FUNCTION get_user_time_off_history(
    p_tenant_id uuid,
    p_user_id uuid DEFAULT NULL,
    p_status_filter text DEFAULT 'all',
    p_type_filter text DEFAULT 'all',
    p_date_range_start date DEFAULT NULL,
    p_date_range_end date DEFAULT NULL,
    p_branch_id uuid DEFAULT NULL,
    p_search_term text DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    user_name text,
    branch_id uuid,
    branch_name text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    type text,
    reason text,
    status text,
    approved_by text,
    created_at timestamp with time zone,
    is_partial_day boolean
) AS $$
BEGIN
    RETURN QUERY
    WITH tenant_users AS (
        SELECT * FROM get_tenant_users(p_tenant_id)
    )
    SELECT
        uto.id,
        uto.user_id,
        tu.first_name || ' ' || tu.last_name as user_name,
        uto.branch_id,
        tu.branch_name,
        uto.start_date,
        uto.end_date,
        uto.type,
        uto.reason,
        uto.status,
        uto.approved_by,
        uto.created_at,
        uto.is_partial_day
    FROM
        public.user_time_off uto
    JOIN
        tenant_users tu ON uto.user_id = tu.user_id
    WHERE
        uto.tenant_id = p_tenant_id
        AND (p_user_id IS NULL OR uto.user_id = p_user_id)
        AND (p_branch_id IS NULL OR uto.branch_id = p_branch_id)
        AND (p_status_filter = 'all' OR uto.status = p_status_filter)
        AND (p_type_filter = 'all' OR uto.type = p_type_filter)
        AND (p_date_range_start IS NULL OR uto.created_at::date >= p_date_range_start)
        AND (p_date_range_end IS NULL OR uto.created_at::date <= p_date_range_end)
        AND (
            p_search_term IS NULL OR
            (
                tu.first_name ILIKE '%' || p_search_term || '%' OR
                tu.last_name ILIKE '%' || p_search_term || '%' OR
                tu.email ILIKE '%' || p_search_term || '%' OR
                (tu.raw_user_meta_data->>'phone') ILIKE '%' || p_search_term || '%'
            )
        );
END;
$$ LANGUAGE plpgsql;
