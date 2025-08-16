
-- Parche para corregir funciones RPC que fallaban

-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'todayRevenue', (SELECT SUM(total_amount) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date = CURRENT_DATE),
        'monthlyRevenue', (SELECT SUM(total_amount) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)),
        'todayAppointments', (SELECT COUNT(*) FROM public.attentions WHERE tenant_id = p_tenant_id AND attention_date = CURRENT_DATE),
        'activeStylists', (SELECT COUNT(DISTINCT ua.user_id) FROM public.user_assignments ua WHERE ua.tenant_id = p_tenant_id AND ua.status = 'active'),
        'averageDuration', (SELECT AVG(duration_minutes) FROM public.service_sessions WHERE tenant_id = p_tenant_id),
        'revenueChange', (SELECT (today.revenue - yesterday.revenue) / yesterday.revenue * 100 FROM (SELECT SUM(total_amount) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date = CURRENT_DATE) today, (SELECT SUM(total_amount) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date = CURRENT_DATE - INTERVAL '1 day') yesterday),
        'appointmentsChange', (SELECT (today.count - yesterday.count) / yesterday.count * 100 FROM (SELECT COUNT(*) as count FROM public.attentions WHERE tenant_id = p_tenant_id AND attention_date = CURRENT_DATE) today, (SELECT COUNT(*) as count FROM public.attentions WHERE tenant_id = p_tenant_id AND attention_date = CURRENT_DATE - INTERVAL '1 day') yesterday),
        'monthlyRevenueChange', (SELECT (this_month.revenue - last_month.revenue) / last_month.revenue * 100 FROM (SELECT SUM(total_amount) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)) this_month, (SELECT SUM(total_amount) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') last_month)
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;

-- Función para obtener el reporte de rendimiento de usuarios
CREATE OR REPLACE FUNCTION public.get_user_performance_report(p_tenant_id uuid, p_date_from date, p_date_to date)
RETURNS TABLE(user_name text, attentions_count bigint, services_revenue numeric, products_revenue numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.first_name || ' ' || u.last_name as user_name,
        COUNT(DISTINCT a.id) as attentions_count,
        SUM(aserv.service_price) as services_revenue,
        COALESCE(SUM(ap.total_price), 0) as products_revenue
    FROM public.users u
    JOIN public.user_assignments ua ON u.id = ua.user_id
    LEFT JOIN public.attention_services aserv ON u.id = aserv.user_id AND aserv.tenant_id = p_tenant_id
    LEFT JOIN public.attentions a ON aserv.attention_id = a.id AND a.attention_date BETWEEN p_date_from AND p_date_to
    LEFT JOIN public.attention_products ap ON u.id = ap.user_id AND ap.tenant_id = p_tenant_id AND ap.attention_id = a.id
    WHERE ua.tenant_id = p_tenant_id
    GROUP BY u.id, u.first_name, u.last_name;
END;
$$;
