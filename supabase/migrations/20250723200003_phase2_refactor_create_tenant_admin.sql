-- FASE 2: Refactorización del Backend (Paso 3)
-- Esta migración actualiza la función 'create_tenant_admin' para que utilice
-- la nueva tabla 'user_assignments'.

CREATE OR REPLACE FUNCTION public.create_tenant_admin(p_tenant_id uuid, p_email text, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id uuid;
  v_user_id uuid;
  v_hashed_password text;
BEGIN
  -- Verificar si el usuario actual es super_admin (sin cambios)
  IF NOT (SELECT public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acceso denado. Solo los superadministradores pueden crear administradores de tenant.';
  END IF;

  -- Obtener el ID del rol 'tenant_super_admin' (sin cambios)
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'tenant_super_admin';
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rol tenant_super_admin no encontrado.';
  END IF;

  -- Hashear la contraseña (sin cambios)
  SELECT public.crypt(p_password, public.gen_salt('bf')) INTO v_hashed_password;

  -- Insertar el nuevo usuario (REFACTORIZADO)
  -- Se inserta solo la identidad en 'users'.
  INSERT INTO public.users (email, password_hash)
  VALUES (p_email, v_hashed_password)
  RETURNING id INTO v_user_id;

  -- Crear la asignación en la nueva tabla (NUEVO)
  INSERT INTO public.user_assignments (user_id, tenant_id, role_id)
  VALUES (v_user_id, p_tenant_id, v_role_id);

END;
$$;

-- Permisos no necesitan cambiarse.
GRANT EXECUTE ON FUNCTION public.create_tenant_admin(uuid, text, text) TO authenticated;
