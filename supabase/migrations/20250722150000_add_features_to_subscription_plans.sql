-- Migración para añadir la columna 'features' a la tabla de planes de suscripción.

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.subscription_plans.features
IS 'Lista de características o puntos clave del plan de suscripción para mostrar en la interfaz de precios.';

-- Opcional: Poblar la columna con algunos valores por defecto para los planes existentes.
UPDATE public.subscription_plans
SET features = ARRAY[
    'Acceso a todas las funciones',
    'Soporte por email',
    'Sin contratos de permanencia'
]
WHERE name IN ('Mensual', 'Semestral', 'Anual') AND (features IS NULL OR array_length(features, 1) IS NULL);
