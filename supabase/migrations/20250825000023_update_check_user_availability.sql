-- Migration: Update check_user_availability to use default commissions

-- Step 1: Drop the old function.
DROP FUNCTION IF EXISTS public.check_user_availability(UUID, TEXT, UUID, UUID, DATE, TIME WITHOUT TIME ZONE, INTEGER, UUID);

-- Step 2: Create the new, updated check_user_availability function.
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
DECLARE
    v_day_of_week INTEGER := EXTRACT(DOW FROM p_appointment_date);
    v_tenant_timezone TEXT;
    v_appointment_start_utc TIMESTAMPTZ;
    v_appointment_end_utc TIMESTAMPTZ;
    v_appointment_range TSRANGE;
    v_combo_service_count INTEGER;
BEGIN
    -- 1. Get tenant timezone
    SELECT default_timezone INTO v_tenant_timezone FROM public.tenants WHERE id = p_tenant_id;
    IF v_tenant_timezone IS NULL THEN
        v_tenant_timezone := 'UTC';
    END IF;

    -- 2. Convert appointment time to UTC
    v_appointment_start_utc := (p_appointment_date::TEXT || ' ' || p_appointment_time::TEXT)::TIMESTAMP AT TIME ZONE v_tenant_timezone AT TIME ZONE 'UTC';
    v_appointment_end_utc := v_appointment_start_utc + (p_duration_minutes || ' minutes')::INTERVAL;
    v_appointment_range := TSRANGE(v_appointment_start_utc::TIMESTAMP WITHOUT TIME ZONE, v_appointment_end_utc::TIMESTAMP WITHOUT TIME ZONE, '[]');

    -- If item is a combo, count the number of services in it
    IF p_item_type = 'combo' THEN
        SELECT count(*) INTO v_combo_service_count FROM public.combo_items ci WHERE ci.combo_id = p_item_id AND ci.service_id IS NOT NULL;
    END IF;

    RETURN QUERY
    WITH potential_users AS (
        -- Get all active users for the branch, or only the assigned user if specified
        SELECT
            tu.user_id,
            tu.first_name,
            tu.last_name,
            tu.status,
            tu.default_service_commission_rate,
            (SELECT u.raw_user_meta_data->>'timezone' FROM auth.users u WHERE u.id = tu.user_id) as user_timezone
        FROM
            public.get_tenant_users(p_tenant_id) tu
        WHERE
            tu.branch_id = p_branch_id
            AND tu.status = 'active'
            AND (p_assigned_user_id IS NULL OR tu.user_id = p_assigned_user_id)
    )
    SELECT
        pu.user_id,
        COALESCE(
            (SELECT suc.commission_rate
             FROM public.service_user_commissions suc
             WHERE suc.user_id = pu.user_id
               AND suc.branch_id = p_branch_id
               AND suc.tenant_id = p_tenant_id
               AND suc.service_id = p_item_id
             ORDER BY suc.created_at DESC
             LIMIT 1),
            pu.default_service_commission_rate,
            0.00
        ) AS commission_rate,
        pu.first_name,
        pu.last_name,
        (pu.status = 'active')
    FROM
        potential_users pu
    WHERE
        -- Check 1: User must be able to perform the service(s)
        (
            (p_item_type = 'service' AND EXISTS (
                SELECT 1 FROM public.service_user_commissions suc
                WHERE suc.user_id = pu.user_id
                  AND suc.branch_id = p_branch_id
                  AND suc.service_id = p_item_id
                  AND suc.can_perform = TRUE
            ))
            OR
            (p_item_type = 'combo' AND (
                SELECT count(*)
                FROM public.service_user_commissions suc
                JOIN public.combo_items ci ON suc.service_id = ci.service_id
                WHERE ci.combo_id = p_item_id
                  AND suc.user_id = pu.user_id
                  AND suc.branch_id = p_branch_id
                  AND suc.can_perform = TRUE
            ) = v_combo_service_count)
        )
        -- Check 2: User must be scheduled to work
        AND EXISTS (
            SELECT 1
            FROM public.user_schedules us
            WHERE us.user_id = pu.user_id
              AND us.day_of_week = v_day_of_week
              AND us.is_active = TRUE
              AND us.tenant_id = p_tenant_id
              AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
              AND TSRANGE(
                    ( (p_appointment_date::TEXT || ' ' || us.start_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE(pu.user_timezone, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE,
                    ( (p_appointment_date::TEXT || ' ' || us.end_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE(pu.user_timezone, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE
                  ) @> v_appointment_range
        )
        -- Check 3: User must not have approved time off
        AND NOT EXISTS (
            SELECT 1
            FROM public.user_time_off uto
            WHERE uto.user_id = pu.user_id
              AND uto.status = 'approved'
              AND uto.tenant_id = p_tenant_id
              AND uto.branch_id = p_branch_id
              AND TSTZRANGE(uto.start_datetime, uto.end_datetime) && TSTZRANGE(v_appointment_start_utc, v_appointment_end_utc)
        )
        -- Check 4: User must not have an overlapping appointment
        AND NOT EXISTS (
            SELECT 1
            FROM public.attention_services asrv
            JOIN public.attentions a ON asrv.attention_id = a.id
            JOIN public.services s ON asrv.service_id = s.id
            WHERE asrv.user_id = pu.user_id
              AND a.status NOT IN ('Cancelada', 'Rechazada')
              AND TSTZRANGE(
                (a.attention_date::TEXT || ' ' || a.attention_time::TEXT)::TIMESTAMP AT TIME ZONE v_tenant_timezone,
                (a.attention_date::TEXT || ' ' || a.attention_time::TEXT)::TIMESTAMP AT TIME ZONE v_tenant_timezone + (s.duration_minutes || ' minutes')::INTERVAL
              ) && TSTZRANGE(v_appointment_start_utc, v_appointment_end_utc)
        );
END;
$$;
