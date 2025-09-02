-- Migration: Update all RPC functions to use attention_datetime (Full, Corrected Version)

-- Step 1: Update `get_attentions_with_details`
DROP FUNCTION IF EXISTS get_attentions_with_details(uuid, uuid, uuid, text, date) CASCADE;
CREATE OR REPLACE FUNCTION get_attentions_with_details(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_user_id uuid,
  p_status_filter text,
  p_date_filter date
)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  tenant_id uuid,
  branch_id uuid,
  client_id uuid,
  attention_datetime timestamp with time zone,
  status text,
  notes text,
  clients json,
  attention_services json,
  attention_products json,
  attention_combos json
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH attentions_filtered AS (
    SELECT
      a.id, a.created_at, a.tenant_id, a.branch_id, a.client_id, a.attention_datetime, a.status, a.notes
    FROM public.attentions a
    WHERE
      a.tenant_id = p_tenant_id
      AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
      AND (p_status_filter IS NULL OR a.status = p_status_filter)
      AND (p_date_filter IS NULL OR a.attention_datetime::date = p_date_filter) -- Changed
      AND (p_user_id IS NULL OR EXISTS (
        SELECT 1 FROM public.attention_services aserv WHERE aserv.attention_id = a.id AND aserv.user_id = p_user_id
      ))
  )
  SELECT
    af.id, af.created_at, af.tenant_id, af.branch_id, af.client_id, af.attention_datetime, af.status, af.notes,
    (SELECT json_build_object('id', c.id, 'name', c.name, 'phone', c.phone) FROM public.clients c WHERE c.id = af.client_id LIMIT 1) as clients,
    (SELECT json_agg(json_build_object('id', aserv.id, 'service_id', aserv.service_id, 'user_id', aserv.user_id, 'service_price', aserv.service_price, 'notes', aserv.notes, 'status', aserv.status, 'combo_id', aserv.combo_id, 'services', (SELECT json_build_object('id', s.id, 'name', s.name) FROM public.services s WHERE s.id = aserv.service_id AND s.tenant_id = af.tenant_id LIMIT 1))) FROM public.attention_services aserv WHERE aserv.attention_id = af.id) as attention_services,
    (SELECT json_agg(json_build_object('id', ap.id, 'product_id', ap.product_id, 'user_id', ap.user_id, 'quantity', ap.quantity, 'unit_price', ap.unit_price, 'total_price', ap.total_price, 'combo_id', ap.combo_id, 'products', (SELECT json_build_object('id', p.id, 'name', p.name) FROM public.products p WHERE p.id = ap.product_id AND p.tenant_id = af.tenant_id))) FROM public.attention_products ap WHERE ap.attention_id = af.id) as attention_products,
    (SELECT json_agg(json_build_object('id', ac.id, 'combo_id', ac.combo_id, 'price', ac.price, 'quantity', ac.quantity, 'user_id', ac.user_id, 'status', ac.status, 'combos', (SELECT json_build_object('id', c.id, 'name', c.name, 'combo_items', (SELECT json_agg(json_build_object('id', ci.id, 'product_id', ci.product_id, 'service_id', ci.service_id, 'quantity', ci.quantity, 'product', (SELECT json_build_object('name', p.name) FROM public.products p WHERE p.id = ci.product_id), 'service', (SELECT json_build_object('name', s.name) FROM public.services s WHERE s.id = ci.service_id))) FROM public.combo_items ci WHERE ci.combo_id = c.id)) FROM public.combos c WHERE c.id = ac.combo_id AND c.tenant_id = af.tenant_id))) FROM public.attention_combos ac WHERE ac.attention_id = af.id) as attention_combos
  FROM attentions_filtered af;
END;
$$;

-- Step 2: Update `get_dashboard_stats`
DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid, uuid, uuid);
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_tenant_id uuid, p_branch_id uuid DEFAULT NULL, p_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    v_stats jsonb;
BEGIN
    WITH base_attentions AS (
        SELECT a.id, a.total_amount, a.attention_datetime, a.status
        FROM public.attentions a
        WHERE a.tenant_id = p_tenant_id
          AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
          AND (p_user_id IS NULL OR EXISTS (SELECT 1 FROM public.attention_services WHERE attention_id = a.id AND user_id = p_user_id) OR EXISTS (SELECT 1 FROM public.attention_products WHERE attention_id = a.id AND user_id = p_user_id))
    ),
    daily_revenue AS (
        SELECT COALESCE(SUM(total_amount), 0) as revenue, attention_datetime::date as a_date
        FROM base_attentions WHERE status IN ('Completada', 'Pagada')
        GROUP BY a_date
    )
    SELECT jsonb_build_object(
        'todayRevenue', (SELECT revenue FROM daily_revenue WHERE a_date = CURRENT_DATE),
        'monthlyRevenue', (SELECT COALESCE(SUM(total_amount), 0) FROM base_attentions WHERE status IN ('Completada', 'Pagada') AND date_trunc('month', attention_datetime) = date_trunc('month', CURRENT_DATE)),
        'todayAppointments', (SELECT COALESCE(COUNT(*), 0) FROM base_attentions WHERE attention_datetime::date = CURRENT_DATE)
    ) INTO v_stats;
    RETURN v_stats;
END;
$$;

-- Step 3: Update Report Functions
DROP FUNCTION IF EXISTS public.get_general_report(uuid, date, date);
CREATE OR REPLACE FUNCTION public.get_general_report(p_tenant_id uuid, p_date_from date, p_date_to date)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
    RETURN (SELECT jsonb_build_object(
        'totalRevenue', (SELECT SUM(total_amount) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_datetime::date BETWEEN p_date_from AND p_date_to),
        'completedAttentions', (SELECT COUNT(*) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_datetime::date BETWEEN p_date_from AND p_date_to),
        'averageTicket', (SELECT AVG(total_amount) FROM public.attentions WHERE tenant_id = p_tenant_id AND status IN ('Completada', 'Pagada') AND attention_datetime::date BETWEEN p_date_from AND p_date_to)
    ));
END;
$$;

DROP FUNCTION IF EXISTS public.get_service_report(uuid, date, date);
CREATE OR REPLACE FUNCTION public.get_service_report(p_tenant_id uuid, p_date_from date, p_date_to date)
RETURNS TABLE(name text, count bigint, revenue numeric) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY SELECT s.name, COUNT(aserv.id), SUM(aserv.service_price)
    FROM public.attention_services aserv
    JOIN public.services s ON aserv.service_id = s.id
    JOIN public.attentions a ON aserv.attention_id = a.id
    WHERE a.tenant_id = p_tenant_id AND a.attention_datetime::date BETWEEN p_date_from AND p_date_to
    GROUP BY s.name ORDER BY count DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_performance_report(uuid, date, date);
CREATE OR REPLACE FUNCTION public.get_user_performance_report(p_tenant_id uuid, p_date_from date, p_date_to date)
RETURNS TABLE(user_name text, attentions_count bigint, services_revenue numeric, products_revenue numeric) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY SELECT u.first_name || ' ' || u.last_name as user_name, COUNT(DISTINCT a.id), SUM(aserv.service_price),
        (SELECT SUM(ap.total_price) FROM public.attention_products ap WHERE ap.user_id = u.id AND ap.attention_id = a.id)
    FROM public.users u
    JOIN public.attention_services aserv ON u.id = aserv.user_id
    JOIN public.attentions a ON aserv.attention_id = a.id
    WHERE a.tenant_id = p_tenant_id AND a.attention_datetime::date BETWEEN p_date_from AND p_date_to
    GROUP BY u.id, a.id;
END;
$$;
