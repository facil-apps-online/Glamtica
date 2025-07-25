-- Crear la función RPC para invitar o asignar un usuario a un tenant.
-- Esta función contiene la lógica de seguridad para diferenciar entre
-- 'tenant_super_admin' y 'tenant_admin', asegurando que los admins
-- solo puedan asignar usuarios a las sucursales que gestionan.

CREATE OR REPLACE FUNCTION public.invite_or_assign_user(
    p_invoking_user_id UUID,
    p_invoking_user_role TEXT,
    p_tenant_id UUID,
    p_target_branch_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_password TEXT,
    p_role_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_user_id UUID;
    new_user_id UUID;
    user_id_to_assign UUID;
    tenant_admin_role_id UUID;
BEGIN
    -- 1. Guarda de Seguridad de Roles
    IF p_invoking_user_role NOT IN ('super_admin', 'tenant_super_admin', 'tenant_admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado. Permisos insuficientes.');
    END IF;

    -- 2. Validación específica para tenant_admin
    IF p_invoking_user_role = 'tenant_admin' THEN
        -- Obtener el ID del rol 'tenant_admin' para la comprobación
        SELECT id INTO tenant_admin_role_id FROM public.roles WHERE name = 'tenant_admin' LIMIT 1;

        -- Verificar si el admin que invoca tiene permiso sobre la sucursal objetivo
        IF NOT EXISTS (
            SELECT 1 FROM public.user_assignments
            WHERE user_id = p_invoking_user_id
              AND tenant_id = p_tenant_id
              AND branch_id = p_target_branch_id
              AND role_id = tenant_admin_role_id
              AND status = 'active'
        ) THEN
            RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado. No tienes permisos de administrador sobre la sucursal especificada.');
        END IF;
    END IF;

    -- 3. Lógica de Creación o Asignación de Usuario
    SELECT id INTO existing_user_id FROM public.users WHERE email = p_email;

    IF existing_user_id IS NULL THEN
        -- Usuario no existe, crearlo
        IF p_password IS NULL OR p_password = '' THEN
            RETURN jsonb_build_object('success', false, 'message', 'La contraseña es obligatoria para nuevos usuarios.');
        END IF;

        INSERT INTO public.users (email, first_name, last_name, password_hash)
        VALUES (p_email, p_first_name, p_last_name, crypt(p_password, gen_salt('bf')))
        RETURNING id INTO new_user_id;

        user_id_to_assign := new_user_id;
    ELSE
        -- Usuario ya existe, verificar si ya está en el tenant
        IF EXISTS (
            SELECT 1 FROM public.user_assignments
            WHERE user_id = existing_user_id AND tenant_id = p_tenant_id
        ) THEN
            RETURN jsonb_build_object('success', false, 'message', 'Este usuario ya es miembro de este negocio.');
        END IF;
        user_id_to_assign := existing_user_id;
    END IF;

    -- 4. Crear la nueva asignación
    INSERT INTO public.user_assignments (user_id, tenant_id, branch_id, role_id, status)
    VALUES (user_id_to_assign, p_tenant_id, p_target_branch_id, p_role_id, 'active');

    -- 5. Devolver éxito
    RETURN jsonb_build_object('success', true, 'message', 'Usuario asignado correctamente.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ha ocurrido un error inesperado: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_or_assign_user(UUID, TEXT, UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO public;
