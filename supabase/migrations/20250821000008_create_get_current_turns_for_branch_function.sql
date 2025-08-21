CREATE OR REPLACE FUNCTION get_current_turns_for_branch(p_branch_id uuid)
RETURNS TABLE (
  id uuid,
  branch_id uuid,
  client_id uuid,
  stylist_id uuid,
  status turn_status,
  called_at timestamptz,
  tenant_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM turns
  WHERE
    turns.branch_id = p_branch_id AND
    turns.status IN ('waiting', 'called')
  ORDER BY
    turns.created_at;
END;
$$;