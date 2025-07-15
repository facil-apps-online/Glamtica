-- This migration creates the database-level roles that the application logic expects to exist.
-- This aligns the application's role system with the database's security identifier system.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'super_admin') THEN
    CREATE ROLE super_admin;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_super_admin') THEN
    CREATE ROLE tenant_super_admin;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_admin') THEN
    CREATE ROLE tenant_admin;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_user') THEN
    CREATE ROLE tenant_user;
  END IF;
END
$$;
