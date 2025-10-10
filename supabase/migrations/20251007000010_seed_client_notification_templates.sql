DO $$
DECLARE
    lang_es_id UUID;
    platform_glamtica_id UUID;
    v_system_owner_tenant_id UUID;
BEGIN
    -- Obtener el ID del idioma español para Colombia
    SELECT id INTO lang_es_id FROM public.languages WHERE iso_code = 'es-CO';
    IF lang_es_id IS NULL THEN
        RAISE EXCEPTION 'El idioma con iso_code="es-CO" no fue encontrado.';
    END IF;

    -- Obtener el ID de la plataforma Glamtica
    SELECT id INTO platform_glamtica_id FROM public.platforms WHERE name = 'Glamtica';
    IF platform_glamtica_id IS NULL THEN
        RAISE EXCEPTION 'La plataforma "Glamtica" no fue encontrada.';
    END IF;

    -- Obtener el tenant_id del dueño del sistema para esa plataforma
    SELECT t.id INTO v_system_owner_tenant_id
    FROM public.tenants t
    WHERE t.is_system_owner = true AND t.platform_id = platform_glamtica_id
    LIMIT 1;
    IF v_system_owner_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un tenant dueño del sistema para la plataforma Glamtica.';
    END IF;

    -- Plantilla 1: Creación de Atención (para confirmación del cliente)
    INSERT INTO public.email_templates (
        tenant_id, platform_id, template_type, name, subject, body_html, language_id, 
        is_customizable, is_disableable, propagate_to_new_tenants
    )
    VALUES (
        v_system_owner_tenant_id, 
        platform_glamtica_id, 
        'CLIENT_ATTENTION_CREATED', 
        'Cliente - Nueva Atención Creada', 
        'Confirma tu cita en {{branch_name}}', 
        '<div style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <img src="https://glamtica.app/glamtica.app.png" alt="Glamtica Logo" style="max-width: 150px; margin-bottom: 20px;">
                <h2>Confirma tu Cita</h2>
                <p>Hola {{client_name}},</p>
                <p>Hemos agendado una cita para ti en <strong>{{branch_name}}</strong>.</p>
                <p><strong>Detalles:</strong></p>
                <ul>
                    <li><strong>Fecha:</strong> {{attention_date}}</li>
                    <li><strong>Hora:</strong> {{attention_time}}</li>
                    <li><strong>Servicios/Productos:</strong> {{attention_details}}</li>
                </ul>
                <p>Por favor, confirma tu asistencia o cancela la cita usando los botones a continuación.</p>
                <div style="margin: 30px 0;">
                    <a href="{{confirmation_url}}" style="background-color: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Confirmar Cita</a>
                    <a href="{{cancellation_url}}" style="background-color: #dc3545; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">Cancelar Cita</a>
                </div>
                <p style="font-size: 0.8em; color: #888;">Si no realizas ninguna acción, tu cita permanecerá en estado pendiente.</p>
            </div>
        </div>',
        lang_es_id, true, true, true
    ) ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

    -- Plantilla 2: Envío de Recibo de Atención
    INSERT INTO public.email_templates (
        tenant_id, platform_id, template_type, name, subject, body_html, language_id, 
        is_customizable, is_disableable, propagate_to_new_tenants
    )
    VALUES (
        v_system_owner_tenant_id, 
        platform_glamtica_id, 
        'CLIENT_ATTENTION_RECEIPT', 
        'Cliente - Recibo de Atención', 
        'Tu recibo de {{branch_name}}', 
        '<div style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <img src="https://glamtica.app/glamtica.app.png" alt="Glamtica Logo" style="max-width: 150px; margin-bottom: 20px;">
                <h2>Gracias por tu visita</h2>
                <p>Hola {{client_name}},</p>
                <p>Adjuntamos el resumen de tu atención en <strong>{{branch_name}}</strong> el día {{attention_date}}.</p>
                <div style="padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                    <p><strong>Total Pagado:</strong> {{total_amount}}</p>
                    <p><strong>Recibo #:</strong> {{receipt_number}}</p>
                </div>
                <p>¡Esperamos verte de nuevo pronto!</p>
            </div>
        </div>',
        lang_es_id, true, true, true
    ) ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

    -- Plantilla 3: Envío de Factura Electrónica
    INSERT INTO public.email_templates (
        tenant_id, platform_id, template_type, name, subject, body_html, language_id, 
        is_customizable, is_disableable, propagate_to_new_tenants
    )
    VALUES (
        v_system_owner_tenant_id, 
        platform_glamtica_id, 
        'CLIENT_INVOICE_SENT', 
        'Cliente - Envío de Factura', 
        'Tu factura de {{branch_name}}', 
        '<div style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <img src="https://glamtica.app/glamtica.app.png" alt="Glamtica Logo" style="max-width: 150px; margin-bottom: 20px;">
                <h2>Factura Electrónica</h2>
                <p>Hola {{client_name}},</p>
                <p>Tu factura electrónica <strong>#{{invoice_number}}</strong> está lista.</p>
                <p>Puedes descargarla haciendo clic en el siguiente botón.</p>
                <div style="margin: 30px 0;">
                    <a href="{{invoice_download_url}}" style="background-color: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">Descargar Factura</a>
                </div>
                <p>Gracias por tu compra.</p>
            </div>
        </div>',
        lang_es_id, true, true, true
    ) ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

    -- Plantilla 4: Cancelación de Atención
    INSERT INTO public.email_templates (
        tenant_id, platform_id, template_type, name, subject, body_html, language_id, 
        is_customizable, is_disableable, propagate_to_new_tenants
    )
    VALUES (
        v_system_owner_tenant_id, 
        platform_glamtica_id, 
        'CLIENT_ATTENTION_CANCELED', 
        'Cliente - Atención Cancelada', 
        'Tu cita en {{branch_name}} ha sido cancelada', 
        '<div style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <img src="https://glamtica.app/glamtica.app.png" alt="Glamtica Logo" style="max-width: 150px; margin-bottom: 20px;">
                <h2>Cita Cancelada</h2>
                <p>Hola {{client_name}},</p>
                <p>Te informamos que tu cita en <strong>{{branch_name}}</strong> para el día {{attention_date}} a las {{attention_time}} ha sido cancelada.</p>
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            </div>
        </div>',
        lang_es_id, true, true, true
    ) ON CONFLICT (tenant_id, template_type, language_id) DO NOTHING;

END $$;