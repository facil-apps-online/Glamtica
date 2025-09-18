
-- MIGRATION: DEBUG STEP 2 - Disable ALL time-based checks (schedules and time_off)
CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_item_id UUID,
    p_item_type TEXT, -- 'service' or 'combo'
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
STABLE
SECURITY DEFINER
AS $$
BEGIN
    -- DEBUGGING VERSION: This version IGNORES all time-based logic (schedules, time_off, timezones)
    -- and returns all active users in the branch, or the specifically assigned user.

    RETURN QUERY
    SELECT DISTINCT ON (tu.user_id)
        tu.user_id,
        COALESCE(suc.commission_rate, 0.00) AS commission_rate,
        COALESCE(tu.first_name, '') AS first_name,
        COALESCE(tu.last_name, '') AS last_name,
        (tu.status = 'active') AS is_active
    FROM
        public.get_tenant_users(p_tenant_id) tu
    LEFT JOIN LATERAL (
        SELECT suc.commission_rate
        FROM public.service_user_commissions suc
        WHERE suc.user_id = tu.user_id
          AND suc.branch_id = p_branch_id
          AND suc.tenant_id = p_tenant_id
          AND (
            (p_item_type = 'service' AND suc.service_id = p_item_id)
            OR
            (p_item_type = 'combo' AND suc.service_id IN (
                SELECT ci.service_id FROM public.combo_items ci WHERE ci.combo_id = p_item_id AND ci.service_id IS NOT NULL
            ))
          )
        ORDER BY suc.created_at DESC
        LIMIT 1
    ) suc ON TRUE
    WHERE
        -- This simplified WHERE clause is for debugging only.
        -- It checks for active users in the branch OR the specifically assigned user.
        (tu.branch_id = p_branch_id AND tu.status = 'active')
        OR 
        (tu.user_id = p_assigned_user_id AND p_assigned_user_id IS NOT NULL);
END;
$$;
