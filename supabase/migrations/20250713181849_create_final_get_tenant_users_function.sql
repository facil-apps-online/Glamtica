-- Primero, limpiamos cualquier versión anterior de la función para evitar conflictos.
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid);

-- Crear la versión final y correcta de la función
CREATE OR REPLACE FUNCTION public.get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
)
RETURNS TABLE (
  id uuid,
  email text,
  role_name text,
  is_active boolean,
  created_at timestamptz,
  tenant_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Paso 1: Comprobar si el rol del usuario que llama es 'super_admin'
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- Paso 2: Ejecutar la consulta que ya hemos validado
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    r.name as role_name,
    u.is_active,
    u.created_at,
    u.tenant_id
  FROM
    public.users u
  JOIN
    public.roles r ON u.role_id = r.id
  WHERE
    u.tenant_id = target_tenant_id;
END;
$$;
