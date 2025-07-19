-- Implementar la arquitectura final y correcta para el envío de correos, 100% en la base de datos.

-- 1. Crear la función trabajadora con la lógica de refresco y envío síncrono.
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
    v_integration RECORD;
    v_access_token TEXT;
    v_refresh_token TEXT;
    v_encryption_key TEXT;
    v_google_client_id TEXT;
    v_google_client_secret TEXT;
    v_request_id BIGINT;
    v_response RECORD;
    v_response_body JSONB;
    v_mime_message TEXT;
    v_base64_mime TEXT;
    v_request_body JSONB;
BEGIN
    -- Obtener la integración de Gmail del superadmin
    SELECT * INTO v_integration
    FROM public.tenant_integrations
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND provider = 'google_gmail'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No se encontró la integración de google_gmail para el superadmin.');
    END IF;

    v_access_token := v_integration.access_token;

    -- Lógica de Refresco de Token si es necesario
    IF v_integration.expires_at IS NULL OR v_integration.expires_at < now() THEN
        -- Obtener secretos
        SELECT decrypted_secret INTO v_google_client_id FROM vault.decrypted_secrets WHERE name = 'google_client_id';
        SELECT decrypted_secret INTO v_google_client_secret FROM vault.decrypted_secrets WHERE name = 'google_client_secret';
        SELECT decrypted_secret INTO v_encryption_key FROM vault.decrypted_secrets WHERE name = 'glamtica_encryption_key';

        -- Desencriptar el refresh token
        v_refresh_token := pgp_sym_decrypt(v_integration.encrypted_refresh_token, v_encryption_key);

        -- Enviar la solicitud de refresco
        v_request_id := net.http_post(
            url:= 'https://oauth2.googleapis.com/token',
            body:= jsonb_build_object(
                'client_id', v_google_client_id,
                'client_secret', v_google_client_secret,
                'refresh_token', v_refresh_token,
                'grant_type', 'refresh_token'
            ),
            headers:= '{"Content-Type": "application/json"}'::jsonb
        );

        -- Esperar y recoger la respuesta
        SELECT * INTO v_response FROM net.http_collect_response(v_request_id, async:=false);
        v_response_body := v_response.body::jsonb;

        IF v_response.status_code != 200 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Error al refrescar token: ' || (v_response_body->>'error_description'));
        END IF;

        v_access_token := v_response_body->>'access_token';

        -- Actualizar la tabla con el nuevo token
        UPDATE public.tenant_integrations
        SET
            access_token = v_access_token,
            expires_at = now() + ((v_response_body->>'expires_in')::INT * interval '1 second')
        WHERE id = v_integration.id;
    END IF;

    -- Construir y enviar el correo
    v_mime_message := 'From: ' || v_integration.account_email || E'\r\n' ||
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
    
    SELECT * INTO v_response FROM net.http_collect_response(v_request_id, async:=false);
    v_response_body := v_response.body::jsonb;

    IF v_response.status_code = 200 AND v_response_body ? 'id' THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Error en la API de Gmail: ' || (v_response_body->'error'->>'message'));
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'Excepción en send_email_via_gmail_api: ' || SQLERRM);
END;
$$;

-- 2. Recrear la función orquestadora
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
    v_send_result JSONB;
    -- ... (otras declaraciones sin cambios)
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

-- 3. Recrear la función de prueba
CREATE OR REPLACE FUNCTION public.trigger_test_email_for_tenant(
    p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_super_admin_user RECORD;
    v_full_name TEXT;
BEGIN
    -- Encontrar al super_admin del sistema
    SELECT u.id, u.first_name, u.last_name INTO v_super_admin_user
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE r.name = 'super_admin'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No se encontró al usuario super_admin del sistema.');
    END IF;

    -- Construir el nombre completo
    v_full_name := TRIM(COALESCE(v_super_admin_user.first_name, '') || ' ' || COALESCE(v_super_admin_user.last_name, ''));
    IF v_full_name = '' THEN
        v_full_name := 'Super Administrador';
    END IF;

    -- Llamar a la función principal de envío de correos
    PERFORM public.trigger_system_email(
        p_recipient_user_id := v_super_admin_user.id,
        p_template_type := 'WELCOME_USER',
        p_template_data := jsonb_build_object('user_name', v_full_name)
    );

    RETURN jsonb_build_object('success', true, 'message', 'El correo de prueba ha sido puesto en la cola de envío.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$;