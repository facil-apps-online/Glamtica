
-- MIGRATION: Definitive Final Cleanup - Drop all overloaded versions of check_user_availability and create the single correct version.

-- Step 1: Drop the exact conflicting signatures provided by the user.
-- Version with 7 parameters (date, time)
DROP FUNCTION IF EXISTS public.check_user_availability(uuid, text, uuid, uuid, date, time without time zone, integer);

-- Version with 8 parameters (date, time)
DROP FUNCTION IF EXISTS public.check_user_availability(uuid, text, uuid, uuid, date, time without time zone, integer, uuid);


-- Step 2: Create the single, definitive version of the function with a TIMESTAMPTZ parameter.
-- This version is what the Edge Function expects to call.
CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_item_id UUID,
    p_item_type TEXT,
    p_branch_id UUID,
    p_tenant_id UUID,
    p_appointment_datetime TIMESTAMPTZ, -- Using a single TIMESTAMPTZ
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
    -- The input p_appointment_datetime is already in UTC from the Edge Function.
    v_appointment_end_utc := p_appointment_datetime + (p_duration_minutes || ' minutes')::INTERVAL;
    v_appointment_range := TSRANGE(p_appointment_datetime::TIMESTAMP WITHOUT TIME ZONE, v_appointment_end_utc::TIMESTAMP WITHOUT TIME ZONE);

    -- Main Query (Inlined logic)
    RETURN QUERY
    SELECT
        ua.user_id,
        COALESCE(suc.commission_rate, ua.default_service_commission_rate, 0.00) AS commission_rate,
        (u.raw_user_meta_data ->> 'first_name')::text AS first_name,
        (u.raw_user_meta_data ->> 'last_name')::text AS last_name,
        (ua.status = 'active') AS is_active
    FROM
        public.user_assignments ua
    JOIN
        auth.users u ON ua.user_id = u.id
    LEFT JOIN LATERAL (
        SELECT suc.commission_rate
        FROM public.service_user_commissions suc
        WHERE suc.user_id = ua.user_id
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
        ua.tenant_id = p_tenant_id
        AND ua.branch_id = p_branch_id
        AND ua.status = 'active'
        AND (
            ( -- Main availability logic block
                EXISTS (
                    SELECT 1
                    FROM public.user_schedules us
                    WHERE us.user_id = ua.user_id
                      AND us.day_of_week = v_day_of_week
                      AND us.is_active = TRUE
                      AND us.tenant_id = p_tenant_id
                      AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
                      AND TSRANGE(
                            ( (p_appointment_datetime::DATE::TEXT || ' ' || us.start_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE((u.raw_user_meta_data ->> 'timezone')::text, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE,
                            ( (p_appointment_datetime::DATE::TEXT || ' ' || us.end_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE((u.raw_user_meta_data ->> 'timezone')::text, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE
                          ) @> v_appointment_range
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM public.user_time_off uto
                    WHERE uto.user_id = ua.user_id
                      AND uto.status = 'approved'
                      AND uto.tenant_id = p_tenant_id
                      AND (uto.branch_id IS NULL OR uto.branch_id = p_branch_id)
                      AND v_appointment_range && TSRANGE(
                          uto.start_date_time AT TIME ZONE 'UTC', 
                          uto.end_date_time AT TIME ZONE 'UTC'
                      )
                )
                AND EXISTS (
                    SELECT 1 FROM public.service_user_commissions suc_perm 
                    WHERE suc_perm.user_id = ua.user_id 
                    AND suc_perm.can_perform = TRUE
                    AND (
                        (p_item_type = 'service' AND suc_perm.service_id = p_item_id)
                        OR
                        (p_item_type = 'combo' AND suc_perm.service_id IN (SELECT ci.service_id FROM public.combo_items ci WHERE ci.combo_id = p_item_id AND ci.service_id IS NOT NULL))
                    )
                )
            )
            OR (ua.user_id = p_assigned_user_id AND p_assigned_user_id IS NOT NULL)
        );
END;
$$;
