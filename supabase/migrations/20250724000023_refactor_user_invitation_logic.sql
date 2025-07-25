-- Paso 1: Eliminar la función RPC anterior que era demasiado compleja.
DROP FUNCTION IF EXISTS public.invite_or_assign_user(UUID, TEXT, UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID);

-- Paso 2: Crear la nueva función simplificada para vincular un usuario a un tenant.
-- Su única responsabilidad es crear el usuario si no existe y luego crear una
-- asignación base 'pendiente de configuración' para marcarlo dentro del tenant.

CREATE OR REPLACE FUNCTION public.link_user_to_tenant(
    p_invoking_user_role TEXT,
    p_tenant_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_user_id UUID;
    user_id_to_link UUID;
BEGIN
    -- 1. Guarda de Seguridad de Roles
    IF p_invoking_user_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado. Permisos insuficientes.');
    END IF;

    -- 2. Lógica de Creación o Vinculación de Usuario
    SELECT id INTO existing_user_id FROM public.users WHERE email = p_email;

    IF existing_user_id IS NULL THEN
        -- Usuario no existe, crearlo
        IF p_password IS NULL OR p_password = '' THEN
            RETURN jsonb_build_object('success', false, 'message', 'La contraseña es obligatoria para nuevos usuarios.');
        END IF;

        INSERT INTO public.users (email, first_name, last_name, password_hash)
        VALUES (p_email, p_first_name, p_last_name, crypt(p_password, gen_salt('bf')))
        RETURNING id INTO user_id_to_link;
    ELSE
        -- Usuario ya existe
        user_id_to_link := existing_user_id;
    END IF;

    -- 3. Verificar si el usuario ya está vinculado a este tenant
    IF EXISTS (
        SELECT 1 FROM public.user_assignments
        WHERE user_id = user_id_to_link AND tenant_id = p_tenant_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este usuario ya es miembro de este negocio.');
    END IF;

    -- 4. Crear la asignación 'pendiente'
    INSERT INTO public.user_assignments (user_id, tenant_id, status)
    VALUES (user_id_to_link, p_tenant_id, 'pending_configuration');

    -- 5. Devolver éxito
    RETURN jsonb_build_object('success', true, 'message', 'Usuario vinculado correctamente. Ahora puedes configurar sus asignaciones.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ha ocurrido un error inesperado: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_user_to_tenant(TEXT, UUID, TEXT, TEXT, TEXT, TEXT) TO public;
