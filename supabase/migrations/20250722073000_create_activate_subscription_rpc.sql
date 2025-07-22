-- Migración para crear la función RPC 'activate_subscription'.
-- Esta función se encarga de la lógica de negocio para activar o renovar una suscripción de tenant.

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
    v_duration_days INT;
    v_new_expiration_date TIMESTAMPTZ;
BEGIN
    -- 1. Obtener la información del plan a partir del precio
    SELECT
        sp.id,
        sp.duration_days
    INTO
        v_plan_id,
        v_duration_days
    FROM
        public.subscription_plans sp
    JOIN
        public.plan_prices pp ON sp.id = pp.plan_id
    WHERE
        pp.id = p_plan_price_id;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un plan para el plan_price_id: %', p_plan_price_id;
    END IF;

    -- 2. Calcular la nueva fecha de expiración
    -- Si la suscripción actual está vencida, se renueva desde hoy.
    -- Si no está vencida, se extiende desde su fecha de vencimiento actual.
    SELECT
        CASE
            WHEN current_subscription.expires_at IS NULL OR current_subscription.expires_at < NOW()
            THEN NOW() + (v_duration_days || ' days')::interval
            ELSE current_subscription.expires_at + (v_duration_days || ' days')::interval
        END
    INTO
        v_new_expiration_date
    FROM
        (SELECT expires_at FROM public.tenant_subscriptions WHERE tenant_id = p_tenant_id ORDER BY expires_at DESC LIMIT 1) AS current_subscription;
    
    -- Si no hay suscripción previa, se calcula desde hoy.
    IF v_new_expiration_date IS NULL THEN
        v_new_expiration_date := NOW() + (v_duration_days || ' days')::interval;
    END IF;

    -- 3. Actualizar o crear la suscripción del tenant
    INSERT INTO public.tenant_subscriptions (
        tenant_id,
        plan_id,
        plan_price_id,
        payment_id,
        status,
        starts_at,
        expires_at
    )
    VALUES (
        p_tenant_id,
        v_plan_id,
        p_plan_price_id,
        p_payment_id,
        'active',
        NOW(),
        v_new_expiration_date
    )
    ON CONFLICT (tenant_id) -- Asumiendo que un tenant solo puede tener una suscripción activa a la vez
    DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        plan_price_id = EXCLUDED.plan_price_id,
        payment_id = EXCLUDED.payment_id,
        status = 'active',
        starts_at = NOW(),
        expires_at = v_new_expiration_date,
        updated_at = NOW();

END;
$$;

COMMENT ON FUNCTION public.activate_subscription IS 'Activa o renueva la suscripción de un tenant, actualizando su estado y fecha de vencimiento.';
