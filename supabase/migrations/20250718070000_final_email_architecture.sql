-- Implementar la arquitectura final de envío de correos con refresco de token vía Edge Function.

-- 1. Limpiar las funciones antiguas para una implementación limpia.
DROP FUNCTION IF EXISTS public.trigger_system_email(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS private.send_email_via_gmail_api(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS private.refresh_and_get_gmail_token(); -- Limpiar por si acaso

-- 2. Crear la función "gestora de tokens" que desencripta e invoca la Edge Function.
CREATE OR REPLACE FUNCTION private.refresh_and_get_gmail_token()
RETURNS TEXT -- Devuelve un access_token fresco
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
    v_integration RECORD;
    v_access_token TEXT;
    v_refresh_token TEXT;
    v_encryption_key TEXT;
    v_refresh_response JSONB;
    v_supabase_url TEXT;
    v_service_role_key TEXT;
    v_edge_function_url TEXT;
BEGIN
    -- Obtener la integración de Gmail del superadmin
    SELECT * INTO v_integration
    FROM public.tenant_integrations
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND provider = 'google_gmail'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la integración de google_gmail para el superadmin.';
    END IF;

    v_access_token := v_integration.access_token;

    -- Lógica de Refresco de Token si es necesario
    IF v_integration.expires_at IS NULL OR v_integration.expires_at < now() THEN
        -- Obtener secretos necesarios
        SELECT decrypted_secret INTO v_encryption_key FROM vault.decrypted_secrets WHERE name = 'glamtica_encryption_key';
        SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url';
        SELECT decrypted_secret INTO v_service_role_key FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
        
        v_edge_function_url := v_supabase_url || '/functions/v1/refresh-google-token';

        -- Desencriptar el refresh token
        v_refresh_token := pgp_sym_decrypt(v_integration.encrypted_refresh_token, v_encryption_key);

        -- Invocar la Edge Function para obtener un nuevo token de acceso
        SELECT content INTO v_refresh_response FROM net.http_post(
            url:= v_edge_function_url,
            body:= jsonb_build_object('refreshToken', v_refresh_token),
            headers:= jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            )
        );
        
        IF v_refresh_response->>'access_token' IS NULL THEN
            RAISE EXCEPTION 'Error al refrescar token desde Edge Function: %', (v_refresh_response->>'error');
        END IF;

        v_access_token := v_refresh_response->>'access_token';

        -- Actualizar la tabla con el nuevo token y la nueva fecha de expiración
        UPDATE public.tenant_integrations
        SET
            access_token = v_access_token,
            expires_at = now() + ((v_refresh_response->>'expires_in')::INT * interval '1 second')
        WHERE id = v_integration.id;
    END IF;

    RETURN v_access_token;
END;
$$;

-- 3. Crear la función "trabajadora" de envío, ahora simplificada.
CREATE OR REPLACE FUNCTION private.send_email_via_gmail_api(
    p_recipient_email TEXT,
    p_subject TEXT,
    p_body_html TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
    v_access_token TEXT;
    v_sender_email TEXT;
    v_mime_message TEXT;
    v_base64_mime TEXT;
    v_request_body JSONB;
    v_request_id BIGINT;
BEGIN
    -- Obtener un token fresco y listo para usar
    v_access_token := private.refresh_and_get_gmail_token();
    
    -- Obtener el email del remitente
    SELECT account_email INTO v_sender_email
    FROM public.tenant_integrations
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND provider = 'google_gmail'
    LIMIT 1;

    -- Construir y enviar el correo
    v_mime_message := 'From: ' || v_sender_email || E'\r\n' ||
                      'To: ' || p_recipient_email || E'\r\n' ||
                      'Subject: ' || p_subject || E'\r\n' ||
                      'Content-Type: text/html; charset=UTF-8' || E'\r\n\r\n' ||
                      p_body_html;

    v_base64_mime := encode(convert_to(v_mime_message, 'UTF8'), 'base64');
    v_request_body := jsonb_build_object('raw', v_base64_mime);

    v_request_id := net.http_post(
        url:= 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        body:= v_request_body,
        headers:= jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_access_token
        )
    );

    RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'Excepción en send_email_via_gmail_api: ' || SQLERRM);
END;
$$;

-- 4. Recrear la función orquestadora final.
CREATE OR REPLACE FUNCTION public.trigger_system_email(
    p_recipient_user_id UUID,
    p_template_type TEXT,
    p_template_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recipient_email TEXT;
    v_language_id UUID;
    v_tenant_id UUID;
    v_template_id UUID;
    v_template_subject TEXT;
    v_template_body_html TEXT;
    v_processed_subject TEXT;
    v_processed_body_html TEXT;
    v_is_tenant_sending_active BOOLEAN;
    v_key TEXT;
    v_value TEXT;
    v_default_language_id UUID;
    v_send_result JSONB;
BEGIN
    SELECT id INTO v_default_language_id FROM public.languages WHERE iso_code = 'es-CO';

    SELECT u.email, COALESCE(u.language_id, v_default_language_id), u.tenant_id
    INTO v_recipient_email, v_language_id, v_tenant_id
    FROM public.users u
    WHERE u.id = p_recipient_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, status, error_message)
        VALUES ('00000000-0000-0000-0000-000000000000', 'unknown_user', 'FAILED', 'Recipient user with ID ' || p_recipient_user_id || ' not found.');
        RETURN;
    END IF;

    IF v_tenant_id IS NOT NULL THEN
        SELECT is_active INTO v_is_tenant_sending_active
        FROM public.tenant_template_settings
        WHERE tenant_id = v_tenant_id AND template_type = p_template_type;

        IF v_is_tenant_sending_active IS NULL OR v_is_tenant_sending_active = false THEN
            IF p_template_type NOT IN ('WELCOME_USER', 'PASSWORD_RESET') THEN
                RETURN;
            END IF;
        END IF;
    END IF;

    SELECT id, subject, body_html INTO v_template_id, v_template_subject, v_template_body_html
    FROM public.email_templates
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND template_type = p_template_type
      AND language_id = v_language_id
      AND is_active = true;

    IF NOT FOUND THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, status, error_message)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), v_recipient_email, 'FAILED', 'Active master template not found for type ' || p_template_type || ' and language_id ' || v_language_id);
        RETURN;
    END IF;

    v_processed_subject := v_template_subject;
    v_processed_body_html := v_template_body_html;

    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_template_data)
    LOOP
        v_processed_subject := replace(v_processed_subject, '{{' || v_key || '}}', v_value);
        v_processed_body_html := replace(v_processed_body_html, '{{' || v_key || '}}', v_value);
    END LOOP;

    v_send_result := private.send_email_via_gmail_api(v_recipient_email, v_processed_subject, v_processed_body_html);

    IF (v_send_result->>'success')::BOOLEAN THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), v_recipient_email, v_template_id, 'SENT');
    ELSE
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status, error_message)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), v_recipient_email, v_template_id, 'FAILED', v_send_result->>'error');
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status, error_message)
        VALUES ('00000000-0000-0000-0000-000000000000', COALESCE(v_recipient_email, 'unknown'), v_template_id, 'FAILED', SQLERRM);
END;
$$;