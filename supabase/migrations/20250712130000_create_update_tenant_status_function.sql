
CREATE OR REPLACE FUNCTION public.update_tenant_status(p_tenant_id uuid, p_new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (SELECT public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden cambiar el estado de un tenant.';
  END IF;

  UPDATE public.tenants
  SET subscription_status = p_new_status,
      updated_at = now()
  WHERE id = p_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_tenant_status(uuid, text) TO authenticated;
