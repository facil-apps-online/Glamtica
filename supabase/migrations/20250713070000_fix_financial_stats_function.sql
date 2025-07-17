-- Migración para hacer más robusta la función get_superadmin_financial_stats
-- Se simplifica el cálculo de renovaciones y se añaden verificaciones para evitar errores con valores nulos.

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
    WITH active_subs AS (
        SELECT
            ts.tenant_id,
            sp.base_price_cop,
            sp.extra_branch_price_cop,
            sp.billing_frequency_months,
            ts.end_date,
            (SELECT COUNT(*) FROM public.branches b WHERE b.tenant_id = ts.tenant_id) as branch_count
        FROM public.tenant_subscriptions ts
        JOIN public.subscription_plans sp ON ts.subscription_plan_id = sp.id
        WHERE ts.is_active = TRUE
    ),
    sub_costs AS (
        SELECT
            tenant_id,
            end_date,
            (COALESCE(base_price_cop, 0) + GREATEST(0, branch_count - 1) * COALESCE(extra_branch_price_cop, 0)) AS total_cost,
            (COALESCE(base_price_cop, 0) + GREATEST(0, branch_count - 1) * COALESCE(extra_branch_price_cop, 0)) / GREATEST(1, billing_frequency_months) AS monthly_cost
        FROM active_subs
    )
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
