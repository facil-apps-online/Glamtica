-- Migración para implementar el sistema de Período de Gracia.

-- Paso 1: Añadir la columna para los días de gracia a los planes de suscripción.
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS grace_period_days INT NOT NULL DEFAULT 7;

COMMENT ON COLUMN public.subscription_plans.grace_period_days IS 'Días de gracia después de la fecha de vencimiento durante los cuales el servicio sigue activo.';

-- Paso 2: Añadir la columna para los días de gracia del período de prueba a la configuración global.
ALTER TABLE public.global_settings
ADD COLUMN IF NOT EXISTS trial_grace_period_days INT NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.global_settings.trial_grace_period_days IS 'Días de gracia después de que finaliza un período de prueba.';

-- Paso 3: Añadir el nuevo estado 'grace_period' al tipo de estado de suscripción.
-- Hacemos esto en un bloque DO para evitar errores si el valor ya existe.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'grace_period' AND enumtypid = 'tenant_subscription_status'::regtype) THEN
        ALTER TYPE tenant_subscription_status ADD VALUE 'grace_period';
    END IF;
END$$;
