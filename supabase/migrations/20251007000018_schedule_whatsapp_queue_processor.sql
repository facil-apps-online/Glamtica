-- 1. Create the wrapper function to invoke the Edge Function.
CREATE OR REPLACE FUNCTION public.invoke_process_whatsapp_queue()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://vtfsbogpkrcbfuhhoepf.supabase.co/functions/v1/process-whatsapp-queue',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZnNib2dwa3JjYmZ1aGhvZXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI4NTQ2NCwiZXhwIjoyMDY1ODYxNDY0fQ.k3oSZ5G7LxRm4VByrTZEo8EjS7woGmVWGNXbEQ4Vbqg'
        ),
        body := '{}'::jsonb -- Body is empty as the function doesn't expect a payload
    );
END;
$$;

-- 2. Schedule the wrapper function to run every minute.
-- We use a unique name to be able to unschedule it later if needed.
SELECT cron.schedule(
    'process-whatsapp-queue-job',
    '*/1 * * * *',
    $$ SELECT public.invoke_process_whatsapp_queue(); $$
);

-- Note: To unschedule, run: SELECT cron.unschedule('process-whatsapp-queue-job');
-- Note: To see scheduled jobs, run: SELECT * FROM cron.job;
