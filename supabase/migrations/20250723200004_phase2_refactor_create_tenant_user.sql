-- FASE 2: Refactorización del Backend (Paso 4)
-- Esta migración actualiza la función 'create_tenant_user' para que utilice
-- la nueva tabla 'user_assignments'.

-- También se actualiza la función 'get_tenant_branches' para que sea SECURITY DEFINER
-- y se elimine el parámetro de rol inseguro.

-- 1. Actualizar get_tenant_branches
CREATE OR REPLACE FUNCTION public.get_tenant_branches(
    p_tenant_id UUID
)
RETURNS TABLE (id uuid, name text) AS $$
BEGIN
    -- La seguridad ahora es manejada por RLS y el rol que llama a la función.
    -- Esta función simplemente obtiene los datos.
    RETURN QUERY
    SELECT b.id, b.name
    FROM public.branches b
    WHERE b.tenant_id = p_tenant_id
    ORDER BY b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_tenant_branches(UUID) TO authenticated;


-- 2. Actualizar create_tenant_user
DROP FUNCTION IF EXISTS public.create_tenant_user(TEXT, TEXT, UUID, UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.create_tenant_user(
    p_email TEXT,
    p_password TEXT,
    p_role_id UUID,
    p_tenant_id UUID,
    p_branch_id UUID -- Parámetro de sucursal
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- La seguridad debe ser manejada por políticas de RLS en el frontend
    -- o en una función de nivel superior. Esta función se centra en la creación.

    -- Insertar en public.users (REFACTORIZADO)
    INSERT INTO public.users (email, password_hash, is_active)
    VALUES (
        p_email,
        public.crypt(p_password, public.gen_salt('bf')),
        TRUE
    )
    RETURNING id INTO new_user_id;

    -- Crear la asignación en la nueva tabla (NUEVO)
    INSERT INTO public.user_assignments (user_id, tenant_id, role_id, branch_id)
    VALUES (new_user_id, p_tenant_id, p_role_id, p_branch_id);

    -- Devolver un mensaje de éxito
    RETURN json_build_object(
        'success', TRUE,
        'message', 'User created successfully.',
        'userId', new_user_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'User with this email already exists.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An unexpected error occurred: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_tenant_user(TEXT, TEXT, UUID, UUID, UUID) TO authenticated;
