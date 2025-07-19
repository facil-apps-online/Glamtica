-- Fase 3: Insertar las plantillas de correo iniciales para el Superadmin (Versión Corregida v3)

DO $$
DECLARE
    lang_es_id UUID;
    lang_en_id UUID;
    superadmin_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Obtener los IDs de los idiomas usando los iso_codes correctos de la BD
    SELECT id INTO lang_es_id FROM public.languages WHERE iso_code = 'es-CO';
    IF lang_es_id IS NULL THEN
        RAISE EXCEPTION 'El idioma con iso_code="es-CO" no fue encontrado. No se pueden insertar las plantillas.';
    END IF;

    SELECT id INTO lang_en_id FROM public.languages WHERE iso_code = 'en-US';
    IF lang_en_id IS NULL THEN
        RAISE EXCEPTION 'El idioma con iso_code="en-US" no fue encontrado. No se pueden insertar las plantillas.';
    END IF;

    -- Si llegamos aquí, los IDs de los idiomas existen. Procedemos con las inserciones.

    -- Plantilla: Bienvenida de Usuario (Sistema)
    INSERT INTO public.email_templates (tenant_id, template_type, name, subject, body_html, language_id, propagate_to_new_tenants)
    VALUES
        (superadmin_tenant_id, 'WELCOME_USER', 'Bienvenida al Sistema', '¡Bienvenido/a a Glamtice!', '<h1>¡Hola, {{user_name}}!</h1><p>Tu cuenta ha sido creada exitosamente. ¡Estamos felices de tenerte con nosotros!</p>', lang_es_id, false),
        (superadmin_tenant_id, 'WELCOME_USER', 'System Welcome', 'Welcome to Glamtice!', '<h1>Hi {{user_name}}!</h1><p>Your account has been successfully created. We are happy to have you with us!</p>', lang_en_id, false)
    ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

    -- Plantilla: Reseteo de Contraseña (Sistema)
    INSERT INTO public.email_templates (tenant_id, template_type, name, subject, body_html, language_id, propagate_to_new_tenants)
    VALUES
        (superadmin_tenant_id, 'PASSWORD_RESET', 'Reseteo de Contraseña', 'Instrucciones para resetear tu contraseña', '<h1>Hola, {{user_name}}</h1><p>Para resetear tu contraseña, por favor haz clic en el siguiente enlace: <a href="{{reset_link}}">Resetear Contraseña</a></p>', lang_es_id, false),
        (superadmin_tenant_id, 'PASSWORD_RESET', 'Password Reset', 'Password Reset Instructions', '<h1>Hi {{user_name}}</h1><p>To reset your password, please click the following link: <a href="{{reset_link}}">Reset Password</a></p>', lang_en_id, false)
    ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

    -- Plantilla: Confirmación de Cita (Propagable)
    INSERT INTO public.email_templates (tenant_id, template_type, name, subject, body_html, language_id, propagate_to_new_tenants)
    VALUES
        (superadmin_tenant_id, 'APPOINTMENT_CONFIRMATION', 'Confirmación de Cita', 'Tu cita en {{branch_name}} ha sido confirmada', '<h1>¡Cita Confirmada!</h1><p>Hola {{client_name}}, tu cita para el servicio de {{service_name}} con {{stylist_name}} el día {{appointment_date}} a las {{appointment_time}} ha sido confirmada.</p>', lang_es_id, true),
        (superadmin_tenant_id, 'APPOINTMENT_CONFIRMATION', 'Appointment Confirmation', 'Your appointment at {{branch_name}} is confirmed', '<h1>Appointment Confirmed!</h1><p>Hi {{client_name}}, your appointment for the {{service_name}} service with {{stylist_name}} on {{appointment_date}} at {{appointment_time}} has been confirmed.</p>', lang_en_id, true)
    ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

    -- Plantilla: Recordatorio de Cita (Propagable)
    INSERT INTO public.email_templates (tenant_id, template_type, name, subject, body_html, language_id, propagate_to_new_tenants)
    VALUES
        (superadmin_tenant_id, 'APPOINTMENT_REMINDER', 'Recordatorio de Cita', 'Recordatorio de tu cita mañana en {{branch_name}}', '<h1>¡No lo olvides!</h1><p>Hola {{client_name}}, te recordamos tu cita para mañana. Detalles: {{service_name}} con {{stylist_name}} a las {{appointment_time}}.</p>', lang_es_id, true),
        (superadmin_tenant_id, 'APPOINTMENT_REMINDER', 'Appointment Reminder', 'Reminder of your appointment tomorrow at {{branch_name}}', '<h1>Don''t forget!</h1><p>Hi {{client_name}}, this is a reminder for your appointment tomorrow. Details: {{service_name}} with {{stylist_name}} at {{appointment_time}}.</p>', lang_en_id, true)
    ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

END $$;
