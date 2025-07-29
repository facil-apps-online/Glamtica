
-- Migración para CORREGIR las funciones del dashboard financiero.
-- Corrige el nombre de la columna 'amount' a 'amount_in_cents' y añade la conversión.
-- Asegura el filtro por 'environment'.

-- 1. Reemplazar la función principal, parametrizada por plataforma.
CREATE OR REPLACE FUNCTION public.get_platform_financial_stats(p_platform_id UUID DEFAULT NULL)
RETURNS TABLE (
    mrr NUMERIC,
    arr NUMERIC,
    total_revenue_last_30_days NUMERIC,
    new_tenants_last_30_days BIGINT,
    active_subscriptions BIGINT,
    payments_last_30_days BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH valid_payments AS (
        -- Filtra los pagos completados y de producción, uniéndolos con tenants y plataformas.
        SELECT 
            (pi.amount_in_cents / 100.0) as amount, -- Corregido
            pi.created_at,
            t.id as tenant_id,
            t.created_at as tenant_created_at,
            t.platform_id
        FROM public.payment_intents pi
        JOIN public.tenants t ON pi.tenant_id = t.id
        WHERE pi.status = 'COMPLETED'
          AND pi.environment <> 'test' -- Confirmado
          AND (p_platform_id IS NULL OR t.platform_id = p_platform_id)
    ),
    monthly_revenue AS (
        -- Calcula los ingresos del último mes completo para el MRR.
        SELECT COALESCE(SUM(amount), 0) as total
        FROM valid_payments
        WHERE created_at >= date_trunc('month', NOW() - interval '1 month')
          AND created_at < date_trunc('month', NOW())
    )
    SELECT
        -- MRR: Ingresos del último mes completo.
        (SELECT total FROM monthly_revenue) AS mrr,
        
        -- ARR: MRR multiplicado por 12.
        (SELECT total * 12 FROM monthly_revenue) AS arr,
        
        -- Ingresos totales de los últimos 30 días.
        (SELECT COALESCE(SUM(amount), 0) FROM valid_payments WHERE created_at >= NOW() - interval '30 days') AS total_revenue_last_30_days,
        
        -- Nuevos tenants en los últimos 30 días para la plataforma seleccionada.
        (SELECT COUNT(DISTINCT tenant_id) FROM valid_payments WHERE tenant_created_at >= NOW() - interval '30 days') AS new_tenants_last_30_days,

        -- Suscripciones activas para la plataforma.
        (SELECT COUNT(*) FROM public.tenant_subscriptions ts JOIN public.tenants t ON ts.tenant_id = t.id WHERE ts.is_active = TRUE AND (p_platform_id IS NULL OR t.platform_id = p_platform_id)) AS active_subscriptions,

        -- Conteo de pagos en los últimos 30 días.
        (SELECT COUNT(*) FROM valid_payments WHERE created_at >= NOW() - interval '30 days') AS payments_last_30_days;
END;
$$;

COMMENT ON FUNCTION public.get_platform_financial_stats(UUID) IS 'Calcula métricas financieras clave (MRR, ARR, etc.) para una plataforma específica o para todas si el ID es NULL. Se basa en pagos completados.';

-- 2. Reemplazar la función para el dashboard de inversores para que use la función principal corregida.
CREATE OR REPLACE FUNCTION public.get_investor_dashboard_data(p_user_id UUID, p_platform_id UUID)
RETURNS TABLE (
    platform_name TEXT,
    investment_share NUMERIC,
    mrr NUMERIC,
    arr NUMERIC,
    my_mrr_share NUMERIC,
    my_arr_share NUMERIC,
    total_revenue_last_30_days NUMERIC,
    my_revenue_share_last_30 NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_share NUMERIC;
    v_platform_name TEXT;
BEGIN
    -- Obtener la participación del inversor y el nombre de la plataforma.
    SELECT ips.investment_share, p.name
    INTO v_share, v_platform_name
    FROM public.investor_platform_shares ips
    JOIN public.platforms p ON ips.platform_id = p.id
    WHERE ips.user_id = p_user_id AND ips.platform_id = p_platform_id;

    -- Si no se encuentra participación, no devolver filas.
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Devolver las métricas de la plataforma multiplicadas por la participación del inversor.
    RETURN QUERY
    SELECT
        v_platform_name as platform_name,
        v_share as investment_share,
        stats.mrr,
        stats.arr,
        stats.mrr * v_share AS my_mrr_share,
        stats.arr * v_share AS my_arr_share,
        stats.total_revenue_last_30_days,
        stats.total_revenue_last_30_days * v_share AS my_revenue_share_last_30
    FROM public.get_platform_financial_stats(p_platform_id) stats;
END;
$$;

COMMENT ON FUNCTION public.get_investor_dashboard_data(UUID, UUID) IS 'Calcula las métricas del dashboard para un inversor, mostrando su participación sobre los ingresos de una plataforma específica.';
