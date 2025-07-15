-- Migración para crear la función RPC get_superadmin_financial_stats
-- Esta función calcula y devuelve métricas financieras clave para el dashboard del superadministrador.

-- Primero, eliminamos la función de estadísticas anterior si existe.
DROP FUNCTION IF EXISTS get_superadmin_dashboard_stats();

-- Luego, creamos la nueva y más potente función financiera.
CREATE OR REPLACE FUNCTION get_superadmin_financial_stats()
RETURNS TABLE (
    mrr NUMERIC,
    arr NUMERIC,
    projected_revenue_next_7_days NUMERIC,
    projected_revenue_next_30_days NUMERIC,
    renewed_revenue_last_30_days NUMERIC,
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
        -- Subconsulta para obtener las suscripciones activas y sus precios base
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
    -- Calcular el costo total por suscripción
    sub_costs AS (
        SELECT
            tenant_id,
            end_date,
            -- El costo total es el precio base + (precio extra * (sucursales - 1))
            (base_price_cop + GREATEST(0, branch_count - 1) * extra_branch_price_cop) AS total_cost,
            -- Normalizar el costo a un valor mensual para el MRR
            (base_price_cop + GREATEST(0, branch_count - 1) * extra_branch_price_cop) / billing_frequency_months AS monthly_cost
        FROM active_subs
    )
    SELECT
        -- 1. MRR: Suma de todos los costos mensuales normalizados
        (SELECT COALESCE(SUM(monthly_cost), 0) FROM sub_costs) AS mrr,
        -- 2. ARR: MRR * 12
        (SELECT COALESCE(SUM(monthly_cost), 0) * 12 FROM sub_costs) AS arr,
        -- 3. Proyección a 7 días
        (SELECT COALESCE(SUM(total_cost), 0) FROM sub_costs WHERE end_date BETWEEN now() AND now() + interval '7 days') AS projected_revenue_next_7_days,
        -- 4. Proyección a 30 días
        (SELECT COALESCE(SUM(total_cost), 0) FROM sub_costs WHERE end_date BETWEEN now() AND now() + interval '30 days') AS projected_revenue_next_30_days,
        -- 5. Renovaciones en los últimos 30 días (asumimos que si end_date fue en los últimos 30 días y sigue activa, se renovó)
        (SELECT COALESCE(SUM(total_cost), 0) FROM sub_costs WHERE end_date BETWEEN now() - interval '30 days' AND now()) AS renewed_revenue_last_30_days,
        -- 6. Desglose de planes
        (SELECT COUNT(*) FROM active_subs WHERE billing_frequency_months = 1) AS active_monthly_plans,
        (SELECT COUNT(*) FROM active_subs WHERE billing_frequency_months = 6) AS active_semestral_plans,
        (SELECT COUNT(*) FROM active_subs WHERE billing_frequency_months = 12) AS active_annual_plans,
        -- 7. Nuevos tenants
        (SELECT COUNT(*) FROM public.tenants WHERE created_at >= now() - interval '30 days') AS new_tenants_last_30_days;
END;
$$;
