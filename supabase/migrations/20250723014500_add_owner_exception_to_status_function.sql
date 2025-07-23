CREATE OR REPLACE FUNCTION public.get_tenant_subscription_status(p_tenant_id UUID)
RETURNS TABLE(status TEXT, end_date TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_subscription RECORD;
    OWNER_TENANT_ID UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Caso especial para el tenant propietario del sistema
    IF p_tenant_id = OWNER_TENANT_ID THEN
        RETURN QUERY SELECT 'activo'::TEXT, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Lógica normal para los demás tenants
    -- Encontrar la suscripción con la fecha de finalización más reciente
    SELECT * INTO v_last_subscription
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY end_date DESC
    LIMIT 1;

    -- Si no se encuentra ninguna suscripción, devolver cancelado
    IF v_last_subscription IS NULL THEN
        RETURN QUERY SELECT 'cancelado'::TEXT, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Devolver el estado calculado y la fecha de finalización
    RETURN QUERY
    SELECT
        CASE
            WHEN NOW() >= v_last_subscription.start_date AND NOW() <= v_last_subscription.end_date THEN 'activo'::TEXT
            WHEN NOW() > v_last_subscription.end_date AND NOW() <= (v_last_subscription.end_date + '3 days'::interval) THEN 'gracia'::TEXT
            WHEN NOW() > (v_last_subscription.end_date + '3 days'::interval) AND NOW() <= (v_last_subscription.end_date + '3 months'::interval) THEN 'suspendido'::TEXT
            ELSE 'cancelado'::TEXT
        END AS status,
        v_last_subscription.end_date;
END;
$$;
