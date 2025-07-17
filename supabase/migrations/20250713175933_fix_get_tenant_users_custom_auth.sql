-- This version adapts the function to the project's custom authentication system.
-- Instead of relying on auth.jwt(), it accepts the user's role as a parameter.

CREATE OR REPLACE FUNCTION get_tenant_users(
  target_tenant_id uuid,
  p_user_role TEXT
)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  banned_until timestamptz,
  user_metadata jsonb
)
LANGUAGE plpgsql
-- SECURITY DEFINER is no longer strictly necessary as we don't rely on the definer's JWT
-- but we keep it in case the function needs to access protected tables in the future.
SECURITY DEFINER
AS $$
BEGIN
  -- The role check is now performed against the passed parameter.
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- The data query remains the same.
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.banned_until,
    u.raw_user_meta_data AS user_metadata
  FROM auth.users u
  WHERE
    u.raw_user_meta_data ->> 'tenant_id' = target_tenant_id::text;
END;
$$;
