-- This migration ensures any previous, potentially incorrect, versions of the function are removed.
DROP FUNCTION IF EXISTS public.update_user_active_status(uuid, boolean, text);
