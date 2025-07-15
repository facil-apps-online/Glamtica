-- Migración para crear la tabla country_subscription_prices
-- Esta tabla almacenará los precios específicos de cada plan de suscripción para cada país.

CREATE TABLE IF NOT EXISTS public.country_subscription_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Asegurarse de que solo haya un precio por plan y país
    UNIQUE (country_id, subscription_plan_id)
);

-- Añadir un índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_country_subscription_prices_country_plan ON public.country_subscription_prices(country_id, subscription_plan_id);
