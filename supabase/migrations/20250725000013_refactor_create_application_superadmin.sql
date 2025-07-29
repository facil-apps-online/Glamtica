-- Migration: 20250725000013_refactor_create_application_superadmin.sql
-- Description: Refactors the create_application_superadmin RPC to orchestrate the entire initial setup
-- of a new application, its system tenant, and its superadministrator.

-- Step 1: Drop the old function signature.
DROP FUNCTION IF EXISTS public.create_application_superadmin(TEXT);
DROP FUNCTION IF EXISTS public.create_application_superadmin(TEXT, TEXT);

-- Step 2: Create the new, unified function.
CREATE OR REPLACE FUNCTION public.create_application_superadmin(
    p_application_name TEXT,
    p_admin_email TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_superadmin_exists BOOLEAN;
    v_platform_id UUID;
    v_system_tenant_id UUID;
    v_super_admin_role_id UUID;
    v_super_admin_role_name TEXT;
    v_new_user_id UUID;
    v_assignments JSONB;
    v_app_metadata JSONB;
BEGIN
    -- Step 2a: Ensure this function can only be run once.
    SELECT public.check_superadmin_exists() INTO v_superadmin_exists;
    IF v_superadmin_exists THEN
        RAISE EXCEPTION 'A super_admin already exists. Initial setup cannot be run again.';
    END IF;

    -- Step 2b: Create the Platform.
    INSERT INTO public.platforms (name, description, base_url)
    VALUES (p_application_name, 'Main application platform', '/')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO v_platform_id;

    IF v_platform_id IS NULL THEN
        SELECT id INTO v_platform_id FROM public.platforms WHERE name = p_application_name;
    END IF;

    -- Step 2c: Create the System Owner Tenant for this platform.
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES (p_application_name || ' Control Panel', true, 'active', v_platform_id)
    ON CONFLICT (name) DO UPDATE SET is_system_owner = true
    RETURNING id INTO v_system_tenant_id;

    IF v_system_tenant_id IS NULL THEN
        SELECT id INTO v_system_tenant_id FROM public.tenants WHERE name = (p_application_name || ' Control Panel');
    END IF;

    -- Step 2d: Create the super_admin user in Supabase Auth via invitation.
    -- This sends a magic link or invite email for the user to set their password.
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;

    -- Step 2e: Get the super_admin role details.
    SELECT id, name INTO v_super_admin_role_id, v_super_admin_role_name FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "super_admin" not found.';
    END IF;

    -- Step 2f: Construct the full, correct app_metadata object.
    -- This includes both the top-level claims for the initial session and the full assignments array.
    v_assignments := jsonb_build_array(
        jsonb_build_object(
            'assignment_id', gen_random_uuid(),
            'tenant_id', v_system_tenant_id,
            'tenant_name', p_application_name || ' Control Panel',
            'role_id', v_super_admin_role_id,
            'role', v_super_admin_role_name,
            'branch_id', null,
            'branch_name', null,
            'status', 'active'
        )
    );

    v_app_metadata := jsonb_build_object(
        'assignments', v_assignments,
        'role', v_super_admin_role_name,
        'tenant_id', v_system_tenant_id,
        'branch_id', null,
        'assignment_status', 'active'
    );

    -- Step 2g: Update the user's metadata directly.
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

-- COMMENT: Refactors the RPC to securely set up the first application, its system tenant, and the superadministrator user with consistent metadata.
