-- Migration: Fix permission denied error in get_today_attentions

-- Step 1: Drop the old function that directly accesses auth.users
DROP FUNCTION IF EXISTS public.get_today_attentions(uuid);

-- Step 2: Recreate the function to use `get_tenant_users` for safe user data access
CREATE OR REPLACE FUNCTION public.get_today_attentions(p_tenant_id uuid)
RETURNS TABLE(id uuid, attention_datetime timestamptz, client_name text, service_name text, user_name text, status text, total_price numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.attention_datetime,
        c.name AS client_name,
        s.name AS service_name,
        u.first_name || ' ' || u.last_name AS user_name,
        a.status,
        a.total_amount
    FROM 
        public.attentions a
    JOIN 
        public.clients c ON a.client_id = c.id
    JOIN 
        public.attention_services aserv ON a.id = aserv.attention_id
    JOIN 
        public.services s ON aserv.service_id = s.id
    JOIN 
        public.get_tenant_users(p_tenant_id) u ON aserv.user_id = u.user_id -- Corrected JOIN
    WHERE 
        a.tenant_id = p_tenant_id 
        AND a.attention_datetime::date = CURRENT_DATE
    ORDER BY 
        a.attention_datetime;
END;
$$;
