-- Migración para corregir las funciones de matriz de comisiones de productos y servicios (v19).

-- Corrección para get_product_commission_matrix
DROP FUNCTION IF EXISTS get_product_commission_matrix(uuid, uuid);
CREATE OR REPLACE FUNCTION get_product_commission_matrix(
  product_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(user_id uuid, first_name text, last_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH relevant_users AS (
    -- 1. Encontrar todos los usuarios que pueden vender el producto en cualquier sucursal
    SELECT DISTINCT
        gtu.user_id,
        gtu.first_name,
        gtu.last_name,
        gtu.branch_id,
        gtu.branch_name
    FROM
        get_tenant_users(tenant_id_param) gtu
    WHERE gtu.branch_id IN (SELECT bp.branch_id from public.branch_products bp WHERE bp.product_id = product_id_param AND bp.tenant_id = tenant_id_param)
  )
  -- 2. Unir con comisiones existentes y agregar
  SELECT
    ru.user_id,
    ru.first_name,
    ru.last_name,
    json_agg(
      json_build_object(
        'branch_id', ru.branch_id,
        'branch_name', ru.branch_name,
        'commission_id', pc.id,
        'commission_rate', pc.commission_rate
      )
    ) as branches
  FROM relevant_users ru
  LEFT JOIN public.product_user_commissions pc
    ON ru.user_id = pc.user_id
    AND ru.branch_id = pc.branch_id
    AND pc.product_id = product_id_param
  GROUP BY ru.user_id, ru.first_name, ru.last_name;
END;
$$ LANGUAGE plpgsql;

-- Corrección para get_service_commission_matrix
DROP FUNCTION IF EXISTS get_service_commission_matrix(uuid, uuid);
CREATE OR REPLACE FUNCTION get_service_commission_matrix(
  service_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(user_id uuid, first_name text, last_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH relevant_users AS (
    -- 1. Find all users who can perform the service in any branch
    SELECT DISTINCT
        gtu.user_id,
        gtu.first_name,
        gtu.last_name,
        gtu.branch_id,
        gtu.branch_name
    FROM
        get_tenant_users(tenant_id_param) gtu
    WHERE gtu.branch_id IN (SELECT bs.branch_id from public.branch_services bs WHERE bs.service_id = service_id_param AND bs.tenant_id = tenant_id_param)
  )
  -- 2. Join with existing commissions and aggregate
  SELECT
    ru.user_id,
    ru.first_name,
    ru.last_name,
    json_agg(
      json_build_object(
        'branch_id', ru.branch_id,
        'branch_name', ru.branch_name,
        'commission_id', sc.id,
        'commission_rate', sc.commission_rate,
        'can_perform', sc.can_perform
      )
    ) as branches
  FROM relevant_users ru
  LEFT JOIN public.service_user_commissions sc
    ON ru.user_id = sc.user_id
    AND ru.branch_id = sc.branch_id
    AND sc.service_id = service_id_param
  GROUP BY ru.user_id, ru.first_name, ru.last_name;
END;
$$ LANGUAGE plpgsql;