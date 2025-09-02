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
  attention_products json
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
    af.notes,
    (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'phone', c.phone
      )
      FROM public.clients c
      WHERE c.id = af.client_id
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
          'services', (
            SELECT json_build_object(
              'id', s.id,
              'name', s.name
            )
            FROM public.services s
            WHERE s.id = aserv.service_id
          ),
          'users', (
            SELECT json_build_object(
              'id', u.id,
              'first_name', u.raw_user_meta_data->>'first_name',
              'last_name', u.raw_user_meta_data->>'last_name'
            )
            FROM auth.users u
            WHERE u.id = aserv.user_id
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
          'quantity', ap.quantity,
          'total_price', ap.total_price,
          'products', (
            SELECT json_build_object(
              'id', p.id,
              'name', p.name
            )
            FROM public.products p
            WHERE p.id = ap.product_id
          )
        )
      )
      FROM public.attention_products ap
      WHERE ap.attention_id = af.id
    ) as attention_products
  FROM
    attentions_filtered af;
END;
$$;