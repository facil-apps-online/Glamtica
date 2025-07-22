-- Migración para añadir el estado 'grace_period' a la lista de estados de suscripción permitidos.

-- Paso 1: Eliminar la antigua CHECK constraint de la tabla tenants.
-- El nombre 'tenants_subscription_status_check' se infiere del mensaje de error.
ALTER TABLE public.tenants
DROP CONSTRAINT IF EXISTS tenants_subscription_status_check;

-- Paso 2: Volver a crear la constraint con la lista de valores actualizada.
-- Se añaden los estados conocidos más el nuevo 'grace_period'.
ALTER TABLE public.tenants
ADD CONSTRAINT tenants_subscription_status_check
CHECK (subscription_status = ANY (ARRAY[
    'trial'::text,
    'active'::text,
    'inactive'::text,
    'expired'::text,
    'canceled'::text,
    'grace_period'::text -- Nuevo estado permitido
]));

COMMENT ON CONSTRAINT tenants_subscription_status_check ON public.tenants 
IS 'Asegura que el estado de la suscripción sea uno de los valores predefinidos y válidos.';
