-- Migration: Fix functions missed in datetime refactor

-- Step 1: Correct `get_today_attentions` to use `attention_datetime`
DROP FUNCTION IF EXISTS public.get_today_attentions(uuid);
CREATE OR REPLACE FUNCTION public.get_today_attentions(p_tenant_id uuid)
RETURNS TABLE(id uuid, attention_datetime timestamptz, client_name text, service_name text, user_name text, status text, total_price numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.attention_datetime,
        c.name,
        s.name,
        (u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name'),
        a.status,
        a.total_amount
    FROM public.attentions a
    JOIN public.clients c ON a.client_id = c.id
    JOIN public.attention_services aserv ON a.id = aserv.attention_id
    JOIN public.services s ON aserv.service_id = s.id
    JOIN auth.users u ON aserv.user_id = u.id
    WHERE a.tenant_id = p_tenant_id AND a.attention_datetime::date = CURRENT_DATE
    ORDER BY a.attention_datetime;
END;
$$;

-- Step 2: Correct `get_user_performance_report` from the same migration file
DROP FUNCTION IF EXISTS public.get_user_performance_report(uuid, date, date);
CREATE OR REPLACE FUNCTION public.get_user_performance_report(p_tenant_id uuid, p_date_from date, p_date_to date)
RETURNS TABLE(user_name text, attentions_count bigint, services_revenue numeric, products_revenue numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name') as user_name,
        COUNT(DISTINCT a.id) as attentions_count,
        SUM(aserv.service_price) as services_revenue,
        COALESCE(SUM(ap.total_price), 0) as products_revenue
    FROM auth.users u
    JOIN public.user_assignments ua ON u.id = ua.user_id
    LEFT JOIN public.attention_services aserv ON u.id = aserv.user_id AND aserv.tenant_id = p_tenant_id
    LEFT JOIN public.attentions a ON aserv.attention_id = a.id AND a.attention_datetime::date BETWEEN p_date_from AND p_date_to
    LEFT JOIN public.attention_products ap ON u.id = ap.user_id AND ap.tenant_id = p_tenant_id AND ap.attention_id = a.id
    WHERE ua.tenant_id = p_tenant_id
    GROUP BY u.id, u.raw_user_meta_data;
END;
$$;
