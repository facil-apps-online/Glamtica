-- Migration: Fix `get_top_services` and permissions in `get_user_performance_report`

-- Step 1: Correct `get_top_services` to use `attention_datetime`
DROP FUNCTION IF EXISTS public.get_top_services(uuid, integer);
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
    WHERE a.tenant_id = p_tenant_id AND a.attention_datetime::date >= CURRENT_DATE - (p_days || ' days')::interval
    GROUP BY s.name
    ORDER BY count DESC
    LIMIT 5;
END;
$$;

-- Step 2: Correct `get_user_performance_report` to use `get_tenant_users` and avoid permission issues
DROP FUNCTION IF EXISTS public.get_user_performance_report(uuid, date, date);
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
    FROM public.get_tenant_users(p_tenant_id) u -- Changed to use get_tenant_users
    LEFT JOIN public.attention_services aserv ON u.user_id = aserv.user_id AND aserv.tenant_id = p_tenant_id
    LEFT JOIN public.attentions a ON aserv.attention_id = a.id AND a.attention_datetime::date BETWEEN p_date_from AND p_date_to
    LEFT JOIN public.attention_products ap ON u.user_id = ap.user_id AND ap.tenant_id = p_tenant_id AND ap.attention_id = a.id
    WHERE u.status = 'active' -- Ensure we only report on active users
    GROUP BY u.user_id, u.first_name, u.last_name;
END;
$$;
