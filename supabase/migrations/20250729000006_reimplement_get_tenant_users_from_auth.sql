-- Migration to correctly implement the get_tenant_users RPC function.
-- This version queries the native Supabase `auth.users` table and unnests the `assignments`
-- array from the `raw_app_meta_data` JSONB field to find users associated with a specific tenant.
-- This aligns with the current architecture where a separate `user_assignments` table no longer exists.

-- Drop the previous, incorrect versions of the function.
DROP FUNCTION IF EXISTS get_tenant_users(uuid, text);
DROP FUNCTION IF EXISTS get_tenant_users(uuid);

CREATE OR REPLACE FUNCTION get_tenant_users(
  target_tenant_id uuid
)
RETURNS TABLE (
  user_id uuid,
  email text,
  -- The raw_app_meta_data contains first_name and last_name
  first_name text,
  last_name text,
  -- We return all assignments for the found users, not just one role
  assignments jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER -- Important for querying auth.users
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email,
    u.raw_app_meta_data->>'first_name' as first_name,
    u.raw_app_meta_data->>'last_name' as last_name,
    u.raw_app_meta_data->'assignments' as assignments
  FROM
    auth.users u,
    -- Unnest the assignments array for each user
    jsonb_to_recordset(u.raw_app_meta_data->'assignments') as user_assignment(tenant_id uuid)
  WHERE
    -- Filter where at least one assignment matches the target tenant
    user_assignment.tenant_id = target_tenant_id;
END;
$$;
