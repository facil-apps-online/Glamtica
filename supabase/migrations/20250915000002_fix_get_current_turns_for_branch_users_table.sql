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
  updated_at timestamptz,
  clients jsonb,
  users jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.branch_id,
    t.client_id,
    t.stylist_id,
    t.status,
    t.called_at,
    t.tenant_id,
    t.created_at,
    t.updated_at,
    jsonb_build_object('name', c.name) AS clients,
    jsonb_build_object('first_name', u.raw_user_meta_data->>'first_name', 'last_name', u.raw_user_meta_data->>'last_name') AS users
  FROM
    public.turns t
  LEFT JOIN
    public.clients c ON t.client_id = c.id
  LEFT JOIN
    auth.users u ON t.stylist_id = u.id
  WHERE
    t.branch_id = p_branch_id AND
    t.status IN ('waiting', 'called')
  ORDER BY
    t.created_at;
END;
$$;
