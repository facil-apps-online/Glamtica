-- Migración para corregir las funciones de matriz de comisiones de productos y servicios (v5).

-- Corrección para get_product_commission_matrix
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
      WHERE product_id = product_id_param AND tenant_id = tenant_id_param
    )
  ),
  relevant_users AS (
    -- 2. Encontrar todos los usuarios que trabajan en esas sucursales
    --    Las asignaciones de sucursal se obtienen de la metadata del usuario.
    SELECT DISTINCT
        u.id as user_id,
        u.raw_user_meta_data->>'first_name' || ' ' || u.raw_user_meta_data->>'last_name' as user_name
    FROM
        auth.users u,
        jsonb_array_elements(u.raw_app_meta_data::jsonb->'assignments') AS assignment -- CAST explícito a jsonb
    WHERE
        (assignment->>'branch_id')::uuid IN (SELECT branch_id FROM relevant_branches)
        AND (assignment->>'tenant_id')::uuid = tenant_id_param
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

-- Corrección para get_service_commission_matrix
CREATE OR REPLACE FUNCTION get_service_commission_matrix(
  service_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(user_id uuid, user_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH relevant_branches AS (
    -- 1. Find all branches where the service is active
    SELECT id as branch_id, name as branch_name
    FROM public.branches
    WHERE id IN (
      SELECT branch_id FROM public.branch_services
      WHERE service_id = service_id_param AND tenant_id = tenant_id_param
    )
  ),
  relevant_users AS (
    -- 2. Find all users who work in those branches
    --    Branch assignments are obtained from user metadata.
    SELECT DISTINCT
        u.id as user_id,
        u.raw_user_meta_data->>'first_name' || ' ' || u.raw_user_meta_data->>'last_name' as user_name
    FROM
        auth.users u,
        jsonb_array_elements(u.raw_app_meta_data::jsonb->'assignments') AS assignment -- CAST explícito a jsonb
    WHERE
        (assignment->>'branch_id')::uuid IN (SELECT branch_id FROM relevant_branches)
        AND (assignment->>'tenant_id')::uuid = tenant_id_param
  ),
  commission_matrix AS (
    -- 3. Create the matrix of all possible user/branch combinations
    SELECT
      ru.user_id,
      ru.user_name,
      rb.branch_id,
      rb.branch_name
    FROM relevant_users ru
    CROSS JOIN relevant_branches rb
  )
  -- 4. Join with existing commissions and aggregate
  SELECT
    cm.user_id,
    cm.user_name,
    json_agg(
      json_build_object(
        'branch_id', cm.branch_id,
        'branch_name', cm.branch_name,
        'commission_id', sc.id,
        'commission_rate', sc.commission_rate,
        'can_perform', sc.can_perform
      )
    ) as branches
  FROM commission_matrix cm
  LEFT JOIN public.service_user_commissions sc
    ON cm.user_id = sc.user_id
    AND cm.branch_id = sc.branch_id
    AND sc.service_id = service_id_param
  GROUP BY cm.user_id, cm.user_name;
END;
$$ LANGUAGE plpgsql;