CREATE OR REPLACE FUNCTION add_turn(p_branch_id uuid, p_client_id uuid, p_stylist_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
  v_turn_id uuid;
BEGIN
  v_tenant_id := auth.get_tenant_id_from_jwt();

  INSERT INTO turns (branch_id, client_id, stylist_id, status, tenant_id)
  VALUES (p_branch_id, p_client_id, p_stylist_id, 'waiting', v_tenant_id)
  RETURNING id INTO v_turn_id;

  RETURN v_turn_id;
END;
$$;