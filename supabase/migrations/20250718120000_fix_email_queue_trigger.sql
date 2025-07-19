-- Corregir el trigger para que busque el secreto 'supabase_url' correctamente y sea más robusto.

-- Primero, eliminamos el trigger y la función existentes para asegurar una actualización limpia.
DROP TRIGGER IF EXISTS on_new_email_job ON public.email_queue;
DROP FUNCTION IF EXISTS private.notify_email_queue_worker();

-- Luego, creamos la función corregida.
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

    -- Verificar que los secretos no sean nulos antes de hacer la llamada
    IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
        RAISE WARNING 'supabase_url o supabase_service_role_key no se encontraron en la bóveda. No se puede invocar a la Edge Function.';
        RETURN NEW;
    END IF;

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

-- Finalmente, volvemos a crear el trigger.
CREATE TRIGGER on_new_email_job
AFTER INSERT ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION private.notify_email_queue_worker();
