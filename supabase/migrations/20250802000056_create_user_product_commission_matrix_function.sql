CREATE OR REPLACE FUNCTION get_user_product_commission_matrix(
  user_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(product_id uuid, product_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH user_branches AS (
    -- 1. Find all branches for the user
    SELECT DISTINCT branch_id
    FROM public.user_assignments
    WHERE user_id = user_id_param AND tenant_id = tenant_id_param AND status = 'active'
  ),
  relevant_products AS (
    -- 2. Find all master products available in those branches
    SELECT DISTINCT bp.master_product_id as product_id, p.name as product_name
    FROM public.branch_products bp
    JOIN public.products p ON bp.master_product_id = p.id
    WHERE bp.branch_id IN (SELECT branch_id FROM user_branches)
      AND bp.tenant_id = tenant_id_param
  ),
  commission_matrix AS (
    -- 3. Create the matrix of product/branch combinations for the user
    SELECT
      rp.product_id,
      rp.product_name,
      ub.branch_id,
      b.name as branch_name
    FROM relevant_products rp
    CROSS JOIN user_branches ub
    JOIN public.branches b ON ub.branch_id = b.id
    -- Ensure the product is actually in the specific branch of this row
    WHERE EXISTS (
      SELECT 1 FROM public.branch_products bp
      WHERE bp.master_product_id = rp.product_id AND bp.branch_id = ub.branch_id
    )
  )
  -- 4. Join with commissions and aggregate
  SELECT
    cm.product_id,
    cm.product_name,
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
    ON cm.product_id = pc.product_id
    AND cm.branch_id = pc.branch_id
    AND pc.user_id = user_id_param
  GROUP BY cm.product_id, cm.product_name;
END;
$$ LANGUAGE plpgsql;