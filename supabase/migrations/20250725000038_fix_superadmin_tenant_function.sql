-- Corrige la función para usar 'platforms' en lugar de 'applications'
CREATE OR REPLACE FUNCTION create_superadmin_and_tenant(
    p_tenant_name TEXT,
    p_admin_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_platform_id UUID;
    v_role_id UUID;
    v_new_user_id UUID;
    v_new_tenant_id UUID;
    v_response JSONB;
BEGIN
    -- 1. Obtener el ID de la plataforma existente.
    SELECT id INTO v_platform_id FROM public.platforms LIMIT 1;
    IF v_platform_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ninguna plataforma en la tabla platforms.';
    END IF;

    -- 2. Obtener el ID del rol 'super_admin'.
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'super_admin' LIMIT 1;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el rol ''super_admin''.';
    END IF;

    -- 3. Crear el nuevo tenant, referenciando platform_id.
    INSERT INTO public.tenants (name, platform_id)
    VALUES (p_tenant_name, v_platform_id)
    RETURNING id INTO v_new_tenant_id;

    -- 4. Crear el usuario directamente en auth.users para invitarlo.
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, email_change_token_current, email_change_sent_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_admin_email,
        '',
        NULL,
        '',
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}',
        '{}',
        now(),
        now(),
        '',
        '',
        '',
        '',
        NULL
    ) RETURNING id INTO v_new_user_id;

    -- 5. Asignar el rol de superadministrador al nuevo usuario en el nuevo tenant.
    INSERT INTO public.user_assignments (user_id, tenant_id, role_id, status)
    VALUES (v_new_user_id, v_new_tenant_id, v_role_id, 'active');

    -- 6. Devolver una respuesta exitosa.
    v_response := jsonb_build_object(
        'success', true,
        'message', 'Tenant y superadministrador creados exitosamente.',
        'user_id', v_new_user_id,
        'tenant_id', v_new_tenant_id
    );
    RETURN v_response;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', SQLERRM
        );
END;
$$;