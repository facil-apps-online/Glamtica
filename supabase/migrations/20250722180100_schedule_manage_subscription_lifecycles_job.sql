-- Migración para programar la ejecución diaria de la función de gestión de suscripciones.

-- Asegurarse de que la extensión pg_cron esté habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar la tarea usando la función cron.schedule, que es la forma segura y correcta.
-- Verificamos primero si el trabajo ya existe para evitar duplicados.
DO $MIGRATION$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE command = 'SELECT public.manage_subscription_lifecycles()') THEN
        -- Usamos cron.schedule() para crear el trabajo de forma segura.
        PERFORM cron.schedule(
            'manage-subscription-lifecycles', -- Le damos un nombre único al trabajo
            '0 3 * * *',                      -- Se ejecuta todos los días a las 3:00 AM UTC
            'SELECT public.manage_subscription_lifecycles()'
        );
    END IF;
END$MIGRATION$;
