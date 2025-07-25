-- Modificar la función get_tenant_users para que devuelva también
-- el nombre y apellido del usuario, además de su email.

DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);

CREATE OR REPLACE FUNCTION public.get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
)
RETURNS TABLE (
  assignment_id uuid,
  user_id uuid,
  email text,
  first_name text, -- <-- CAMPO AÑADIDO
  last_name text,  -- <-- CAMPO AÑADIDO
  role_name text,
  branch_name text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_role = 'tenant_user' THEN
    RAISE EXCEPTION 'Access denied. Role tenant_user cannot perform this action.';
  END IF;

  RETURN QUERY
  SELECT
    ua.id as assignment_id,
    u.id as user_id,
    u.email,
    u.first_name, -- <-- CAMPO AÑADIDO
    u.last_name,  -- <-- CAMPO AÑADIDO
    r.name as role_name,
    b.name as branch_name,
    ua.status
  FROM
    public.user_assignments ua
  JOIN
    public.users u ON ua.user_id = u.id
  LEFT JOIN -- Usamos LEFT JOIN para roles y sucursales en caso de que sean nulos (pending_configuration)
    public.roles r ON ua.role_id = r.id
  LEFT JOIN
    public.branches b ON ua.branch_id = b.id
  WHERE
    ua.tenant_id = target_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_users(uuid, text) TO authenticated;
