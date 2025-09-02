-- Migration: Fix user_time_off check in check_user_availability RPC

-- Step 1: Drop the old function
DROP FUNCTION IF EXISTS public.check_user_availability(uuid, text, uuid, uuid, timestamptz, integer, uuid, uuid);

-- Step 2: Create the new function with corrected user_time_off check
CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_item_id UUID,
    p_item_type TEXT, -- 'service' or 'combo'
    p_branch_id UUID,
    p_tenant_id UUID,
    p_appointment_datetime TIMESTAMPTZ, -- New single parameter
    p_duration_minutes INTEGER,
    p_assigned_user_id UUID DEFAULT NULL,
    p_attention_id UUID DEFAULT NULL -- To exclude the current attention being edited
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
DECLARE
    v_day_of_week INTEGER := EXTRACT(DOW FROM p_appointment_datetime);
    v_tenant_timezone TEXT;
    v_appointment_end_utc TIMESTAMPTZ;
    v_appointment_range TSTZRANGE;
BEGIN
    -- 1. Get tenant timezone
    SELECT default_timezone INTO v_tenant_timezone FROM public.tenants WHERE id = p_tenant_id;
    IF v_tenant_timezone IS NULL THEN
        v_tenant_timezone := 'UTC';
    END IF;

    -- 2. Calculate end time and range in UTC
    v_appointment_end_utc := p_appointment_datetime + (p_duration_minutes || ' minutes')::INTERVAL;
    v_appointment_range := TSTZRANGE(p_appointment_datetime, v_appointment_end_utc, '[]');

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
        tu.branch_id = p_branch_id
        AND tu.status = 'active'
        AND (
            ( -- Availability logic
                -- Check user schedule
                EXISTS (
                    SELECT 1
                    FROM public.user_schedules us
                    WHERE us.user_id = tu.user_id
                      AND us.day_of_week = v_day_of_week
                      AND us.is_active = TRUE
                      AND us.tenant_id = p_tenant_id
                      AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
                      AND public.is_time_in_schedule(p_appointment_datetime, p_duration_minutes, us.start_time, us.end_time, v_tenant_timezone)
                )
                -- Check for conflicting attentions
                AND NOT EXISTS (
                    SELECT 1
                    FROM public.attention_services aserv
                    JOIN public.attentions a ON a.id = aserv.attention_id
                    WHERE aserv.user_id = tu.user_id
                      AND a.status NOT IN ('Cancelada', 'Completada', 'Pagada')
                      AND (p_attention_id IS NULL OR a.id <> p_attention_id)
                      AND TSTZRANGE(a.attention_datetime, a.attention_datetime + (aserv.duration_minutes || ' minutes')::interval, '[]') && v_appointment_range
                )
                -- Check for time off
                AND NOT EXISTS (
                    SELECT 1
                    FROM public.user_time_off uto
                    WHERE uto.user_id = tu.user_id
                      AND uto.status = 'approved'
                      AND uto.tenant_id = p_tenant_id
                      AND (uto.branch_id IS NULL OR uto.branch_id = p_branch_id)
                      AND v_appointment_range && TSTZRANGE(date_trunc('day', uto.start_date), date_trunc('day', uto.end_date) + interval '1 day' - interval '1 microsecond', '[]') -- Corrected time off range
                )
            )
            OR (tu.user_id = p_assigned_user_id AND p_assigned_user_id IS NOT NULL) -- Always include the currently assigned user
        );
END;
$$;
