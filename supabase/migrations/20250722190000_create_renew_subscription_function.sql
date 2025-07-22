-- Migración para crear la función de renovación de suscripciones.
-- Esta función maneja la renovación retroactiva para que la nueva suscripción
-- comience justo cuando la anterior terminó.

CREATE OR REPLACE FUNCTION public.renew_subscription(
    p_tenant_id UUID,
    p_plan_id UUID
)
RETURNS UUID -- Devuelve el ID de la nueva suscripción
LANGUAGE plpgsql
AS $$
DECLARE
    previous_subscription RECORD;
    new_start_date TIMESTAMPTZ;
    new_end_date TIMESTAMPTZ;
    plan_duration_months INT;
    new_subscription_id UUID;
    generated_invoice_id UUID;
BEGIN
    -- 1. Encontrar la suscripción más reciente (activa o no) para este tenant.
    SELECT * INTO previous_subscription
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY end_date DESC NULLS LAST, created_at DESC
    LIMIT 1;

    -- 2. Determinar la fecha de inicio de la nueva suscripción.
    IF previous_subscription IS NOT NULL AND previous_subscription.end_date IS NOT NULL THEN
        -- Renovación: la nueva suscripción empieza donde terminó la anterior.
        new_start_date := previous_subscription.end_date;
    ELSE
        -- Primera suscripción después de un trial o si no hay registro previo.
        new_start_date := now();
    END IF;

    -- 3. Calcular la nueva fecha de finalización.
    SELECT billing_frequency_months INTO plan_duration_months
    FROM public.subscription_plans
    WHERE id = p_plan_id;

    IF plan_duration_months IS NULL THEN
        RAISE EXCEPTION 'No se pudo encontrar la duración para el plan ID %.', p_plan_id;
    END IF;

    new_end_date := new_start_date + (plan_duration_months || ' months')::interval;

    -- 4. Crear la nueva suscripción de pago.
    INSERT INTO public.tenant_subscriptions (
        tenant_id,
        subscription_plan_id,
        is_trial,
        start_date,
        end_date,
        is_active
    ) VALUES (
        p_tenant_id,
        p_plan_id,
        FALSE,
        new_start_date,
        new_end_date,
        TRUE
    ) RETURNING id INTO new_subscription_id;

    -- 5. Actualizar el estado del tenant a 'active'.
    UPDATE public.tenants
    SET subscription_status = 'active'
    WHERE id = p_tenant_id;

    -- 6. Generar la factura para la nueva suscripción.
    SELECT public.generate_invoice_for_subscription(new_subscription_id)
    INTO generated_invoice_id;

    RAISE NOTICE 'Suscripción renovada con ID: %. Factura generada con ID: %', new_subscription_id, generated_invoice_id;

    -- 7. Devolver el ID de la nueva suscripción.
    RETURN new_subscription_id;
END;
$$;
