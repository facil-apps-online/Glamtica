-- Corregir la llamada a http_post para usar net.http_post con la firma correcta y recrear la función dependiente.

-- 1. Eliminar las funciones existentes para poder modificarlas sin problemas de dependencias.
DROP FUNCTION IF EXISTS public.trigger_system_email(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS private.send_email_via_gmail_api(TEXT, TEXT, TEXT);


-- 2. Crear la función trabajadora con la llamada a net.http_post correcta.
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
    v_sender_email TEXT;
    v_mime_message TEXT;
    v_base64_mime TEXT;
    v_request_body JSONB;
    v_request_id BIGINT;
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

    -- Usar los campos correctos de la tabla
    v_access_token := v_integration.access_token;
    v_sender_email := v_integration.account_email;

    -- Construir el mensaje en formato MIME
    v_mime_message := 'From: ' || v_sender_email || E'\r\n' ||
                      'To: ' || p_recipient_email || E'\r\n' ||
                      'Subject: ' || p_subject || E'\r\n' ||
                      'Content-Type: text/html; charset=UTF-8' || E'\r\n\r\n' ||
                      p_body_html;

    v_base64_mime := encode(convert_to(v_mime_message, 'UTF8'), 'base64');
    v_request_body := jsonb_build_object('raw', v_base64_mime);

    -- Enviar el correo usando la firma net.http_post(url, body, params, headers)
    v_request_id := net.http_post(
        url:= 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        body:= v_request_body,
        headers:= jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_access_token
        )
    );

    -- La función net.http_post es asíncrona y solo devuelve un ID.
    -- Para esta prueba, asumiremos que si no hay una excepción, la solicitud se puso en cola correctamente.
    RETURN jsonb_build_object('success', true, 'request_id', v_request_id);

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'Excepción en send_email_via_gmail_api: ' || SQLERRM);
END;
$$;


-- 3. Recrear la función orquestadora que depende de la anterior.
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