-- Migration: 20250821000035_refactor_check_user_availability_simplified.sql
-- Description: Simplifies and refactors the check_user_availability function.

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
    v_appointment_end_time TIME WITHOUT TIME ZONE := p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL;
BEGIN
    RETURN QUERY
    SELECT
        tu.user_id,
        COALESCE(suc.commission_rate, 0.00) AS commission_rate, -- Default to 0.00 if no commission found
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
        AND EXISTS (
            SELECT 1
            FROM public.user_schedules us
            WHERE us.user_id = tu.user_id
              AND us.day_of_week = v_day_of_week
              AND us.is_active = TRUE
              AND us.tenant_id = p_tenant_id
              AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
              AND p_appointment_time >= us.start_time
              AND v_appointment_end_time <= us.end_time
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.user_time_off uto
            WHERE uto.user_id = tu.user_id
              AND uto.status = 'approved'
              AND uto.tenant_id = p_tenant_id
              AND uto.branch_id = p_branch_id
              AND (
                  (NOT uto.is_partial_day AND p_appointment_date BETWEEN uto.start_date::date AND uto.end_date::date)
                  OR
                  (uto.is_partial_day AND p_appointment_date = uto.start_date::date AND
                   (p_appointment_time, v_appointment_end_time) OVERLAPS (uto.start_date::time, uto.end_date::time))
              )
        );
END;
$$;
