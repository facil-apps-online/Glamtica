-- Crear una función RPC de prueba para enviar un correo de bienvenida al admin de un tenant
CREATE OR REPLACE FUNCTION public.trigger_test_email_for_tenant(
    p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user RECORD;
BEGIN
    -- 1. Encontrar al usuario administrador principal de este tenant
    SELECT u.id, u.name INTO v_admin_user
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.tenant_id = p_tenant_id
      AND r.name = 'tenant_super_admin'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No se encontró un usuario administrador para este tenant.');
    END IF;

    -- 2. Llamar a la función principal de envío de correos
    --    Usamos la plantilla 'WELCOME_USER' como prueba.
    PERFORM public.trigger_system_email(
        p_recipient_user_id := v_admin_user.id,
        p_template_type := 'WELCOME_USER',
        p_template_data := jsonb_build_object('user_name', COALESCE(v_admin_user.name, 'Administrador'))
    );

    -- 3. Devolver una respuesta de éxito
    --    Nota: La entrega real del correo es asíncrona. Esto solo confirma que se puso en cola.
    RETURN jsonb_build_object(
        'success', true,
        'message', 'El correo de prueba de bienvenida ha sido puesto en la cola de envío para el usuario ' || v_admin_user.id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$;
