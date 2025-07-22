-- Migración para crear la función que gestiona el ciclo de vida de las suscripciones.

CREATE OR REPLACE FUNCTION public.manage_subscription_lifecycles()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    sub RECORD;
    grace_days INT;
BEGIN
    -- Iterar sobre todas las suscripciones activas cuya fecha de finalización ha pasado.
    FOR sub IN
        SELECT
            ts.id AS subscription_id,
            ts.tenant_id,
            ts.is_trial,
            ts.end_date,
            sp.grace_period_days AS plan_grace_days
        FROM
            public.tenant_subscriptions ts
        LEFT JOIN
            public.subscription_plans sp ON ts.subscription_plan_id = sp.id
        WHERE
            ts.is_active = TRUE AND ts.end_date < now()
    LOOP
        -- Determinar el período de gracia aplicable.
        IF sub.is_trial THEN
            SELECT gs.trial_grace_period_days INTO grace_days FROM public.global_settings gs LIMIT 1;
            grace_days := COALESCE(grace_days, 3); -- Fallback por si no está configurado.
        ELSE
            grace_days := COALESCE(sub.plan_grace_days, 7); -- Fallback por si el plan no tiene días de gracia.
        END IF;

        -- Comprobar si estamos dentro del período de gracia.
        IF now() <= sub.end_date + (grace_days || ' days')::interval THEN
            -- Aún en período de gracia.
            UPDATE public.tenants
            SET subscription_status = 'grace_period'
            WHERE id = sub.tenant_id AND subscription_status != 'grace_period';

            RAISE NOTICE 'Tenant % entra en período de gracia.', sub.tenant_id;
        ELSE
            -- El período de gracia ha terminado.
            IF sub.is_trial THEN
                -- Finalizar el trial.
                UPDATE public.tenants
                SET subscription_status = 'trial_ended'
                WHERE id = sub.tenant_id;

                RAISE NOTICE 'El período de prueba para el tenant % ha finalizado completamente.', sub.tenant_id;
            ELSE
                -- Desactivar por falta de pago.
                UPDATE public.tenants
                SET subscription_status = 'inactive'
                WHERE id = sub.tenant_id;

                RAISE NOTICE 'La suscripción del tenant % ha sido desactivada por falta de pago.', sub.tenant_id;
            END IF;

            -- Marcar la suscripción como inactiva en ambos casos.
            UPDATE public.tenant_subscriptions
            SET is_active = FALSE
            WHERE id = sub.subscription_id;
        END IF;
    END LOOP;
END;
$$;
