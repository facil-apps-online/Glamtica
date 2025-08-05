-- supabase/migrations/20250802000023_create_check_user_exists_in_auth_rpc.sql
CREATE OR REPLACE FUNCTION public.check_user_exists_in_auth_rpc(p_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) INTO user_exists;
  RETURN user_exists;
END;
$function$;

-- Grant permissions to authenticated users to execute this function
GRANT EXECUTE ON FUNCTION public.check_user_exists_in_auth_rpc(text) TO authenticated;