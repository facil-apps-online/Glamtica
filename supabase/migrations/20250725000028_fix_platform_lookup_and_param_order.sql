-- Migration: 20250725000028_fix_platform_lookup_and_param_order.sql
-- Description: This migration definitively fixes the superadmin creation function.
-- It corrects the function parameter order to match the client and ensures the platform lookup is robust.

-- Step 1: Drop the faulty function created by the previous migration.
DROP FUNCTION IF EXISTS public.create_application_superadmin(TEXT, TEXT);

-- Step 2: Recreate the function with the correct parameter order and logic.
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

    -- Pragmatic solution: Find the one and only platform that already exists.
    SELECT id INTO v_platform_id FROM public.platforms LIMIT 1;
    IF v_platform_id IS NULL THEN
        RAISE EXCEPTION 'Critical setup error: No platform found. Please create a platform first.';
    END IF;

    -- Create the System Owner Tenant for this platform, using the provided name.
    INSERT INTO public.tenants (name, is_system_owner, subscription_status, platform_id)
    VALUES (p_application_name || ' Control Panel', true, 'active', v_platform_id)
    ON CONFLICT (name) DO UPDATE SET is_system_owner = true
    RETURNING id INTO v_system_tenant_id;

    -- Create the super_admin user in Supabase Auth via invitation.
    SELECT auth.admin_create_user(p_admin_email) INTO v_new_user_id;

    -- Get the super_admin role details from our new table.
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

-- COMMENT: Definitive fix for the superadmin creation RPC.
