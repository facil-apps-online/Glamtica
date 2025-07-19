-- Fase 2: Lógica Central - Función para Disparar Correos del Sistema
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
BEGIN
    -- Obtener el ID del idioma por defecto ('es') una sola vez
    SELECT id INTO v_default_language_id FROM public.languages WHERE iso_code = 'es';

    -- 1. Obtener datos del usuario destinatario (email, tenant_id y language_id)
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

    -- 2. Verificar si el tenant tiene activado este tipo de correo
    SELECT is_active INTO v_is_tenant_sending_active
    FROM public.tenant_template_settings
    WHERE tenant_id = v_tenant_id AND template_type = p_template_type;

    IF NOT v_is_tenant_sending_active THEN
        -- El tenant ha desactivado este correo, no hacer nada.
        RETURN;
    END IF;

    -- 3. Encontrar la plantilla maestra activa para el tipo e idioma del usuario
    SELECT id, subject, body_html INTO v_template_id, v_template_subject, v_template_body_html
    FROM public.email_templates
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000' -- Plantilla maestra
      AND template_type = p_template_type
      AND language_id = v_language_id
      AND is_active = true;

    IF NOT FOUND THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, status, error_message)
        VALUES (v_tenant_id, v_recipient_email, 'FAILED', 'Active master template not found for type ' || p_template_type || ' and language_id ' || v_language_id);
        RETURN;
    END IF;

    -- 4. Procesar las variables en el asunto y cuerpo
    v_processed_subject := v_template_subject;
    v_processed_body_html := v_template_body_html;

    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_template_data)
    LOOP
        v_processed_subject := replace(v_processed_subject, '{{' || v_key || '}}', v_value);
        v_processed_body_html := replace(v_processed_body_html, '{{' || v_key || '}}', v_value);
    END LOOP;

    -- 5. Llamar a la función de envío real (que crearemos a continuación)
    -- ESTA ES LA PARTE QUE FALTA. POR AHORA, SIMULAREMOS UN ÉXITO.
    -- PERFORM send_email_via_gmail_api(v_recipient_email, v_processed_subject, v_processed_body_html);

    -- 6. Registrar el éxito (temporalmente aquí)
    INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status)
    VALUES (v_tenant_id, v_recipient_email, v_template_id, 'SENT');

EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.email_logs (tenant_id, recipient_email, template_id, status, error_message)
        VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), COALESCE(v_recipient_email, 'unknown'), v_template_id, 'FAILED', SQLERRM);
END;
$$;
