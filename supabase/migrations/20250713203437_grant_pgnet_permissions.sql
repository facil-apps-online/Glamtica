-- This migration grants the necessary permissions for the public role
-- to use the pg_net extension, which is required by the 
-- create_recovery_link function.

GRANT USAGE ON SCHEMA net TO public;
