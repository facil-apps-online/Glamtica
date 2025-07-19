-- Crear una función RPC simple para invocar la Edge Function de envío de correo.
CREATE OR REPLACE FUNCTION public.trigger_test_email()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_super_admin_user_id UUID;
    v_response JSONB;
    v_supabase_url TEXT;
    v_service_role_key TEXT;
BEGIN
    -- 1. Encontrar al super_admin del sistema
    SELECT id INTO v_super_admin_user_id
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE r.name = 'super_admin'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No se encontró al usuario super_admin del sistema.');
    END IF;

    -- 2. Obtener secretos para invocar la Edge Function
    SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url';
    SELECT decrypted_secret INTO v_service_role_key FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';

    -- 3. Invocar la Edge Function
    SELECT content INTO v_response FROM net.http_post(
        url:= v_supabase_url || '/functions/v1/send-system-email',
        body:= jsonb_build_object(
            'userId', v_super_admin_user_id,
            'templateType', 'WELCOME_USER',
            'templateData', jsonb_build_object('user_name', 'Super Admin (Prueba)')
        ),
        headers:= jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
        )
    );

    RETURN v_response;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error inesperado en la RPC: ' || SQLERRM);
END;
$$;
