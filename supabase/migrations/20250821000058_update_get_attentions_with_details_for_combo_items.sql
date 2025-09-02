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
  attention_date date,
  attention_time time,
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
      a.id,
      a.created_at,
      a.tenant_id,
      a.branch_id,
      a.client_id,
      a.attention_date,
      a.attention_time,
      a.status,
      a.notes
    FROM
      public.attentions a
    WHERE
      a.tenant_id = p_tenant_id
      AND (p_branch_id IS NULL OR a.branch_id = p_branch_id)
      AND (p_status_filter IS NULL OR a.status = p_status_filter)
      AND (p_date_filter IS NULL OR a.attention_date = p_date_filter)
      AND (p_user_id IS NULL OR EXISTS (
        SELECT 1
        FROM public.attention_services aserv
        WHERE aserv.attention_id = a.id AND aserv.user_id = p_user_id
      ))
  )
  SELECT
    af.id,
    af.created_at,
    af.tenant_id,
    af.branch_id,
    af.client_id,
    af.attention_date,
    af.attention_time,
    af.status,
    af.notes,
    (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'phone', c.phone
      )
      FROM public.clients c
      WHERE c.id = af.client_id
      LIMIT 1
    ) as clients,
    (
      SELECT json_agg(
        json_build_object(
          'id', aserv.id,
          'service_id', aserv.service_id,
          'user_id', aserv.user_id,
          'service_price', aserv.service_price,
          'notes', aserv.notes,
          'status', aserv.status,
          'combo_id', aserv.combo_id, -- Added combo_id
          'services', (
            SELECT json_build_object(
              'id', s.id,
              'name', s.name
            )
            FROM public.services s
            WHERE s.id = aserv.service_id AND s.tenant_id = af.tenant_id
            LIMIT 1
          ),
          'users', (
            SELECT json_build_object(
              'id', gtu.user_id,
              'first_name', gtu.first_name,
              'last_name', gtu.last_name
            )
            FROM get_tenant_users(p_tenant_id) gtu
            WHERE gtu.user_id = aserv.user_id
            LIMIT 1
          )
        )
      )
      FROM public.attention_services aserv
      WHERE aserv.attention_id = af.id
    ) as attention_services,
    (
      SELECT json_agg(
        json_build_object(
          'id', ap.id,
          'product_id', ap.product_id,
          'user_id', ap.user_id,
          'quantity', ap.quantity,
          'unit_price', ap.unit_price,
          'total_price', ap.total_price,
          'combo_id', ap.combo_id, -- Added combo_id
          'products', (
            SELECT json_build_object(
              'id', p.id,
              'name', p.name
            )
            FROM public.products p
            WHERE p.id = ap.product_id AND p.tenant_id = af.tenant_id
          )
        )
      )
      FROM public.attention_products ap
      WHERE ap.attention_id = af.id
    ) as attention_products,
    (
      SELECT json_agg(
        json_build_object(
          'id', ac.id,
          'combo_id', ac.combo_id,
          'price', ac.price,
          'quantity', ac.quantity, -- Added quantity
          'user_id', ac.user_id,
          'combos', (
            SELECT json_build_object(
              'id', c.id,
              'name', c.name
            )
            FROM public.combos c
            WHERE c.id = ac.combo_id AND c.tenant_id = af.tenant_id
          )
        )
      )
      FROM public.attention_combos ac
      WHERE ac.attention_id = af.id
    ) as attention_combos
  FROM
    attentions_filtered af;
END;
$$;