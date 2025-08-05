-- supabase/migrations/20250802000022_create_get_user_by_email_in_auth_rpc.sql
CREATE OR REPLACE FUNCTION public.get_user_by_email_in_auth(p_email text)
 RETURNS TABLE (
  id uuid,
  aud text,
  role text,
  email text,
  email_confirmed_at timestamptz,
  phone text,
  confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_anonymous boolean,
  created_at timestamptz,
  updated_at timestamptz
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.aud,
    u.role,
    u.email,
    u.email_confirmed_at,
    u.phone,
    u.confirmed_at,
    u.last_sign_in_at,
    u.raw_app_meta_data, -- Incluir raw_app_meta_data
    u.raw_user_meta_data, -- Incluir raw_user_meta_data
    u.is_anonymous,
    u.created_at,
    u.updated_at
  FROM auth.users u
  WHERE u.email = p_email;
END;
$function$;

-- Grant permissions to authenticated users to execute this function
GRANT EXECUTE ON FUNCTION public.get_user_by_email_in_auth(text) TO authenticated;