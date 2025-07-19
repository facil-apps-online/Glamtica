-- Crear un trigger que invoque a la Edge Function 'process-email-queue'
-- cada vez que se inserte una nueva fila en la tabla 'email_queue'.

CREATE OR REPLACE FUNCTION private.notify_email_queue_worker()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- Obtener secretos para invocar la Edge Function
    SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url';
    SELECT decrypted_secret INTO v_service_role_key FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';

    PERFORM net.http_post(
        url:= v_supabase_url || '/functions/v1/process-email-queue',
        body:= jsonb_build_object('record', NEW),
        headers:= jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
        )
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_email_job
AFTER INSERT ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION private.notify_email_queue_worker();
