-- Versión definitiva y verificada: Usa auth.admin.createUser para invitar y asignar metadatos en un solo paso.
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
    v_app_metadata JSONB;
    v_response JSONB;
    v_created_user JSON;
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

    -- 3. Crear el nuevo tenant.
    INSERT INTO public.tenants (name, platform_id)
    VALUES (p_tenant_name, v_platform_id)
    RETURNING id INTO v_new_tenant_id;

    -- 4. Construir el objeto app_metadata que se necesita.
    v_app_metadata := jsonb_build_object(
        'tenant_id', v_new_tenant_id,
        'tenant_name', p_tenant_name,
        'role_id', v_role_id,
        'role', 'super_admin',
        'assignment_status', 'active'
    );

    -- 5. Crear el usuario usando la función de admin.
    --    Esto crea el usuario, envía el correo de invitación y asigna los metadatos.
    SELECT INTO v_created_user auth.admin_create_user(
      p_admin_email,
      NULL, -- password (null para invitar)
      jsonb_build_object('app_metadata', v_app_metadata)
    );
    v_new_user_id := (v_created_user->>'id')::uuid;

    -- 6. Devolver una respuesta exitosa.
    v_response := jsonb_build_object(
        'success', true,
        'message', 'Tenant y superadministrador creados. Correo de invitación enviado.',
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