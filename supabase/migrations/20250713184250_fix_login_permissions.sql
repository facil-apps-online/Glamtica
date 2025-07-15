-- This migration restores the public execute permission to the login_user function,
-- which was accidentally removed in a previous migration.

GRANT EXECUTE ON FUNCTION public.login_user(p_email TEXT, p_password TEXT) TO public;
