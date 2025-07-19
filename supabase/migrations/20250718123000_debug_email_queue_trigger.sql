-- Hacer el trigger a prueba de balas y con logs de depuración.

-- Primero, eliminamos el trigger y la función existentes para asegurar una actualización limpia.
DROP TRIGGER IF EXISTS on_new_email_job ON public.email_queue;
DROP FUNCTION IF EXISTS private.notify_email_queue_worker();

-- Luego, creamos la función mejorada con advertencias explícitas.
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

    -- Depuración: Lanzar una advertencia si falta algún secreto
    IF v_supabase_url IS NULL THEN
        RAISE WARNING '[notify_email_queue_worker] El secreto "supabase_url" no fue encontrado en la bóveda.';
    END IF;
    
    IF v_service_role_key IS NULL THEN
        RAISE WARNING '[notify_email_queue_worker] El secreto "supabase_service_role_key" no fue encontrado en la bóveda.';
    END IF;

    -- Si faltan secretos, no intentar la llamada HTTP
    IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
        RETURN NEW;
    END IF;

    -- Intentar la llamada HTTP
    BEGIN
        PERFORM net.http_post(
            url:= v_supabase_url || '/functions/v1/process-email-queue',
            body:= jsonb_build_object('record', NEW),
            headers:= jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            )
        );
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '[notify_email_queue_worker] Falló la llamada net.http_post: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- Finalmente, volvemos a crear el trigger.
CREATE TRIGGER on_new_email_job
AFTER INSERT ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION private.notify_email_queue_worker();
