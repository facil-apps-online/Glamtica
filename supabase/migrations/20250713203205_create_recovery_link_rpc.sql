-- This migration creates an RPC function to generate a password recovery link.
-- It uses pg_net to call the Supabase management API from within the database.

-- Enable pg_net if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the function
CREATE OR REPLACE FUNCTION create_recovery_link(
  p_user_email TEXT,
  p_user_role TEXT
)
RETURNS JSON AS $$
DECLARE
  response JSON;
  request_id BIGINT;
  project_url TEXT;
  service_role_key TEXT;
BEGIN
  -- 1. Security Check
  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied. Super admin role required.';
  END IF;

  -- 2. Get secrets from Supabase Vault
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
  SELECT decrypted_secret INTO service_role_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';

  IF project_url IS NULL OR service_role_key IS NULL THEN
      RAISE EXCEPTION 'URL or Service Role Key not configured in Vault.';
  END IF;

  -- 3. Make the HTTP request to the Supabase management API
  SELECT
      id
  INTO
      request_id
  FROM
      net.http_post(
          url := project_url || '/auth/v1/admin/generate_link',
          headers := jsonb_build_object(
              'apikey', service_role_key,
              'Authorization', 'Bearer ' || service_role_key,
              'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
              'type', 'recovery',
              'email', p_user_email
          )
      );

  -- 4. Get the response
  SELECT
      content::json
  INTO
      response
  FROM
      net.http_collect_response(request_id, timeout_milliseconds := 2000);

  -- 5. Return the relevant part of the response
  RETURN json_build_object('recoveryLink', response -> 'action_link');

END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_recovery_link(TEXT, TEXT) TO public;
