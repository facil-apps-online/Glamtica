
-- MIGRATION: Fix "column tu.tenant_id does not exist" error in check_user_availability

-- Drop the previous version of the function
DROP FUNCTION IF EXISTS public.check_user_availability(uuid, text, uuid, uuid, timestamptz, integer, uuid);

-- Recreate the function without the redundant tenant_id check
CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_item_id UUID,
    p_item_type TEXT,
    p_branch_id UUID,
    p_tenant_id UUID,
    p_appointment_datetime TIMESTAMPTZ,
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
DECLARE
    v_day_of_week INTEGER := EXTRACT(DOW FROM p_appointment_datetime);
    v_tenant_timezone TEXT;
    v_appointment_end_utc TIMESTAMPTZ;
    v_appointment_range TSRANGE;
BEGIN
    -- 1. Get tenant timezone
    SELECT default_timezone INTO v_tenant_timezone FROM public.tenants WHERE id = p_tenant_id;
    IF v_tenant_timezone IS NULL THEN
        v_tenant_timezone := 'UTC';
    END IF;

    -- 2. Calculate appointment time range in UTC
    v_appointment_end_utc := p_appointment_datetime + (p_duration_minutes || ' minutes')::INTERVAL;
    v_appointment_range := TSRANGE(p_appointment_datetime::TIMESTAMP WITHOUT TIME ZONE, v_appointment_end_utc::TIMESTAMP WITHOUT TIME ZONE);

    -- Main Query
    RETURN QUERY
    SELECT
        tu.user_id,
        COALESCE(suc.commission_rate, tu.default_service_commission_rate, 0.00) AS commission_rate,
        tu.first_name,
        tu.last_name,
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
        -- REMOVED: tu.tenant_id = p_tenant_id (This is redundant as get_tenant_users is already scoped)
        tu.branch_id = p_branch_id
        AND tu.status = 'active'
        AND (
            ( -- Main availability logic block
                EXISTS (
                    SELECT 1
                    FROM public.user_schedules us
                    WHERE us.user_id = tu.user_id
                      AND us.day_of_week = v_day_of_week
                      AND us.is_active = TRUE
                      AND us.tenant_id = p_tenant_id
                      AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
                      AND TSRANGE(
                            ( (p_appointment_datetime::DATE::TEXT || ' ' || us.start_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE(tu.timezone, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE,
                            ( (p_appointment_datetime::DATE::TEXT || ' ' || us.end_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE(tu.timezone, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE
                          ) @> v_appointment_range
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM public.user_time_off uto
                    WHERE uto.user_id = tu.user_id
                      AND uto.status = 'approved'
                      AND uto.tenant_id = p_tenant_id
                      AND (uto.branch_id IS NULL OR uto.branch_id = p_branch_id)
                      AND v_appointment_range && TSRANGE(
                          uto.start_date AT TIME ZONE 'UTC', 
                          uto.end_date AT TIME ZONE 'UTC'
                      )
                )
            )
            OR (tu.user_id = p_assigned_user_id AND p_assigned_user_id IS NOT NULL)
        );
END;
$$;
