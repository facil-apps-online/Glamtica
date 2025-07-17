
CREATE OR REPLACE FUNCTION public.create_tenant_admin(p_tenant_id uuid, p_email text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id uuid;
  v_hashed_password text;
BEGIN
  -- Verificar si el usuario actual es super_admin
  IF NOT (SELECT public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acceso denegado. Solo los superadministradores pueden crear administradores de tenant.';
  END IF;

  -- Obtener el ID del rol 'tenant_super_admin'
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'tenant_super_admin';
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rol tenant_super_admin no encontrado.';
  END IF;

  -- Hashear la contraseña
  SELECT public.crypt(p_password, public.gen_salt('bf')) INTO v_hashed_password;

  -- Insertar el nuevo usuario
  INSERT INTO public.users (email, password_hash, role_id, tenant_id)
  VALUES (p_email, v_hashed_password, v_role_id, p_tenant_id);

END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_admin(uuid, text, text) TO authenticated;
