-- Migration: 20250725000030_fix_ownership_constraint_and_finalize_setup.sql
-- Description: This is the definitive setup migration. It corrects the database architecture
-- to allow for one owner per platform and consolidates the entire setup logic.

-- Step 1: Drop the old, incorrect unique index that only allowed one system owner in total.
DROP INDEX IF EXISTS public.unique_system_owner;

-- Step 2: Create the new, correct unique index.
-- This allows for one unique system owner PER platform.
CREATE UNIQUE INDEX IF NOT EXISTS unique_owner_per_platform
ON public.tenants (platform_id)
WHERE (is_system_owner = true);

-- Step 3: Create the roles table as the single source of truth for authorization.
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.roles IS 'Defines the roles within the entire application universe.';

-- Step 4: Seed the roles table with the defined roles for the system.
INSERT INTO public.roles (name, display_name, description) VALUES
    ('super_admin', 'Super Administrador', 'Puede gestionar todas las aplicaciones del universo.'),
    ('app_super_admin', 'Administrador de Aplicación', 'Puede gestionar la app que tenga asignada.'),
    ('investor', 'Inversionista', 'Puede acceder a la plataforma de administración para ver el estado de su inversión.'),
    ('tenant_super_admin', 'Super Administrador de Tenant', 'Puede parametrizar todo el tenant.'),
    ('tenant_admin', 'Administrador de Sucursal', 'Puede administrar una sucursal.'),
    ('tenant_user', 'Usuario de Tenant', 'Puede prestar servicios y vender productos.')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Recreate the check_superadmin_exists function to use the new roles table.
DROP FUNCTION IF EXISTS public.check_superadmin_exists();
CREATE OR REPLACE FUNCTION public.check_superadmin_exists()
RETURNS BOOLEAN AS $$
DECLARE
    v_super_admin_role_id UUID;
BEGIN
    SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM auth.users u,
             jsonb_array_elements(u.raw_app_meta_data->'assignments') as assignment
        WHERE (assignment->>'role_id')::UUID = v_super_admin_role_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Recreate the create_application_superadmin function with the final, correct logic.
DROP FUNCTION IF EXISTS public.create_application_superadmin(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_application_superadmin(
    p_admin_email TEXT,
    p_application_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_superadmin_exists BOOLEAN;
    v_platform_id UUID;
    v_system_tenant_id UUID;
    v_super_admin_role RECORD;
    v_new_user_id UUID;
    v_assignments JSONB;
    v_app_metadata JSONB;
BEGIN
    -- Check if a superadmin already exists.
    SELECT public.check_superadmin_exists() INTO v_superadmin_exists;
    IF v_superadmin_exists THEN
        RAISE EXCEPTION 'A super_admin already exists. Initial setup cannot be run again.';
    END IF;

    -- Create the Platform.
    INSERT INTO public.platforms (name, description, base_url)
    VALUES (p_application_name, 'Main application platform', '/')
    ON CONFLICT (name) DO UPDATE 
    SET name = EXCLUDED.name
    RETURNING id INTO v_platform_id;

    -- Create the System Owner Tenant for this platform.
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES (p_application_name || ' Control Panel', true, 'active', v_platform_id)
    ON CONFLICT (platform_id) WHERE (is_system_owner = true)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_system_tenant_id;

    -- Create the super_admin user in Supabase Auth via invitation.
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;

    -- Get the super_admin role details.
    SELECT id, name, display_name INTO v_super_admin_role FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role.id IS NULL THEN
        RAISE EXCEPTION 'Critical setup error: Role "super_admin" not found in public.roles.';
    END IF;

    -- Construct the full, correct app_metadata object.
    v_assignments := jsonb_build_array(
        jsonb_build_object(
            'assignment_id', gen_random_uuid(),
            'tenant_id', v_system_tenant_id,
            'tenant_name', p_application_name || ' Control Panel',
            'role_id', v_super_admin_role.id,
            'role', v_super_admin_role.name,
            'role_display_name', v_super_admin_role.display_name,
            'branch_id', null,
            'branch_name', null,
            'status', 'active'
        )
    );

    v_app_metadata := jsonb_build_object(
        'assignments', v_assignments,
        'role', v_super_admin_role.name,
        'tenant_id', v_system_tenant_id,
        'branch_id', null,
        'assignment_status', 'active'
    );

    -- Update the user's metadata directly.
    UPDATE auth.users
    SET raw_app_meta_data = v_app_metadata
    WHERE id = v_new_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Application, tenant, and super admin created. Please check email for invitation.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to the anonymous role for the initial setup screen.
GRANT EXECUTE ON FUNCTION public.create_application_superadmin(TEXT, TEXT) TO anon;

-- COMMENT: Corrects the ownership constraint and finalizes the initial setup RPC.
