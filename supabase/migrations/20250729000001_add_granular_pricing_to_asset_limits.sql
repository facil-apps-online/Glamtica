-- MIGRATION: Añade precios granulares y bonificaciones a los límites de activos del plan.
--
-- OBJETIVO:
-- Permitir la configuración de precios específicos para unidades adicionales y excedentes
-- de un activo dentro de un plan de suscripción, así como definir bonificaciones.
--
-- CAMBIOS:
-- - `extra_unit_price`: Precio por comprar una unidad extra de un activo (ej. una sucursal más).
-- - `overage_unit_price`: Precio por unidad consumida por encima del límite (ej. por factura extra).
-- - `bonus_on_extra`: Regla JSON para bonificar otros activos al comprar una unidad extra.

ALTER TABLE public.plan_asset_limits
ADD COLUMN extra_unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN overage_unit_price DECIMAL(10, 4) NOT NULL DEFAULT 0,
ADD COLUMN bonus_on_extra JSONB;

COMMENT ON COLUMN public.plan_asset_limits.extra_unit_price IS 'Precio por cada unidad adicional de este activo comprada por el tenant.';
COMMENT ON COLUMN public.plan_asset_limits.overage_unit_price IS 'Precio por cada unidad de este activo consumida por encima del límite total.';
COMMENT ON COLUMN public.plan_asset_limits.bonus_on_extra IS 'Regla JSON para bonificar otros activos al comprar una unidad extra. Ejemplo: {"asset_key": "invoices", "quantity": 500}';
