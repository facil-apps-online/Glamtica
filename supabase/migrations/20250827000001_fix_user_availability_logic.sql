-- Migration: Fix user availability logic to be consistent with UTC comparisons and TSRANGE casting

-- Step 1: Drop the existing is_time_in_schedule function
DROP FUNCTION IF EXISTS public.is_time_in_schedule(TIMESTAMPTZ, INTEGER, TIME, TIME, TEXT);

-- Step 2: Recreate the is_time_in_schedule function to work with UTC and correct casting
CREATE OR REPLACE FUNCTION public.is_time_in_schedule(
    p_appointment_utc TIMESTAMPTZ,
    p_duration_minutes INTEGER,
    p_schedule_start_time TIME,
    p_schedule_end_time TIME,
    p_tenant_timezone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_appointment_range TSRANGE;
    v_schedule_range_utc TSRANGE;
    v_appointment_date DATE;
    v_schedule_local_start TIMESTAMP;
    v_schedule_local_end TIMESTAMP;
    v_schedule_utc_start TIMESTAMPTZ;
    v_schedule_utc_end TIMESTAMPTZ;
BEGIN
    -- 1. Define the appointment range, casting TIMESTAMPTZ to TIMESTAMP
    v_appointment_range := TSRANGE(
        p_appointment_utc::TIMESTAMP,
        (p_appointment_utc + (p_duration_minutes || ' minutes')::INTERVAL)::TIMESTAMP,
        '[)' -- Inclusive start, exclusive end
    );

    -- 2. Determine the local date of the appointment in the tenant's timezone
    v_appointment_date := (p_appointment_utc AT TIME ZONE p_tenant_timezone)::DATE;

    -- 3. Construct the schedule's start and end as local timestamps
    v_schedule_local_start := v_appointment_date + p_schedule_start_time;
    v_schedule_local_end := v_appointment_date + p_schedule_end_time;

    -- 4. Convert the local schedule timestamps to UTC
    v_schedule_utc_start := v_schedule_local_start AT TIME ZONE p_tenant_timezone;
    v_schedule_utc_end := v_schedule_local_end AT TIME ZONE p_tenant_timezone;

    -- 5. Define the schedule range in UTC, casting TIMESTAMPTZ to TIMESTAMP
    v_schedule_range_utc := TSRANGE(
        v_schedule_utc_start::TIMESTAMP,
        v_schedule_utc_end::TIMESTAMP,
        '[)' -- Inclusive start, exclusive end
    );

    -- 6. Check if the appointment range is contained within the schedule UTC range
    RETURN v_appointment_range <@ v_schedule_range_utc;
END;
$$;

-- Step 3: Update the check_user_availability function to ensure consistency with casting
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
    v_appointment_range TSRANGE;
BEGIN
    -- 1. Get tenant timezone
    SELECT default_timezone INTO v_tenant_timezone FROM public.tenants WHERE id = p_tenant_id;
    IF v_tenant_timezone IS NULL THEN
        v_tenant_timezone := 'UTC';
    END IF;

    -- 2. Calculate end time and range, casting to TIMESTAMP for TSRANGE
    v_appointment_end_utc := p_appointment_datetime + (p_duration_minutes || ' minutes')::INTERVAL;
    v_appointment_range := TSRANGE(p_appointment_datetime::TIMESTAMP, v_appointment_end_utc::TIMESTAMP, '[)'); -- Use exclusive end

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
                      AND TSRANGE((a.attention_datetime)::TIMESTAMP, (a.attention_datetime + (aserv.duration_minutes || ' minutes')::interval)::TIMESTAMP, '[)') && v_appointment_range
                )
                -- Check for time off
                AND NOT EXISTS (
                    SELECT 1
                    FROM public.user_time_off uto
                    WHERE uto.user_id = tu.user_id
                      AND uto.status = 'approved'
                      AND uto.tenant_id = p_tenant_id
                      AND (uto.branch_id IS NULL OR uto.branch_id = p_branch_id)
                      AND p_appointment_datetime::date BETWEEN uto.start_date AND uto.end_date
                      AND (
                          NOT uto.is_partial_day OR
                          (uto.is_partial_day AND v_appointment_range && TSRANGE(
                              ((uto.start_date + uto.start_time) AT TIME ZONE v_tenant_timezone)::TIMESTAMP,
                              ((uto.end_date + uto.end_time) AT TIME ZONE v_tenant_timezone)::TIMESTAMP,
                              '[)'
                          ))
                      )
                )
            )
            OR (tu.user_id = p_assigned_user_id AND p_assigned_user_id IS NOT NULL) -- Always include the currently assigned user
        );
END;
$$;