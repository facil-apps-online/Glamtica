-- 1. Drop the trigger from auth.users
DROP TRIGGER IF EXISTS on_auth_user_changed ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.sync_public_user();
