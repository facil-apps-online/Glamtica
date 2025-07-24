-- Corrige la función enqueue_test_email para que use user_assignments
CREATE OR REPLACE FUNCTION public.enqueue_test_email()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_super_admin_user_id UUID;
    v_new_job public.email_queue;
BEGIN
    -- 1. Encontrar al super_admin del sistema usando la tabla de asignaciones
    SELECT ua.user_id INTO v_super_admin_user_id
    FROM public.user_assignments ua
    JOIN public.roles r ON ua.role_id = r.id
    WHERE r.name = 'super_admin'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No se encontró al usuario super_admin del sistema.');
    END IF;

    -- 2. Insertar el trabajo en la cola y devolverlo
    INSERT INTO public.email_queue (recipient_user_id, template_type, template_data)
    VALUES (
        v_super_admin_user_id,
        'WELCOME_USER',
        jsonb_build_object('user_name', 'Super Admin (Prueba de Cola)')
    ) RETURNING * INTO v_new_job;

    RETURN jsonb_build_object('success', true, 'job', row_to_json(v_new_job));

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Error inesperado al encolar: ' || SQLERRM);
END;
$$;
