-- Migración para actualizar la función activate_subscription
-- Ahora registrará las sucursales extra en la tabla subscription_items al momento de la activación.

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
    v_new_subscription_id UUID;
    v_extra_branch_price NUMERIC;
    v_branch_record RECORD;
    v_branch_count INT;
BEGIN
    -- 1. Obtener datos del plan y del tenant
    SELECT subscription_plan_id INTO v_plan_id
    FROM public.plan_price_history
    WHERE id = p_plan_price_id;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un plan para el plan_price_id: %', p_plan_price_id;
    END IF;

    -- 2. Calcular el nuevo periodo de suscripción
    SELECT * INTO v_last_subscription
    FROM public.tenant_subscriptions
    WHERE tenant_id = p_tenant_id
    ORDER BY end_date DESC
    LIMIT 1;

    v_new_start_date := v_last_subscription.end_date;
    
    SELECT gcp.billing_frequency_months INTO v_billing_frequency_months
    FROM public.get_calculated_plan_prices() gcp
    WHERE gcp.plan_id = v_plan_id
    LIMIT 1;

    v_new_end_date := v_new_start_date + (v_billing_frequency_months || ' months')::interval;

    -- 3. Insertar el nuevo registro de suscripción y obtener su ID
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
    )
    RETURNING id INTO v_new_subscription_id;

    -- 4. Registrar las sucursales extra como items de la nueva suscripción
    -- Obtener el precio de la sucursal extra para el plan actual
    SELECT gcp.extra_branch_price INTO v_extra_branch_price
    FROM public.get_calculated_plan_prices() gcp
    WHERE gcp.plan_id = v_plan_id
    LIMIT 1;

    -- Contar las sucursales existentes
    SELECT count(*) INTO v_branch_count
    FROM public.branches
    WHERE tenant_id = p_tenant_id;

    -- Si hay más de una sucursal (la primera es gratis), registrar las demás
    IF v_branch_count > 1 THEN
        FOR v_branch_record IN
            SELECT id FROM public.branches
            WHERE tenant_id = p_tenant_id
            ORDER BY created_at ASC
            OFFSET 1 -- Omitir la primera sucursal que es la gratuita
        LOOP
            INSERT INTO public.subscription_items (
                subscription_id,
                item_type,
                item_id,
                quantity,
                unit_price_at_addition
            )
            VALUES (
                v_new_subscription_id,
                'extra_branch',
                v_branch_record.id,
                1,
                v_extra_branch_price
            );
        END LOOP;
    END IF;

END;
$$;
