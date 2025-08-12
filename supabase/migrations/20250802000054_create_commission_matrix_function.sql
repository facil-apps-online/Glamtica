CREATE OR REPLACE FUNCTION get_product_commission_matrix(
  product_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(user_id uuid, user_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH relevant_branches AS (
    -- 1. Encontrar todas las sucursales donde el producto está activo
    SELECT id as branch_id, name as branch_name
    FROM public.branches
    WHERE id IN (
      SELECT branch_id FROM public.branch_products
      WHERE master_product_id = product_id_param AND tenant_id = tenant_id_param
    )
  ),
  relevant_users AS (
    -- 2. Encontrar todos los usuarios que trabajan en esas sucursales
    SELECT DISTINCT u.id as user_id, u.first_name || ' ' || u.last_name as user_name
    FROM public.users u
    JOIN public.user_assignments ua ON u.id = ua.user_id
    WHERE ua.branch_id IN (SELECT branch_id FROM relevant_branches)
      AND ua.tenant_id = tenant_id_param
  ),
  commission_matrix AS (
    -- 3. Crear la matriz de todas las combinaciones posibles de usuario/sucursal
    SELECT
      ru.user_id,
      ru.user_name,
      rb.branch_id,
      rb.branch_name
    FROM relevant_users ru
    CROSS JOIN relevant_branches rb
  )
  -- 4. Unir con comisiones existentes y agregar
  SELECT
    cm.user_id,
    cm.user_name,
    json_agg(
      json_build_object(
        'branch_id', cm.branch_id,
        'branch_name', cm.branch_name,
        'commission_id', pc.id,
        'commission_rate', pc.commission_rate
      )
    ) as branches
  FROM commission_matrix cm
  LEFT JOIN public.product_commissions pc
    ON cm.user_id = pc.user_id
    AND cm.branch_id = pc.branch_id
    AND pc.product_id = product_id_param
  GROUP BY cm.user_id, cm.user_name;
END;
$$ LANGUAGE plpgsql;