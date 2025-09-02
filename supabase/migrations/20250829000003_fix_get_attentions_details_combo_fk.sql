-- Migration: Fix get_attentions_with_details to include correct attention_combo_id alias

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
      AND (p_date_filter IS NULL OR a.attention_datetime::date = p_date_filter)
      AND (p_user_id IS NULL OR EXISTS (
        SELECT 1 FROM public.attention_services aserv WHERE aserv.attention_id = a.id AND aserv.user_id = p_user_id
      ))
  )
  SELECT
    af.id, af.created_at, af.tenant_id, af.branch_id, af.client_id, af.attention_datetime, af.status, af.notes,
    (SELECT json_build_object('id', c.id, 'name', c.name, 'phone', c.phone) FROM public.clients c WHERE c.id = af.client_id LIMIT 1) as clients,
    (SELECT json_agg(json_build_object(
        'id', aserv.id, 
        'service_id', aserv.service_id, 
        'user_id', aserv.user_id, 
        'price', aserv.price, 
        'notes', aserv.notes, 
        'status', aserv.status, 
        'attention_combo_id', aserv.attention_combo_id, -- Correct alias
        'duration_minutes', aserv.duration_minutes, 
        'start_time', aserv.start_time, 
        'end_time', aserv.end_time, 
        'is_parallel', aserv.is_parallel, 
        'parallel_group_id', aserv.parallel_group_id, 
        'offset_minutes', aserv.offset_minutes, 
        'service_name', (SELECT s.name FROM public.services s WHERE s.id = aserv.service_id)
    )) FROM public.attention_services aserv WHERE aserv.attention_id = af.id) as attention_services,
    (SELECT json_agg(json_build_object(
        'id', ap.id, 
        'product_id', ap.product_id, 
        'commission_user_id', ap.commission_user_id, 
        'quantity', ap.quantity, 
        'unit_price', ap.unit_price, 
        'attention_combo_id', ap.attention_combo_id, -- Correct alias
        'product_name', (SELECT p.name FROM public.products p WHERE p.id = ap.product_id)
    )) FROM public.attention_products ap WHERE ap.attention_id = af.id) as attention_products,
    (SELECT json_agg(json_build_object(
        'id', ac.id, 
        'combo_id', ac.combo_id, 
        'price', ac.price, 
        'quantity', ac.quantity, 
        'user_id', ac.user_id, 
        'status', ac.status, 
        'duration_minutes', ac.duration_minutes, 
        'start_time', ac.start_time, 
        'end_time', ac.end_time, 
        'is_parallel', ac.is_parallel, 
        'parallel_group_id', ac.parallel_group_id, 
        'offset_minutes', ac.offset_minutes, 
        'combo_name', (SELECT c.name FROM public.combos c WHERE c.id = ac.combo_id)
    )) FROM public.attention_combos ac WHERE ac.attention_id = af.id) as attention_combos
  FROM attentions_filtered af;
END;
$$;