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
    v_last_subscription RECORD;
    v_new_start_date TIMESTAMPTZ;
    v_new_end_date TIMESTAMPTZ;
BEGIN
    -- 1. Obtener datos del plan y del tenant
    SELECT subscription_plan_id INTO v_plan_id
    FROM public.plan_price_history
    WHERE id = p_plan_price_id;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un plan para el plan_price_id: %', p_plan_price_id;
    END IF;

    SELECT country_id INTO v_tenant_country_id
    FROM public.tenants
    WHERE id = p_tenant_id;

    IF v_tenant_country_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo encontrar el país para el tenant: %', p_tenant_id;
    END IF;

    -- 2. Obtener la frecuencia de facturación
    SELECT gcp.billing_frequency_months INTO v_billing_frequency_months
    FROM public.get_calculated_plan_prices() gcp
    WHERE gcp.plan_id = v_plan_id AND gcp.country_id = v_tenant_country_id
    LIMIT 1;

    IF v_billing_frequency_months IS NULL THEN
        RAISE EXCEPTION 'No se pudo determinar la frecuencia de facturación para el plan % en el país %', v_plan_id, v_tenant_country_id;
    END IF;

    -- 3. Buscar la última suscripción para asegurar la continuidad
    SELECT * INTO v_last_subscription
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY end_date DESC
    LIMIT 1;

    -- 4. Calcular el nuevo periodo de suscripción de forma continua
    v_new_start_date := v_last_subscription.end_date;
    v_new_end_date := v_new_start_date + (v_billing_frequency_months || ' months')::interval;

    -- 5. Insertar el nuevo registro de suscripción (sin is_active)
    INSERT INTO public.tenant_subscriptions (
        tenant_id,
        subscription_plan_id,
        start_date,
        end_date,
        is_trial
    )
    VALUES (
        p_tenant_id,
        v_plan_id,
        v_new_start_date,
        v_new_end_date,
        FALSE
    );

END;
$$;
