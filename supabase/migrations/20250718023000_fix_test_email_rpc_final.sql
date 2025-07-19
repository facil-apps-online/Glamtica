-- Corregir la función de prueba para usar first_name y last_name
CREATE OR REPLACE FUNCTION public.trigger_test_email_for_tenant(
    p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user RECORD;
    v_full_name TEXT;
BEGIN
    -- 1. Encontrar al usuario administrador principal y sus nombres
    SELECT u.id, u.first_name, u.last_name INTO v_admin_user
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.tenant_id = p_tenant_id
      AND r.name = 'tenant_super_admin'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No se encontró un usuario administrador para este tenant.');
    END IF;

    -- 2. Construir el nombre completo, con valores por defecto si son nulos
    v_full_name := TRIM(COALESCE(v_admin_user.first_name, '') || ' ' || COALESCE(v_admin_user.last_name, ''));
    IF v_full_name = '' THEN
        v_full_name := 'Administrador';
    END IF;

    -- 3. Llamar a la función principal de envío de correos
    PERFORM public.trigger_system_email(
        p_recipient_user_id := v_admin_user.id,
        p_template_type := 'WELCOME_USER',
        p_template_data := jsonb_build_object('user_name', v_full_name)
    );

    -- 4. Devolver una respuesta de éxito
    RETURN jsonb_build_object(
        'success', true,
        'message', 'El correo de prueba de bienvenida ha sido puesto en la cola de envío para el usuario ' || v_admin_user.id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$;
