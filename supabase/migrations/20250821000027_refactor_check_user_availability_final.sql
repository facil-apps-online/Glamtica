-- Migration: 20250821000027_refactor_check_user_availability_final.sql
-- Description: Refactors the check_user_availability function based on provided table definitions,
-- removing the non-existent 'is_schedulable' filter and correcting time_off logic.

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
    is_active BOOLEAN -- is_schedulable removed
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
    WITH CapableUsers AS (
        SELECT
            tu.user_id,
            tu.first_name,
            tu.last_name,
            (tu.status = 'active') AS is_active,
            CASE
                WHEN p_item_type = 'service' THEN
                    (SELECT suc.commission_rate FROM public.service_user_commissions suc
                     WHERE suc.user_id = tu.user_id AND suc.service_id = p_item_id AND suc.branch_id = p_branch_id AND suc.tenant_id = p_tenant_id LIMIT 1)
                WHEN p_item_type = 'combo' THEN
                    (SELECT suc.commission_rate
                     FROM public.service_user_commissions suc
                     JOIN public.combo_items ci ON suc.service_id = ci.service_id
                     WHERE ci.combo_id = p_item_id AND suc.user_id = tu.user_id AND suc.branch_id = p_branch_id AND suc.tenant_id = p_tenant_id
                     ORDER BY ci.created_at ASC LIMIT 1)
                ELSE NULL
            END AS commission_rate
        FROM public.get_tenant_users(p_tenant_id) tu
        WHERE tu.branch_id = p_branch_id -- Filter by branch_id from get_tenant_users
          AND (tu.status = 'active') -- Only active users
          AND (
            (p_item_type = 'service' AND EXISTS (
                SELECT 1 FROM public.service_user_commissions suc
                WHERE suc.user_id = tu.user_id AND suc.service_id = p_item_id AND suc.branch_id = p_branch_id AND suc.tenant_id = p_tenant_id
            ))
            OR
            (p_item_type = 'combo' AND EXISTS (
                SELECT 1
                FROM public.combo_items ci
                JOIN public.service_user_commissions suc ON suc.service_id = ci.service_id
                WHERE ci.combo_id = p_item_id AND suc.user_id = tu.user_id AND suc.branch_id = p_branch_id AND suc.tenant_id = p_tenant_id
                  AND ci.service_id IS NOT NULL
                GROUP BY suc.user_id
                HAVING COUNT(DISTINCT ci.service_id) = (
                    SELECT COUNT(DISTINCT service_id)
                    FROM public.combo_items
                    WHERE combo_id = p_item_id AND service_id IS NOT NULL
                )
            ))
        )
    )
    SELECT
        cu.user_id,
        cu.commission_rate,
        cu.first_name,
        cu.last_name,
        cu.is_active
    FROM CapableUsers cu
    LEFT JOIN public.user_schedules us ON us.user_id = cu.user_id AND us.day_of_week = v_day_of_week AND us.is_active = TRUE AND us.tenant_id = p_tenant_id AND (us.branch_id IS NULL OR us.branch_id = p_branch_id)
    LEFT JOIN public.user_time_off uto ON uto.user_id = cu.user_id AND uto.status = 'approved' AND uto.tenant_id = p_tenant_id AND uto.branch_id = p_branch_id
        AND (
            -- Full day off
            (NOT uto.is_partial_day AND p_appointment_date BETWEEN uto.start_date::date AND uto.end_date::date)
            OR
            -- Partial day off (check time component)
            (uto.is_partial_day AND p_appointment_date = uto.start_date::date AND
             (p_appointment_time, v_appointment_end_time) OVERLAPS (uto.start_date::time, uto.end_date::time))
        )
    WHERE
        us.start_time IS NOT NULL AND us.end_time IS NOT NULL -- Must have a schedule for the day
        AND p_appointment_time >= us.start_time -- Appointment starts after or at schedule start
        AND v_appointment_end_time <= us.end_time -- Appointment ends before or at schedule end
        AND uto.user_id IS NULL; -- No overlapping approved time off
END;
$$;
