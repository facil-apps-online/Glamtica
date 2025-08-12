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
      WHERE master_service_id = service_id_param AND tenant_id = tenant_id_param
    )
  ),
  relevant_users AS (
    -- 2. Find all users who work in those branches
    SELECT DISTINCT u.id as user_id, u.first_name || ' ' || u.last_name as user_name
    FROM public.users u
    JOIN public.user_assignments ua ON u.id = ua.user_id
    WHERE ua.branch_id IN (SELECT branch_id FROM relevant_branches)
      AND ua.tenant_id = tenant_id_param
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