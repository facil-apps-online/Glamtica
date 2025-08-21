CREATE OR REPLACE FUNCTION authorize_tv_display(p_tv_display_id uuid, p_branch_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tv_displays
  SET
    branch_id = p_branch_id,
    tenant_id = p_tenant_id,
    is_registered = true,
    registered_at = now()
  WHERE id = p_tv_display_id;
END;
$$;