
-- Función para obtener el reporte general
CREATE OR REPLACE FUNCTION public.get_general_report(p_tenant_id uuid, p_date_from date, p_date_to date)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_report jsonb;
BEGIN
    SELECT jsonb_build_object(
        'totalRevenue', (SELECT SUM(total_amount) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date BETWEEN p_date_from AND p_date_to),
        'completedAttentions', (SELECT COUNT(*) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date BETWEEN p_date_from AND p_date_to),
        'averageTicket', (SELECT AVG(total_amount) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_date BETWEEN p_date_from AND p_date_to)
    ) INTO v_report;

    RETURN v_report;
END;
$$;

-- Función para obtener el reporte de servicios
CREATE OR REPLACE FUNCTION public.get_service_report(p_tenant_id uuid, p_date_from date, p_date_to date)
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
    WHERE a.tenant_id = p_tenant_id AND a.attention_date BETWEEN p_date_from AND p_date_to
    GROUP BY s.name
    ORDER BY count DESC;
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
        (SELECT SUM(ap.total_price) FROM public.attention_products ap WHERE ap.user_id = u.id AND ap.attention_id = a.id) as products_revenue
    FROM public.users u
    JOIN public.attention_services aserv ON u.id = aserv.user_id
    JOIN public.attentions a ON aserv.attention_id = a.id
    WHERE a.tenant_id = p_tenant_id AND a.attention_date BETWEEN p_date_from AND p_date_to
    GROUP BY u.id, a.id;
END;
$$;

-- Función para obtener el reporte de stock
CREATE OR REPLACE FUNCTION public.get_stock_report(p_tenant_id uuid)
RETURNS TABLE(branch_name text, product_name text, quantity integer, cost numeric, stock_value numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.name as branch_name,
        p.name as product_name,
        bp.stock_quantity as quantity,
        p.cost_price as cost,
        (bp.stock_quantity * p.cost_price) as stock_value
    FROM public.branch_products bp
    JOIN public.products p ON bp.product_id = p.id
    JOIN public.branches b ON bp.branch_id = b.id
    WHERE p.tenant_id = p_tenant_id;
END;
$$;
