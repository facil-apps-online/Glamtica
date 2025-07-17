-- Migración para corregir la función get_superadmin_financial_stats
-- Se reescribe para obtener los precios desde la tabla de historial (plan_price_history)
-- en lugar de la tabla de planes, que ya no contiene esa información.

DROP FUNCTION IF EXISTS get_superadmin_financial_stats();

CREATE OR REPLACE FUNCTION get_superadmin_financial_stats()
RETURNS TABLE (
    mrr NUMERIC,
    arr NUMERIC,
    projected_revenue_next_7_days NUMERIC,
    projected_revenue_next_30_days NUMERIC,
    active_monthly_plans BIGINT,
    active_semestral_plans BIGINT,
    active_annual_plans BIGINT,
    new_tenants_last_30_days BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH current_prices AS (
        -- 1. Obtener el precio vigente más reciente para cada plan
        SELECT DISTINCT ON (subscription_plan_id)
            subscription_plan_id,
            base_price_cop,
            extra_branch_price_cop
        FROM public.plan_price_history
        WHERE effective_date <= CURRENT_DATE
        ORDER BY subscription_plan_id, effective_date DESC
    ),
    active_subs AS (
        -- 2. Obtener las suscripciones activas y unir con sus precios vigentes
        SELECT
            ts.tenant_id,
            cp.base_price_cop,
            cp.extra_branch_price_cop,
            sp.billing_frequency_months,
            ts.end_date,
            (SELECT COUNT(*) FROM public.branches b WHERE b.tenant_id = ts.tenant_id) as branch_count
        FROM public.tenant_subscriptions ts
        JOIN public.subscription_plans sp ON ts.subscription_plan_id = sp.id
        JOIN current_prices cp ON ts.subscription_plan_id = cp.subscription_plan_id
        WHERE ts.is_active = TRUE
    ),
    sub_costs AS (
        -- 3. Calcular el costo total y mensual por suscripción
        SELECT
            tenant_id,
            end_date,
            (COALESCE(base_price_cop, 0) + GREATEST(0, branch_count - 1) * COALESCE(extra_branch_price_cop, 0)) AS total_cost,
            (COALESCE(base_price_cop, 0) + GREATEST(0, branch_count - 1) * COALESCE(extra_branch_price_cop, 0)) / GREATEST(1, billing_frequency_months) AS monthly_cost
        FROM active_subs
    )
    -- 4. Calcular las métricas finales
    SELECT
        (SELECT COALESCE(SUM(monthly_cost), 0) FROM sub_costs) AS mrr,
        (SELECT COALESCE(SUM(monthly_cost), 0) * 12 FROM sub_costs) AS arr,
        (SELECT COALESCE(SUM(total_cost), 0) FROM sub_costs WHERE end_date BETWEEN now() AND now() + interval '7 days') AS projected_revenue_next_7_days,
        (SELECT COALESCE(SUM(total_cost), 0) FROM sub_costs WHERE end_date BETWEEN now() AND now() + interval '30 days') AS projected_revenue_next_30_days,
        (SELECT COUNT(*) FROM active_subs WHERE billing_frequency_months = 1) AS active_monthly_plans,
        (SELECT COUNT(*) FROM active_subs WHERE billing_frequency_months = 6) AS active_semestral_plans,
        (SELECT COUNT(*) FROM active_subs WHERE billing_frequency_months = 12) AS active_annual_plans,
        (SELECT COUNT(*) FROM public.tenants WHERE created_at >= now() - interval '30 days') AS new_tenants_last_30_days;
END;
$$;
