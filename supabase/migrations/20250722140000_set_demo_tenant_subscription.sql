-- Migración para convertir la suscripción de prueba del tenant de demostración
-- en una suscripción activa y sin fecha de caducidad.

DO $$
DECLARE
    v_demo_tenant_id UUID := 'fe7ea7cc-1a50-4ced-9182-5b65641b9936';
    v_annual_plan_id UUID;
    v_trial_subscription_id UUID;
BEGIN
    -- 1. Obtener el ID del plan anual
    SELECT id INTO v_annual_plan_id FROM public.subscription_plans WHERE name = 'Anual' LIMIT 1;

    -- Si no se encuentra el plan, no hacer nada.
    IF v_annual_plan_id IS NULL THEN
        RAISE NOTICE 'No se encontró el plan anual. No se realizaron cambios.';
        RETURN;
    END IF;

    -- 2. Encontrar la suscripción de prueba actual del tenant
    SELECT id INTO v_trial_subscription_id
    FROM public.tenant_subscriptions
    WHERE tenant_id = v_demo_tenant_id AND is_trial = TRUE
    LIMIT 1;

    -- 3. Actualizar la suscripción
    IF v_trial_subscription_id IS NOT NULL THEN
        UPDATE public.tenant_subscriptions
        SET
            is_trial = FALSE,
            subscription_plan_id = v_annual_plan_id,
            end_date = NULL, -- NULL significa que no caduca
            is_active = TRUE,
            updated_at = now()
        WHERE
            id = v_trial_subscription_id;

        -- 4. Actualizar el estado del tenant a 'active'
        UPDATE public.tenants
        SET
            subscription_status = 'active'
        WHERE
            id = v_demo_tenant_id;

        RAISE NOTICE 'La suscripción del tenant de demostración ha sido actualizada a un plan anual sin caducidad.';
    ELSE
        RAISE NOTICE 'No se encontró una suscripción de prueba para el tenant de demostración. No se realizaron cambios.';
    END IF;
END $$;
