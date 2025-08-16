-- Fix the get_dashboard_stats RPC function to correctly query active stylists using get_tenant_users.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_stats jsonb;
BEGIN
    WITH daily_revenue AS (
        SELECT 
            SUM(total_amount) as revenue,
            attention_date
        FROM public.attentions
        WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada')
        GROUP BY attention_date
    ),
    monthly_attentions AS (
        SELECT
            COUNT(*) as count,
            date_trunc('month', attention_date) as month
        FROM public.attentions
        WHERE tenant_id = p_tenant_id
        GROUP BY month
    )
    SELECT jsonb_build_object(
        'todayRevenue', (SELECT COALESCE(SUM(total_amount), 0) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date = CURRENT_DATE),
        'monthlyRevenue', (SELECT COALESCE(SUM(total_amount), 0) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)),
        'todayAppointments', (SELECT COALESCE(COUNT(*), 0) FROM public.attentions WHERE tenant_id = p_tenant_id AND attention_date = CURRENT_DATE),
        'activeStylists', (SELECT COUNT(DISTINCT user_id) FROM get_tenant_users(p_tenant_id) WHERE status = 'active'),
        'averageDuration', (SELECT COALESCE(AVG(duration_minutes), 0) FROM public.service_sessions WHERE tenant_id = p_tenant_id),
        'revenueChange', (SELECT COALESCE((today.revenue - yesterday.revenue) / NULLIF(yesterday.revenue, 0) * 100, 0) FROM (SELECT COALESCE(SUM(total_amount), 0) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date = CURRENT_DATE) today, (SELECT COALESCE(SUM(total_amount), 0) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date = CURRENT_DATE - INTERVAL '1 day') yesterday),
        'appointmentsChange', (SELECT COALESCE((today.count - yesterday.count) / NULLIF(yesterday.count, 0) * 100, 0) FROM (SELECT COALESCE(COUNT(*), 0) as count FROM public.attentions WHERE tenant_id = p_tenant_id AND attention_date = CURRENT_DATE) today, (SELECT COALESCE(COUNT(*), 0) as count FROM public.attentions WHERE tenant_id = p_tenant_id AND attention_date = CURRENT_DATE - INTERVAL '1 day') yesterday),
        'monthlyRevenueChange', (SELECT COALESCE((this_month.revenue - last_month.revenue) / NULLIF(last_month.revenue, 0) * 100, 0) FROM (SELECT COALESCE(SUM(total_amount), 0) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)) this_month, (SELECT COALESCE(SUM(total_amount), 0) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') last_month)
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;
