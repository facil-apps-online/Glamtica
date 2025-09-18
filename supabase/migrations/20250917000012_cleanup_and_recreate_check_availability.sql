
-- MIGRATION: Final - Cleanup and recreate a single, correct version of check_user_availability

-- Step 1: Drop all known overloaded versions of the function to remove ambiguity.
DROP FUNCTION IF EXISTS public.check_user_availability(UUID, TEXT, UUID, UUID, DATE, TIME WITHOUT TIME ZONE, INTEGER, UUID);
DROP FUNCTION IF EXISTS public.check_user_availability(UUID, TEXT, UUID, UUID, TIMESTAMPTZ, INTEGER, UUID);
-- Add any other potential signatures here if they exist

-- Step 2: Create the single, definitive version of the function.
-- This version inlines the logic from get_tenant_users to avoid nested RPC calls.
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
DECLARE
    v_day_of_week INTEGER := EXTRACT(DOW FROM p_appointment_date);
    v_tenant_timezone TEXT;
    v_appointment_start_utc TIMESTAMPTZ;
    v_appointment_end_utc TIMESTAMPTZ;
    v_appointment_range TSRANGE;
BEGIN
    -- 1. Get tenant timezone
    SELECT default_timezone INTO v_tenant_timezone FROM public.tenants WHERE id = p_tenant_id;
    IF v_tenant_timezone IS NULL THEN
        v_tenant_timezone := 'UTC';
    END IF;

    -- 2. Calculate appointment time range in UTC
    v_appointment_start_utc := (p_appointment_date::TEXT || ' ' || p_appointment_time::TEXT)::TIMESTAMP AT TIME ZONE v_tenant_timezone AT TIME ZONE 'UTC';
    v_appointment_end_utc := v_appointment_start_utc + (p_duration_minutes || ' minutes')::INTERVAL;
    v_appointment_range := TSRANGE(v_appointment_start_utc::TIMESTAMP WITHOUT TIME ZONE, v_appointment_end_utc::TIMESTAMP WITHOUT TIME ZONE);

    -- Main Query
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
                -- 1. Check if user has a schedule for this day and time
                EXISTS (
                    SELECT 1
                    FROM public.user_schedules us
                    WHERE us.user_id = ua.user_id
                      AND us.day_of_week = v_day_of_week
                      AND us.is_active = TRUE
                      AND us.tenant_id = p_tenant_id
                      AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
                      AND TSRANGE(
                            ( (p_appointment_date::TEXT || ' ' || us.start_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE((u.raw_user_meta_data ->> 'timezone')::text, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE,
                            ( (p_appointment_date::TEXT || ' ' || us.end_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE((u.raw_user_meta_data ->> 'timezone')::text, v_tenant_timezone) AT TIME ZONE 'UTC' )::TIMESTAMP WITHOUT TIME ZONE
                          ) @> v_appointment_range
                )
                -- 2. Check user is NOT on time off
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
                -- 3. Check user can perform the service
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
            -- OR allow if this user was already assigned (for editing purposes)
            OR (ua.user_id = p_assigned_user_id AND p_assigned_user_id IS NOT NULL)
        );
END;
$$;
