-- This migration adds debugging notices to the create_recovery_link function.

CREATE OR REPLACE FUNCTION create_recovery_link(
  p_user_email TEXT,
  p_user_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response JSON;
  request_id BIGINT;
  project_url TEXT;
  service_role_key TEXT;
BEGIN
  RAISE NOTICE '[create_recovery_link] Starting for email: %', p_user_email;

  IF p_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied. Super admin role required.';
  END IF;

  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
  SELECT decrypted_secret INTO service_role_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  RAISE NOTICE '[create_recovery_link] Project URL from vault: %', project_url;
  RAISE NOTICE '[create_recovery_link] Service Role Key from vault (is null?): %', service_role_key IS NULL;

  IF project_url IS NULL OR service_role_key IS NULL THEN
      RAISE EXCEPTION 'URL or Service Role Key not configured in Vault.';
  END IF;

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
  RAISE NOTICE '[create_recovery_link] HTTP request sent. Request ID: %', request_id;

  SELECT
      content::json
  INTO
      response
  FROM
      net.http_collect_response(request_id, timeout_milliseconds := 2000);
  RAISE NOTICE '[create_recovery_link] HTTP response received: %', response;

  RETURN json_build_object('recoveryLink', response -> 'action_link');

END;
$$;
