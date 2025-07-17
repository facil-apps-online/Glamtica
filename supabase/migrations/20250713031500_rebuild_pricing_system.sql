-- Migración Definitiva para el Sistema de Precios por Frecuencia
-- Reestructura la tabla de planes, crea la caché de tasas de cambio e inserta los planes base.

-- 1. Eliminar la tabla de precios por país si existe, ya que no se usará.
DROP TABLE IF EXISTS public.country_subscription_prices;

-- 2. Reestructurar la tabla `subscription_plans` para el nuevo modelo de negocio.
-- Se eliminan las columnas de precio antiguas y se añaden las nuevas basadas en COP.
ALTER TABLE public.subscription_plans
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS currency_id,
DROP COLUMN IF EXISTS duration_months,
DROP COLUMN IF EXISTS max_users,
DROP COLUMN IF EXISTS max_branches,
DROP COLUMN IF EXISTS features,
ADD COLUMN IF NOT EXISTS billing_frequency_months INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS base_price_cop NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS extra_branch_price_cop NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- 3. Crear la tabla para la caché de tasas de cambio.
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency_code TEXT NOT NULL,
    target_currency_code TEXT NOT NULL,
    rate NUMERIC(12, 6) NOT NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (base_currency_code, target_currency_code)
);

-- 4. Añadir la columna de control a la tabla de países.
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS uses_auto_pricing BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Insertar los 3 planes de suscripción base si no existen.
INSERT INTO public.subscription_plans (name, description, is_active, billing_frequency_months)
SELECT 'Mensual', 'Plan con facturación mensual.', TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Mensual');

INSERT INTO public.subscription_plans (name, description, is_active, billing_frequency_months)
SELECT 'Semestral', 'Plan con facturación semestral (6 meses).', TRUE, 6
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Semestral');

INSERT INTO public.subscription_plans (name, description, is_active, billing_frequency_months)
SELECT 'Anual', 'Plan con facturación anual (12 meses).', TRUE, 12
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Anual');

-- 6. Habilitar el cálculo automático para los países existentes, excepto Colombia.
UPDATE public.countries
SET uses_auto_pricing = TRUE
WHERE iso_code != 'CO';
