-- Crear la RPC final para encolar un correo de prueba.
CREATE OR REPLACE FUNCTION public.enqueue_test_email()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_super_admin_user_id UUID;
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

    -- 2. Insertar el trabajo en la cola
    INSERT INTO public.email_queue (recipient_user_id, template_type, template_data)
    VALUES (
        v_super_admin_user_id,
        'WELCOME_USER',
        jsonb_build_object('user_name', 'Super Admin (Prueba de Cola)')
    );

    RETURN jsonb_build_object('success', true, 'message', 'Correo de prueba encolado exitosamente.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error inesperado al encolar: ' || SQLERRM);
END;
$$;
