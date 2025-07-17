-- Migración para implementar un sistema de precios versionado

-- 1. Crear la nueva tabla para el historial de precios
CREATE TABLE IF NOT EXISTS public.plan_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    base_price_cop NUMERIC(12, 2) NOT NULL,
    extra_branch_price_cop NUMERIC(12, 2) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (subscription_plan_id, effective_date)
);
CREATE INDEX IF NOT EXISTS idx_plan_price_history_plan_id_effective_date ON public.plan_price_history(subscription_plan_id, effective_date DESC);

-- 2. Mover los precios actuales de la tabla de planes al nuevo historial de precios.
-- Se asume que los precios existentes son efectivos desde hoy.
INSERT INTO public.plan_price_history (subscription_plan_id, base_price_cop, extra_branch_price_cop, effective_date)
SELECT id, base_price_cop, extra_branch_price_cop, CURRENT_DATE
FROM public.subscription_plans
ON CONFLICT (subscription_plan_id, effective_date) DO NOTHING;

-- 3. Eliminar las columnas de precios de la tabla de planes, ya que ahora están en el historial.
ALTER TABLE public.subscription_plans
DROP COLUMN IF EXISTS base_price_cop,
DROP COLUMN IF EXISTS extra_branch_price_cop;
