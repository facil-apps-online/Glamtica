-- Paso 3.1: Modificar la función get_tenant_users para que devuelva el nuevo campo 'status'
-- y el 'assignment_id' desde la tabla user_assignments.

DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);

CREATE OR REPLACE FUNCTION public.get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
)
RETURNS TABLE (
  assignment_id uuid,
  user_id uuid,
  email text,
  role_name text,
  branch_name text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- La lógica de permisos se mantiene: denegar solo a tenant_user
  IF p_user_role = 'tenant_user' THEN
    RAISE EXCEPTION 'Access denied. Role tenant_user cannot perform this action.';
  END IF;

  -- La consulta ahora incluye el id de la asignación y su estado
  RETURN QUERY
  SELECT
    ua.id as assignment_id,
    u.id as user_id,
    u.email,
    r.name as role_name,
    b.name as branch_name,
    ua.status
  FROM
    public.user_assignments ua
  JOIN
    public.users u ON ua.user_id = u.id
  JOIN
    public.roles r ON ua.role_id = r.id
  LEFT JOIN
    public.branches b ON ua.branch_id = b.id
  WHERE
    ua.tenant_id = target_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_users(uuid, text) TO authenticated;
