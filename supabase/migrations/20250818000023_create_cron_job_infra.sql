-- 1. Create a schema for private data
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Create a table to store secrets securely
CREATE TABLE IF NOT EXISTS private.secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 3. Grant permissions to the schema and table
-- Only postgres and service_role can access the secrets
GRANT USAGE ON SCHEMA private TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE private.secrets TO postgres, service_role;
REVOKE ALL ON TABLE private.secrets FROM anon, authenticated;

-- 4. Create the security definer function to invoke cron jobs
CREATE OR REPLACE FUNCTION invoke_cron_job(job_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT;
BEGIN
  -- Read the service_role_key from the private.secrets table
  SELECT value INTO service_key FROM private.secrets WHERE key = 'SERVICE_ROLE_KEY';

  -- Perform the HTTP POST request to the cron-jobs Edge Function
  PERFORM net.http_post(
    url:='https://vtfsbogpkrcbfuhhoepf.supabase.co/functions/v1/cron-jobs',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body:=jsonb_build_object('job_name', job_name)
  );
END;
$$;
