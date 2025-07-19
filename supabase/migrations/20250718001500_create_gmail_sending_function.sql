CREATE SCHEMA IF NOT EXISTS private;

-- =================================================================
-- PARTE 1: La nueva función "trabajadora" para enviar correos
-- =================================================================
CREATE OR REPLACE FUNCTION private.send_email_via_gmail_api(
    p_recipient_email TEXT,
    p_subject TEXT,
    p_body_html TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
    v_integration RECORD;
    v_access_token TEXT;
    v_refresh_response JSONB;
    v_sender_email TEXT;
    v_mime_message TEXT;
    v_base64_mime TEXT;
    v_request_body JSONB;
    v_response JSONB;
    v_google_client_id TEXT;
    v_google_client_secret TEXT;
BEGIN
    -- Obtener las credenciales de Gmail del superadmin (tenant 0)
    SELECT * INTO v_integration
    FROM public.tenant_integrations
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND provider = 'google_gmail'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE WARNING 'No se encontró la integración de google_gmail para el superadmin.';
        RETURN FALSE;
    END IF;

    v_access_token := v_integration.credentials->>'access_token';
    v_sender_email := v_integration.metadata->>'email';

    -- Lógica de Refresco de Token si ha expirado
    IF v_integration.expires_at < now() THEN
        SELECT decrypted_secret INTO v_google_client_id FROM vault.decrypted_secrets WHERE name = 'google_client_id';
        SELECT decrypted_secret INTO v_google_client_secret FROM vault.decrypted_secrets WHERE name = 'google_client_secret';

        SELECT content INTO v_refresh_response FROM http_post(
            'https://oauth2.googleapis.com/token',
            jsonb_build_object(
                'client_id', v_google_client_id,
                'client_secret', v_google_client_secret,
                'refresh_token', v_integration.credentials->>'refresh_token',
                'grant_type', 'refresh_token'
            ),
            'application/json'
        );

        v_access_token := v_refresh_response->>'access_token';

        -- Actualizar las credenciales en la base de datos con el nuevo token
        UPDATE public.tenant_integrations
        SET
            credentials = credentials || jsonb_build_object('access_token', v_access_token),
            expires_at = now() + ((v_refresh_response->>'expires_in')::INT * interval '1 second')
        WHERE id = v_integration.id;
    END IF;

    -- Construir el mensaje en formato MIME
    v_mime_message := 'From: ' || v_sender_email || E'\r\n' ||
                      'To: ' || p_recipient_email || E'\r\n' ||
                      'Subject: ' || p_subject || E'\r\n' ||
                      'Content-Type: text/html; charset=UTF-8' || E'\r\n\r\n' ||
                      p_body_html;

    v_base64_mime := encode(convert_to(v_mime_message, 'UTF8'), 'base64');
    v_request_body := jsonb_build_object('raw', v_base64_mime);

    -- Enviar el correo a través de la API de Gmail
    SELECT content INTO v_response FROM http_post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        v_request_body,
        'application/json',
        jsonb_build_object('Authorization', 'Bearer ' || v_access_token)
    );

    -- Verificar si la respuesta contiene un 'id', lo que indica éxito
    IF v_response ? 'id' THEN
        RETURN TRUE;
    ELSE
        RAISE WARNING 'Error al enviar correo vía Gmail API: %', v_response;
        RETURN FALSE;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Excepción en send_email_via_gmail_api: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- =================================================================
-- PARTE 2: Actualizar la función "orquestadora" para que use la nueva
-- =================================================================
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
    v_send_success BOOLEAN;
BEGIN
    SELECT id INTO v_default_language_id FROM public.languages WHERE iso_code = 'es-CO';

    SELECT u.email, COALESCE(us.language_id, ts.language_id, v_default_language_id), u.tenant_id
    INTO v_recipient_email, v_language_id, v_tenant_id
    FROM public.users u
    LEFT JOIN public.user_settings us ON u.id = us.user_id
    LEFT JOIN public.tenant_settings ts ON u.tenant_id = ts.tenant_id
    WHERE u.id = p_recipient_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, status, error_message)
        VALUES ('00000000-0000-0000-0000-000000000000', 'unknown_user', 'FAILED', 'Recipient user with ID ' || p_recipient_user_id || ' not found.');
        RETURN;
    END IF;

    SELECT is_active INTO v_is_tenant_sending_active
    FROM public.tenant_template_settings
    WHERE tenant_id = v_tenant_id AND template_type = p_template_type;

    IF NOT v_is_tenant_sending_active THEN
        RETURN;
    END IF;

    SELECT id, subject, body_html INTO v_template_id, v_template_subject, v_template_body_html
    FROM public.email_templates
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
      AND template_type = p_template_type
      AND language_id = v_language_id
      AND is_active = true;

    IF NOT FOUND THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, status, error_message)
        VALUES (v_tenant_id, v_recipient_email, 'FAILED', 'Active master template not found for type ' || p_template_type || ' and language_id ' || v_language_id);
        RETURN;
    END IF;

    v_processed_subject := v_template_subject;
    v_processed_body_html := v_template_body_html;

    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_template_data)
    LOOP
        v_processed_subject := replace(v_processed_subject, '{{' || v_key || '}}', v_value);
        v_processed_body_html := replace(v_processed_body_html, '{{' || v_key || '}}', v_value);
    END LOOP;

    -- Llamada a la función de envío real
    v_send_success := private.send_email_via_gmail_api(v_recipient_email, v_processed_subject, v_processed_body_html);

    -- Registrar el resultado real
    IF v_send_success THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status)
        VALUES (v_tenant_id, v_recipient_email, v_template_id, 'SENT');
    ELSE
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status, error_message)
        VALUES (v_tenant_id, v_recipient_email, v_template_id, 'FAILED', 'Email sending failed via Gmail API. Check function logs.');
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status, error_message)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), COALESCE(v_recipient_email, 'unknown'), v_template_id, 'FAILED', SQLERRM);
END;
$$;
