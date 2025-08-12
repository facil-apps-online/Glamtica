CREATE OR REPLACE FUNCTION get_user_service_commission_matrix(
  user_id_param uuid,
  tenant_id_param uuid
)
RETURNS TABLE(service_id uuid, service_name text, branches json) AS $$
BEGIN
  RETURN QUERY
  WITH user_branches AS (
    -- 1. Find all branches for the user
    SELECT DISTINCT branch_id
    FROM public.user_assignments
    WHERE user_id = user_id_param AND tenant_id = tenant_id_param AND status = 'active'
  ),
  relevant_services AS (
    -- 2. Find all master services available in those branches
    SELECT DISTINCT bs.master_service_id as service_id, s.name as service_name
    FROM public.branch_services bs
    JOIN public.services s ON bs.master_service_id = s.id
    WHERE bs.branch_id IN (SELECT branch_id FROM user_branches)
      AND bs.tenant_id = tenant_id_param
  ),
  commission_matrix AS (
    -- 3. Create the matrix of service/branch combinations for the user
    SELECT
      rs.service_id,
      rs.service_name,
      ub.branch_id,
      b.name as branch_name
    FROM relevant_services rs
    CROSS JOIN user_branches ub
    JOIN public.branches b ON ub.branch_id = b.id
    -- Ensure the service is actually in the specific branch of this row
    WHERE EXISTS (
      SELECT 1 FROM public.branch_services bs
      WHERE bs.master_service_id = rs.service_id AND bs.branch_id = ub.branch_id
    )
  )
  -- 4. Join with commissions and aggregate
  SELECT
    cm.service_id,
    cm.service_name,
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
    ON cm.service_id = sc.service_id
    AND cm.branch_id = sc.branch_id
    AND sc.user_id = user_id_param
  GROUP BY cm.service_id, cm.service_name;
END;
$$ LANGUAGE plpgsql;