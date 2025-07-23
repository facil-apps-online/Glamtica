-- FASE 2: Refactorización del Backend (Paso 2)
-- Esta migración actualiza la función 'register_new_tenant' para que utilice
-- la nueva tabla 'user_assignments'.

CREATE OR REPLACE FUNCTION public.register_new_tenant(
    p_business_name TEXT,
    p_admin_email TEXT,
    p_admin_password TEXT
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_branch_id UUID;
    v_role_id UUID;
    v_user_id UUID;
    v_hashed_password TEXT;
BEGIN
    -- Hash the password (sin cambios)
    v_hashed_password := crypt(p_admin_password, gen_salt('bf'));

    -- Insert new tenant (sin cambios)
    INSERT INTO public.tenants (name, subscription_status)
    VALUES (p_business_name, 'trial')
    RETURNING id INTO v_tenant_id;

    -- Insert main branch for the new tenant (sin cambios)
    INSERT INTO public.branches (tenant_id, name, address)
    VALUES (v_tenant_id, 'Main Branch', 'Default Address')
    RETURNING id INTO v_branch_id;

    -- Get the role_id for 'tenant_super_admin' (sin cambios)
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'tenant_super_admin';

    -- Insert the admin user (REFACTORIZADO)
    -- Se inserta solo la identidad en 'users'.
    INSERT INTO public.users (email, password_hash, is_active)
    VALUES (p_admin_email, v_hashed_password, TRUE)
    RETURNING id INTO v_user_id;

    -- Create the assignment in the new table (NUEVO)
    -- Se vincula el usuario con el tenant y el rol. branch_id es NULL para este rol.
    INSERT INTO public.user_assignments (user_id, tenant_id, role_id, branch_id)
    VALUES (v_user_id, v_tenant_id, v_role_id, NULL);

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos no necesitan cambiarse, solo se reemplaza la función.
GRANT EXECUTE ON FUNCTION public.register_new_tenant(TEXT, TEXT, TEXT) TO authenticated;
