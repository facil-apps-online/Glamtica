
CREATE OR REPLACE FUNCTION register_tv(p_registration_code TEXT, p_branch_id UUID, p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tv_displays
  SET 
    is_registered = true,
    branch_id = p_branch_id,
    tenant_id = p_tenant_id,
    registered_at = now()
  WHERE registration_code = p_registration_code;
END;
$$;