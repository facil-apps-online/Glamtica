-- Añadir la columna is_trial a la tabla de suscripciones de tenants
-- para poder diferenciar las suscripciones de prueba de las de pago.

ALTER TABLE public.tenant_subscriptions
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.tenant_subscriptions.is_trial IS 'Indica si la suscripción es un período de prueba.';
