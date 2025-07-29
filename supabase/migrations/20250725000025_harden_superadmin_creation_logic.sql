-- Migration: 20250725000025_harden_superadmin_creation_logic.sql
-- Description: Hardens the create_application_superadmin function to be idempotent.
-- This prevents errors when the platform name already exists by ensuring the platform_id is always returned.

-- Step 1: Drop the previous version of the function.
DROP FUNCTION IF EXISTS public.create_application_superadmin(TEXT, TEXT);

-- Step 2: Recreate the function with hardened, idempotent logic for platform creation.
CREATE OR REPLACE FUNCTION public.create_application_superadmin(
    p_admin_email TEXT,
    p_application_name TEXT
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
    -- Ensure this function can only be run once.
    SELECT public.check_superadmin_exists() INTO v_superadmin_exists;
    IF v_superadmin_exists THEN
        RAISE EXCEPTION 'A super_admin already exists. Initial setup cannot be run again.';
    END IF;

    -- Create the Platform idempotently.
    -- This ensures v_platform_id is ALWAYS populated, even if the platform already exists.
    INSERT INTO public.platforms (name, description, base_url)
    VALUES (p_application_name, 'Main application platform', '/')
    ON CONFLICT (name) DO UPDATE 
    SET name = EXCLUDED.name -- This is a no-op trick to ensure RETURNING always executes
    RETURNING id INTO v_platform_id;

    -- Create the System Owner Tenant for this platform.
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES (p_application_name || ' Control Panel', true, 'active', v_platform_id)
    ON CONFLICT (name) DO UPDATE SET is_system_owner = true
    RETURNING id INTO v_system_tenant_id;

    IF v_system_tenant_id IS NULL THEN
        SELECT id INTO v_system_tenant_id FROM public.tenants WHERE name = (p_application_name || ' Control Panel');
    END IF;

    -- Create the super_admin user in Supabase Auth via invitation.
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;

    -- Get the super_admin role details.
    SELECT id, name INTO v_super_admin_role_id, v_super_admin_role_name FROM public.roles WHERE name = 'super_admin';
    IF v_super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "super_admin" not found.';
    END IF;

    -- Construct the full, correct app_metadata object.
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

-- COMMENT: Hardens the initial setup RPC to be idempotent, preventing errors on re-runs.
