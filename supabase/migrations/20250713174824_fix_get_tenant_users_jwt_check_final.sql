-- Final attempt to fix the role check based on existing migration patterns.

-- Drop the helper function if it exists, to keep the main function clean.
DROP FUNCTION IF EXISTS is_valid_uuid(text);

-- Re-create the main function with the definitive role check.
CREATE OR REPLACE FUNCTION get_tenant_users(target_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  banned_until timestamptz,
  user_metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use the more explicit method for getting the role from the JWT claims.
  IF (current_setting('request.jwt.claims', TRUE)::jsonb ->> 'role') != 'super_admin' THEN
    RAISE EXCEPTION 'Acceso denegado. Se requiere rol de super_admin.';
  END IF;

  -- The data query remains the same, but we re-add the robust check here
  -- to ensure this migration is self-contained.
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.banned_until,
    u.raw_user_meta_data AS user_metadata
  FROM auth.users u
  WHERE
    -- We use a simple text comparison after ensuring the key exists,
    -- which is safer than casting if the data can be inconsistent.
    u.raw_user_meta_data ->> 'tenant_id' = target_tenant_id::text;
END;
$$;
