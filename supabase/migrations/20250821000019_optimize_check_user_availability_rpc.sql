DROP FUNCTION IF EXISTS public.check_user_availability(uuid, date, time without time zone, integer);

-- MIGRACIÓN PARA OPTIMIZAR check_user_availability Y MANEJAR ZONAS HORARIAS (VERSIÓN FINAL CORREGIDA)
-- Esta función determina la disponibilidad de usuarios para un servicio o combo
-- en una sucursal y momento dados, evitando el problema N+1.
-- Asume que p_appointment_time ya está en la zona horaria correcta para la comparación con user_time_off.

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
    is_active BOOLEAN,
    is_schedulable BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_day_of_week INTEGER := EXTRACT(DOW FROM p_appointment_date);
    v_appointment_end_time TIME WITHOUT TIME ZONE := p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL;
BEGIN
    RETURN QUERY
    WITH CapableUsers AS (
        SELECT
            u.id AS user_id,
            u.raw_user_meta_data->>'first_name' AS first_name,
            u.raw_user_meta_data->>'last_name' AS last_name,
            (u.raw_user_meta_data->>'is_active')::BOOLEAN AS is_active,
            (u.raw_user_meta_data->>'is_schedulable')::BOOLEAN AS is_schedulable,
            -- Determinar la comisión
            CASE
                WHEN p_item_type = 'service' THEN (SELECT suc.commission_rate FROM service_user_commissions suc WHERE suc.user_id = u.id AND suc.service_id = p_item_id AND suc.branch_id = p_branch_id LIMIT 1)
                WHEN p_item_type = 'combo' THEN (
                    -- Para combos, tomamos la comisión del primer servicio del combo como representativa
                    SELECT suc.commission_rate
                    FROM service_user_commissions suc
                    JOIN combo_items ci ON suc.service_id = ci.service_id
                    WHERE ci.combo_id = p_item_id
                      AND suc.user_id = u.id
                      AND suc.branch_id = p_branch_id
                    ORDER BY ci.created_at ASC -- O algún otro criterio para el "primer" servicio
                    LIMIT 1
                )
                ELSE NULL
            END AS commission_rate
        FROM public.users u
        WHERE u.tenant_id = p_tenant_id -- Asegurarse de que el usuario pertenece al tenant
        AND (u.raw_user_meta_data->>'is_active')::BOOLEAN = TRUE
        AND (u.raw_user_meta_data->>'is_schedulable')::BOOLEAN = TRUE
        AND (
            -- Lógica para servicios
            (p_item_type = 'service' AND EXISTS (
                SELECT 1 FROM service_user_commissions suc
                WHERE suc.user_id = u.id
                  AND suc.service_id = p_item_id
                  AND suc.branch_id = p_branch_id
            ))
            OR
            -- Lógica para combos (reescrita)
            (p_item_type = 'combo' AND EXISTS (
                SELECT 1
                FROM combo_items ci
                JOIN service_user_commissions suc ON suc.service_id = ci.service_id
                    AND suc.user_id = u.id
                    AND suc.branch_id = p_branch_id
                WHERE ci.combo_id = p_item_id
                  AND ci.service_id IS NOT NULL -- Solo consideramos los items de servicio del combo
                GROUP BY suc.user_id
                HAVING COUNT(DISTINCT ci.service_id) = (
                    SELECT COUNT(DISTINCT service_id)
                    FROM combo_items
                    WHERE combo_id = p_item_id AND service_id IS NOT NULL
                )
            ))
        )
    )
    -- Ahora, unimos con la lógica de disponibilidad (horario y ausencias)
    SELECT
        cu.user_id,
        cu.commission_rate,
        cu.first_name,
        cu.last_name,
        cu.is_active,
        cu.is_schedulable
    FROM CapableUsers cu
    LEFT JOIN user_schedules us ON us.user_id = cu.user_id AND us.day_of_week = v_day_of_week AND us.is_active = TRUE
    LEFT JOIN user_time_off uto ON uto.user_id = cu.user_id AND uto.status = 'approved'
        AND p_appointment_date BETWEEN uto.start_date AND uto.end_date
        AND (
            (uto.start_time IS NULL AND uto.end_time IS NULL) OR
            -- Usar las horas de la cita directamente, asumiendo que ya están en la zona horaria correcta
            (p_appointment_time, v_appointment_end_time) OVERLAPS (uto.start_time, uto.end_time)
        )
    WHERE
        us.start_time IS NOT NULL AND us.end_time IS NOT NULL -- Debe tener un horario definido para el día
        AND p_appointment_time >= us.start_time -- Horario local vs horario local
        AND v_appointment_end_time <= us.end_time -- Horario local vs horario local
        AND uto.user_id IS NULL; -- No debe tener ausencias que se solapen
END;
$$;