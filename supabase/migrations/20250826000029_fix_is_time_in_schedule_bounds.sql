-- Migration: Fix is_time_in_schedule bounds to use exclusive end

-- Step 1: Drop the old function
DROP FUNCTION IF EXISTS public.is_time_in_schedule(timestamptz, integer, time, time, text);

-- Step 2: Create the new function with corrected TSRANGE bounds
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
    v_appointment_local_start TIMESTAMP;
    v_appointment_local_end TIMESTAMP;
    v_schedule_local_start TIMESTAMP;
    v_schedule_local_end TIMESTAMP;
    v_appointment_date DATE;
BEGIN
    -- Convert appointment UTC time to tenant's local time
    v_appointment_local_start := p_appointment_utc AT TIME ZONE p_tenant_timezone;
    v_appointment_local_end := (p_appointment_utc + (p_duration_minutes || ' minutes')::interval) AT TIME ZONE p_tenant_timezone;
    v_appointment_date := v_appointment_local_start::date;

    -- Create full timestamp for schedule start and end on the appointment date
    v_schedule_local_start := v_appointment_date + p_schedule_start_time;
    v_schedule_local_end := v_appointment_date + p_schedule_end_time;

    -- Check if the appointment range is fully contained within the schedule range
    -- Using '[)' for ranges (inclusive start, exclusive end) is common for time intervals
    RETURN TSRANGE(v_appointment_local_start, v_appointment_local_end, '[)') <@ TSRANGE(v_schedule_local_start, v_schedule_local_end, '[)');
END;
$$;
