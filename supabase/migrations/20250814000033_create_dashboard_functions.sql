-- Función para obtener estadísticas del dashboard
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
        'todayRevenue', (SELECT revenue FROM daily_revenue WHERE attention_date = CURRENT_DATE),
        'monthlyRevenue', (SELECT SUM(total_amount) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)),
        'todayAppointments', (SELECT COUNT(*) FROM public.attentions WHERE tenant_id = p_tenant_id AND attention_date = CURRENT_DATE),
        'activeStylists', (SELECT COUNT(*) FROM public.users WHERE tenant_id = p_tenant_id AND is_active = true),
        'averageDuration', (SELECT AVG(duration_minutes) FROM public.service_sessions WHERE tenant_id = p_tenant_id),
        'revenueChange', (SELECT (today.revenue - yesterday.revenue) / yesterday.revenue * 100 FROM daily_revenue today, daily_revenue yesterday WHERE today.attention_date = CURRENT_DATE AND yesterday.attention_date = CURRENT_DATE - INTERVAL '1 day'),
        'appointmentsChange', (SELECT (today.count - yesterday.count) / yesterday.count * 100 FROM monthly_attentions today, monthly_attentions yesterday WHERE today.month = date_trunc('month', CURRENT_DATE) AND yesterday.month = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'),
        'monthlyRevenueChange', (SELECT (this_month.revenue - last_month.revenue) / last_month.revenue * 100 FROM (SELECT SUM(total_amount) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE)) this_month, (SELECT SUM(total_amount) as revenue FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND date_trunc('month', attention_date) = date_trunc('month', CURRENT_DATE) - INTERVAL '1 month') last_month)
    ) INTO v_stats;

    RETURN v_stats;
END;
$$;

-- Función para obtener las atenciones de hoy
CREATE OR REPLACE FUNCTION public.get_today_attentions(p_tenant_id uuid)
RETURNS TABLE(id uuid, attention_time time, client_name text, service_name text, stylist_name text, status text, total_price numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.attention_time,
        c.name,
        s.name,
        u.first_name || ' ' || u.last_name,
        a.status,
        a.total_amount
    FROM public.attentions a
    JOIN public.clients c ON a.client_id = c.id
    JOIN public.attention_services aserv ON a.id = aserv.attention_id
    JOIN public.services s ON aserv.service_id = s.id
    JOIN public.users u ON aserv.user_id = u.id
    WHERE a.tenant_id = p_tenant_id AND a.attention_date = CURRENT_DATE
    ORDER BY a.attention_time;
END;
$$;

-- Función para obtener los servicios más populares
CREATE OR REPLACE FUNCTION public.get_top_services(p_tenant_id uuid, p_days integer)
RETURNS TABLE(name text, count bigint, revenue numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name,
        COUNT(aserv.id),
        SUM(aserv.service_price)
    FROM public.attention_services aserv
    JOIN public.services s ON aserv.service_id = s.id
    JOIN public.attentions a ON aserv.attention_id = a.id
    WHERE a.tenant_id = p_tenant_id AND a.attention_date >= CURRENT_DATE - (p_days || ' days')::interval
    GROUP BY s.name
    ORDER BY count DESC
    LIMIT 5;
END;
$$;