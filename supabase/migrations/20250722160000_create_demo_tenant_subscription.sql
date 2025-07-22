-- Migración para CREAR una suscripción permanente para el tenant de demostración.

DO $$
DECLARE
    v_demo_tenant_id UUID := 'fe7ea7cc-1a50-4ced-9182-5b65641b9936';
    v_annual_plan_id UUID;
    v_existing_subscription_count INT;
BEGIN
    -- 1. Verificar si ya existe una suscripción para este tenant, por si acaso.
    SELECT count(*) INTO v_existing_subscription_count
    FROM public.tenant_subscriptions
    WHERE tenant_id = v_demo_tenant_id;

    IF v_existing_subscription_count > 0 THEN
        RAISE NOTICE 'El tenant de demostración ya tiene una suscripción. No se realizaron cambios.';
        RETURN;
    END IF;

    -- 2. Obtener el ID del plan anual.
    SELECT id INTO v_annual_plan_id FROM public.subscription_plans WHERE name = 'Anual' LIMIT 1;

    IF v_annual_plan_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el plan "Anual". La migración no puede continuar.';
    END IF;

    -- 3. Crear la nueva suscripción permanente.
    INSERT INTO public.tenant_subscriptions (
        tenant_id,
        subscription_plan_id,
        is_trial,
        start_date,
        end_date, -- NULL significa que no caduca
        is_active
    ) VALUES (
        v_demo_tenant_id,
        v_annual_plan_id,
        FALSE,
        now(),
        NULL,
        TRUE
    );

    -- 4. Actualizar el estado del tenant a 'active'.
    UPDATE public.tenants
    SET
        subscription_status = 'active'
    WHERE
        id = v_demo_tenant_id;

    RAISE NOTICE 'Se ha creado una suscripción anual permanente para el tenant de demostración.';

END $$;
