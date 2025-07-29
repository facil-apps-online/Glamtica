-- MIGRATION: Implementa un sistema de Tarifas Versionadas para precios.
--
-- OBJETIVO:
-- Reemplazar el sistema de historial de precios simple por uno robusto que permita
-- versionar no solo el precio base del plan, sino también los precios granulares de cada activo.
--
-- FASES:
-- 1. Crear la tabla `price_tariffs` para definir una "versión de tarifa" con su fecha de efectividad.
-- 2. Crear la tabla `tariff_asset_prices` para almacenar los precios de cada activo para cada tarifa.
-- 3. Migrar los datos existentes de `plan_price_history` a la nueva estructura (comentado por defecto).
-- 4. Eliminar la tabla obsoleta `plan_price_history`.

-- FASE 1: Crear la tabla de Tarifas
CREATE TABLE public.price_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    effective_date TIMESTAMPTZ NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency_id UUID NOT NULL REFERENCES public.currencies(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_effective_date_for_plan UNIQUE (subscription_plan_id, effective_date)
);
COMMENT ON TABLE public.price_tariffs IS 'Define una versión de tarifa para un plan, incluyendo el precio base y su fecha de efectividad.';
CREATE INDEX idx_price_tariffs_plan_id_effective_date ON public.price_tariffs(subscription_plan_id, effective_date DESC);

-- FASE 2: Crear la tabla de precios de activos por tarifa
CREATE TABLE public.tariff_asset_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tariff_id UUID NOT NULL REFERENCES public.price_tariffs(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.plan_assets(id) ON DELETE CASCADE,
    extra_unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    overage_unit_price DECIMAL(10, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_asset_for_tariff UNIQUE (tariff_id, asset_id)
);
COMMENT ON TABLE public.tariff_asset_prices IS 'Almacena los precios específicos de un activo para una tarifa versionada.';
CREATE INDEX idx_tariff_asset_prices_tariff_id ON public.tariff_asset_prices(tariff_id);

-- FASE 3: (Opcional) Migrar datos de la tabla antigua.
-- Este bloque debe ser revisado y ejecutado manualmente si es necesario.
/*
DO $$
DECLARE
    old_price RECORD;
    new_tariff_id UUID;
    v_default_currency_id UUID := 'a4e9a28a-9621-4073-a6a0-1565b88999f8'; -- Reemplazar con el ID de moneda correcto (COP)
BEGIN
    FOR old_price IN SELECT * FROM public.plan_price_history LOOP
        -- Crear una nueva tarifa para cada precio antiguo
        INSERT INTO public.price_tariffs (subscription_plan_id, effective_date, base_price, currency_id)
        VALUES (old_price.subscription_plan_id, old_price.effective_date, old_price.base_price_cop, v_default_currency_id)
        RETURNING id INTO new_tariff_id;

        -- Aquí se necesitaría lógica adicional para migrar los precios de los activos si existieran en otro lugar.
        -- Por ahora, esta migración solo cubre el precio base.
    END LOOP;
END $$;
*/

-- FASE 4: Eliminar la tabla obsoleta
DROP TABLE IF EXISTS public.plan_price_history;

-- Otorgar permisos a los roles relevantes
ALTER TABLE public.price_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariff_asset_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to super_admin on price_tariffs"
ON public.price_tariffs
FOR ALL
USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'))
WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'));

CREATE POLICY "Allow full access to super_admin on tariff_asset_prices"
ON public.tariff_asset_prices
FOR ALL
USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'))
WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'));
