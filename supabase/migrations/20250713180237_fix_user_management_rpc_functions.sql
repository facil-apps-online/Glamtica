-- 1. Corregir la función para obtener usuarios, apuntando a las tablas correctas.
DROP FUNCTION IF EXISTS get_tenant_users(uuid, text);
CREATE OR REPLACE FUNCTION get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
)
RETURNS TABLE (
  id uuid,
  email text,
  role_name text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- La comprobación de seguridad sigue siendo la misma
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- La consulta ahora une las tablas correctas: public.users y public.roles
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    r.name as role_name,
    u.is_active,
    u.created_at
  FROM
    public.users u
  JOIN
    public.roles r ON u.role_id = r.id
  WHERE
    u.tenant_id = target_tenant_id;
END;
$$;

-- 2. Crear la nueva función para actualizar el estado del usuario
CREATE OR REPLACE FUNCTION update_user_active_status(
  target_user_id uuid,
  p_is_active boolean,
  p_user_role TEXT
)
RETURNS JSON AS $$
BEGIN
  -- Comprobación de seguridad
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- Actualizar la tabla public.users
  UPDATE public.users
  SET is_active = p_is_active
  WHERE id = target_user_id;

  -- Devolver una confirmación
  RETURN json_build_object('success', TRUE, 'message', 'Estado del usuario actualizado correctamente.');
END;
$$ LANGUAGE plpgsql;