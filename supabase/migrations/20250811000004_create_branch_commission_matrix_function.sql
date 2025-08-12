CREATE OR REPLACE FUNCTION get_branch_commission_matrix(
  branch_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(item_id uuid, item_name text, item_type text, users json) AS $$
BEGIN
  RETURN QUERY
  WITH branch_products AS (
    -- Corrected: Assuming branch_products has product_id directly
    SELECT bp.product_id as id, p.name, 'product' as type
    FROM public.branch_products bp
    JOIN public.products p ON bp.product_id = p.id
    WHERE bp.branch_id = branch_id_param AND bp.tenant_id = tenant_id_param
  ),
  branch_services AS (
    -- Corrected: Assuming branch_services has service_id directly
    SELECT bs.service_id as id, s.name, 'service' as type
    FROM public.branch_services bs
    JOIN public.services s ON bs.service_id = s.id
    WHERE bs.branch_id = branch_id_param AND bs.tenant_id = tenant_id_param
  ),
  all_items_in_branch AS (
    SELECT id, name, type FROM branch_products
    UNION ALL
    SELECT id, name, type FROM branch_services
  ),
  relevant_users AS (
    SELECT DISTINCT ua.user_id, u.first_name || ' ' || u.last_name as user_name
    FROM public.user_assignments ua
    JOIN public.users u ON ua.user_id = u.id
    WHERE ua.branch_id = branch_id_param AND ua.tenant_id = tenant_id_param
  ),
  commission_matrix AS (
    SELECT
      ai.id as item_id,
      ai.name as item_name,
      ai.type as item_type,
      ru.user_id,
      ru.user_name
    FROM all_items_in_branch ai
    CROSS JOIN relevant_users ru
  )
  SELECT
    cm.item_id,
    cm.item_name,
    cm.item_type,
    json_agg(
      json_build_object(
        'user_id', cm.user_id,
        'user_name', cm.user_name,
        'commission_rate',
          CASE
            WHEN cm.item_type = 'product' THEN pc.commission_rate
            WHEN cm.item_type = 'service' THEN sc.commission_rate
            ELSE NULL
          END,
        'can_perform',
          CASE
            WHEN cm.item_type = 'service' THEN sc.can_perform
            ELSE NULL
          END,
        'commission_id',
          CASE
            WHEN cm.item_type = 'product' THEN pc.id
            WHEN cm.item_type = 'service' THEN sc.id
            ELSE NULL
          END
      )
    ) as users
  FROM commission_matrix cm
  LEFT JOIN public.product_user_commissions pc
    ON cm.item_id = pc.product_id
    AND cm.user_id = pc.user_id
    AND branch_id_param = pc.branch_id
  LEFT JOIN public.service_user_commissions sc
    ON cm.item_id = sc.service_id
    AND cm.user_id = sc.user_id
    AND branch_id_param = sc.branch_id
  GROUP BY cm.item_id, cm.item_name, cm.item_type;
END;
$$ LANGUAGE plpgsql;