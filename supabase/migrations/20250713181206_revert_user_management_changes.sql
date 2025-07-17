-- This migration reverts all the user management functions and roles added.

-- Drop the RPC functions, checking if they exist first.
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid, text);
DROP FUNCTION IF EXISTS public.get_tenant_users(uuid);
DROP FUNCTION IF EXISTS public.update_user_active_status(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.is_valid_uuid(text);

-- Drop the database-level roles, checking if they exist first.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'super_admin') THEN
    DROP ROLE super_admin;
  END IF;
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_super_admin') THEN
    DROP ROLE tenant_super_admin;
  END IF;
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_admin') THEN
    DROP ROLE tenant_admin;
  END IF;
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_user') THEN
    DROP ROLE tenant_user;
  END IF;
END
$$;
