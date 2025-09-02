-- Migration: 20250821000039_fix_check_user_availability_timezone_logic_v3.sql
-- Description: Corrects the timezone conversion for user schedules in check_user_availability by properly extracting TIME from TIMESTAMPTZ.

DROP FUNCTION IF EXISTS public.check_user_availability(uuid, text, uuid, uuid, date, time without time zone, integer);

CREATE OR REPLACE FUNCTION public.check_user_availability(
    p_item_id UUID,
    p_item_type TEXT, -- 'service' or 'combo'
    p_branch_id UUID,
    p_tenant_id UUID,
    p_appointment_date DATE,
    p_appointment_time TIME WITHOUT TIME ZONE,
    p_duration_minutes INTEGER
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
BEGIN
    -- 1. Obtener la zona horaria del tenant
    SELECT default_timezone INTO v_tenant_timezone FROM public.tenants WHERE id = p_tenant_id;

    -- Si no se encuentra la zona horaria del tenant, usar 'UTC' como fallback
    IF v_tenant_timezone IS NULL THEN
        v_tenant_timezone := 'UTC';
    END IF;

    -- 2. Convertir la hora de la cita (asumida en zona horaria del tenant) a UTC
    v_appointment_start_utc := (p_appointment_date::TEXT || ' ' || p_appointment_time::TEXT)::TIMESTAMP AT TIME ZONE v_tenant_timezone AT TIME ZONE 'UTC';
    v_appointment_end_utc := v_appointment_start_utc + (p_duration_minutes || ' minutes')::INTERVAL;

    RETURN QUERY
    SELECT
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
    LEFT JOIN auth.users au ON au.id = tu.user_id -- Unir con auth.users para obtener user_metadata
    WHERE
        tu.branch_id = p_branch_id
        AND tu.status = 'active' 
        AND EXISTS (
            SELECT 1
            FROM public.user_schedules us
            WHERE us.user_id = tu.user_id
              AND us.day_of_week = v_day_of_week
              AND us.is_active = TRUE
              AND us.tenant_id = p_tenant_id
              AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
              -- Convertir el horario del usuario a UTC para comparación
              AND v_appointment_start_utc::TIME >= ( (p_appointment_date::TEXT || ' ' || us.start_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE(au.raw_user_meta_data->>'timezone', v_tenant_timezone) AT TIME ZONE 'UTC' )::TIME
              AND v_appointment_end_utc::TIME <= ( (p_appointment_date::TEXT || ' ' || us.end_time::TEXT)::TIMESTAMP AT TIME ZONE COALESCE(au.raw_user_meta_data->>'timezone', v_tenant_timezone) AT TIME ZONE 'UTC' )::TIME
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.user_time_off uto
            WHERE uto.user_id = tu.user_id
              AND uto.status = 'approved'
              AND uto.tenant_id = p_tenant_id
              AND uto.branch_id = p_branch_id
              AND (
                  -- Comparar directamente los TIMESTAMPTZ (uto.start_date/end_date ya son TIMESTAMPTZ)
                  (NOT uto.is_partial_day AND v_appointment_start_utc::DATE BETWEEN uto.start_date::DATE AND uto.end_date::DATE)
                  OR
                  (uto.is_partial_day AND v_appointment_start_utc::DATE = uto.start_date::DATE AND
                   TSRANGE(v_appointment_start_utc, v_appointment_end_utc, '[)') && TSRANGE(uto.start_date, uto.end_date, '[)'))
              )
        );
END;
$$;