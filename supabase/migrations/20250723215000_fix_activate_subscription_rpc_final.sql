CREATE OR REPLACE FUNCTION public.activate_subscription(
    p_tenant_id UUID,
    p_plan_price_id UUID,
    p_payment_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_id UUID;
    v_tenant_country_id UUID;
    v_billing_frequency_months INT;
    v_current_subscription RECORD;
    v_new_end_date TIMESTAMPTZ;
BEGIN
    -- 1. Obtener el ID del plan de suscripción desde el ID del precio histórico
    SELECT subscription_plan_id INTO v_plan_id
    FROM public.plan_price_history
    WHERE id = p_plan_price_id;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un plan para el plan_price_id: %', p_plan_price_id;
    END IF;

    -- 2. Obtener el país del tenant para calcular el precio correcto
    SELECT country_id INTO v_tenant_country_id
    FROM public.tenants
    WHERE id = p_tenant_id;

    IF v_tenant_country_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo encontrar el país para el tenant: %', p_tenant_id;
    END IF;

    -- 3. Obtener la frecuencia de facturación usando la función de precios calculados
    SELECT gcp.billing_frequency_months INTO v_billing_frequency_months
    FROM public.get_calculated_plan_prices() gcp
    WHERE gcp.plan_id = v_plan_id AND gcp.country_id = v_tenant_country_id
    LIMIT 1;

    IF v_billing_frequency_months IS NULL THEN
        RAISE EXCEPTION 'No se pudo determinar la frecuencia de facturación para el plan % en el país %', v_plan_id, v_tenant_country_id;
    END IF;

    -- 4. Buscar la suscripción más reciente del tenant para ver si es una renovación
    SELECT * INTO v_current_subscription
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- 5. Calcular la nueva fecha de expiración
    IF v_current_subscription IS NOT NULL AND v_current_subscription.end_date > NOW() THEN
        -- Si la suscripción actual está activa, se extiende desde su fecha de vencimiento
        v_new_end_date := v_current_subscription.end_date + (v_billing_frequency_months || ' months')::interval;
    ELSE
        -- Si no hay suscripción o está vencida, se inicia desde hoy
        v_new_end_date := NOW() + (v_billing_frequency_months || ' months')::interval;
    END IF;

    -- 6. Insertar o actualizar la suscripción del tenant
    -- Esta lógica asume que solo puede haber una entrada de suscripción por tenant.
    -- Si un tenant puede tener múltiples registros de suscripción (historial),
    -- el ON CONFLICT debería ser más específico o la lógica debería ser un INSERT directo.
    INSERT INTO public.tenant_subscriptions (
        tenant_id,
        subscription_plan_id,
        plan_price_id,
        payment_id,
        is_active,
        start_date,
        end_date,
        is_trial
    )
    VALUES (
        p_tenant_id,
        v_plan_id,
        p_plan_price_id,
        p_payment_id,
        true,
        NOW(),
        v_new_end_date,
        FALSE -- Un pago real nunca es un trial
    )
    ON CONFLICT (tenant_id)
    DO UPDATE SET
        subscription_plan_id = EXCLUDED.subscription_plan_id,
        plan_price_id = EXCLUDED.plan_price_id,
        payment_id = EXCLUDED.payment_id,
        is_active = true,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        is_trial = FALSE,
        updated_at = NOW();

END;
$$;

COMMENT ON FUNCTION public.activate_subscription IS 'Activa o renueva la suscripción de un tenant, actualizando su estado y fecha de vencimiento, usando la lógica de precios calculados.';